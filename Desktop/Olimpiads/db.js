// Database adapter - supports both SQLite (local) and Postgres (Netlify)

let db;
let dbType;

// Check if we're using Netlify Postgres
if (process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL) {
  // Use Postgres for Netlify
  const { Pool } = require('pg');
  dbType = 'postgres';
  
  const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
  
  db = new Pool({
    connectionString: connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  console.log('Using Postgres database (Netlify)');
} else {
  // Use SQLite for local development
  const sqlite3 = require('sqlite3').verbose();
  dbType = 'sqlite';
  db = new sqlite3.Database('olympiads.db');
  console.log('Using SQLite database (local)');
}

// Database helper functions to abstract differences
const dbHelpers = {
  // Execute a query and return results
  query: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      if (dbType === 'postgres') {
        db.query(sql, params, (err, result) => {
          if (err) return reject(err);
          resolve(result.rows);
        });
      } else {
        db.all(sql, params, (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        });
      }
    });
  },
  
  // Get a single row
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      if (dbType === 'postgres') {
        db.query(sql, params, (err, result) => {
          if (err) return reject(err);
          resolve(result.rows[0] || null);
        });
      } else {
        db.get(sql, params, (err, row) => {
          if (err) return reject(err);
          resolve(row || null);
        });
      }
    });
  },
  
  // Run a query (INSERT, UPDATE, DELETE)
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      if (dbType === 'postgres') {
        db.query(sql, params, (err, result) => {
          if (err) return reject(err);
          resolve({ lastID: result.insertId || result.rows[0]?.id, changes: result.rowCount });
        });
      } else {
        db.run(sql, params, function(err) {
          if (err) return reject(err);
          resolve({ lastID: this.lastID, changes: this.changes });
        });
      }
    });
  },
  
  // Serialize operations (for SQLite table creation)
  serialize: (callback) => {
    if (dbType === 'postgres') {
      // Postgres doesn't need serialize, just run sequentially
      callback();
    } else {
      db.serialize(callback);
    }
  }
};

// Initialize database tables
async function initTables() {
  try {
    if (dbType === 'postgres') {
      // Postgres table creation
      await dbHelpers.run(`
        CREATE TABLE IF NOT EXISTS admins (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL
        )
      `);
      
      await dbHelpers.run(`
        CREATE TABLE IF NOT EXISTS blog_posts (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          category TEXT NOT NULL,
          image_url TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await dbHelpers.run(`
        CREATE TABLE IF NOT EXISTS events (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          event_date DATE,
          event_type TEXT,
          image_url TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await dbHelpers.run(`
        CREATE TABLE IF NOT EXISTS resources (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          resource_type TEXT,
          file_url TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await dbHelpers.run(`
        CREATE TABLE IF NOT EXISTS olympiad_dates (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          date DATE NOT NULL,
          registration_deadline DATE,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await dbHelpers.run(`
        CREATE TABLE IF NOT EXISTS contact_submissions (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT,
          subject TEXT,
          message TEXT NOT NULL,
          read INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Insert default admin if not exists
      const existingAdmin = await dbHelpers.get('SELECT * FROM admins WHERE username = $1', ['admin']);
      if (!existingAdmin) {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await dbHelpers.run('INSERT INTO admins (username, password) VALUES ($1, $2)', ['admin', hashedPassword]);
      }
    } else {
      // SQLite table creation (original code)
      dbHelpers.serialize(() => {
        dbHelpers.run(`CREATE TABLE IF NOT EXISTS admins (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL
        )`);
        
        dbHelpers.run(`CREATE TABLE IF NOT EXISTS blog_posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          category TEXT NOT NULL,
          image_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        dbHelpers.run(`CREATE TABLE IF NOT EXISTS events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          event_date DATE,
          event_type TEXT,
          image_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        dbHelpers.run(`CREATE TABLE IF NOT EXISTS resources (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          resource_type TEXT,
          file_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        dbHelpers.run(`CREATE TABLE IF NOT EXISTS olympiad_dates (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          date DATE NOT NULL,
          registration_deadline DATE,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        dbHelpers.run(`CREATE TABLE IF NOT EXISTS contact_submissions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT,
          subject TEXT,
          message TEXT NOT NULL,
          read INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        const bcrypt = require('bcryptjs');
        bcrypt.hash('admin123', 10, (err, hash) => {
          if (!err) {
            dbHelpers.run('INSERT OR IGNORE INTO admins (username, password) VALUES (?, ?)', ['admin', hash]);
          }
        });
      });
    }
    
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

module.exports = {
  db,
  dbHelpers,
  initTables,
  dbType
};

