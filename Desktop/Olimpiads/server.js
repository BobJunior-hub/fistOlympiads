const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const { db, dbHelpers, initTables } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'olympiads-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve static files, but exclude /api routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  express.static('public')(req, res, next);
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Initialize database
const db = new sqlite3.Database('olympiads.db');

// Create tables
db.serialize(() => {
  // Admin users table
  db.run(`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )`);

  // Blog posts table
  db.run(`CREATE TABLE IF NOT EXISTS blog_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    author TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    image_url TEXT
  )`);

  // Events table
  db.run(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE,
    event_type TEXT,
    image_url TEXT,
    certificate_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Resources table
  db.run(`CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT,
    resource_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Olympiad dates table
  db.run(`CREATE TABLE IF NOT EXISTS olympiad_dates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    registration_deadline DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Contact submissions table
  db.run(`CREATE TABLE IF NOT EXISTS contact_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read BOOLEAN DEFAULT 0
  )`);

  // Create default admin (username: admin, password: admin123)
  const defaultPassword = bcrypt.hashSync('admin123', 10);
  db.run(`INSERT OR IGNORE INTO admins (username, password) VALUES (?, ?)`, 
    ['admin', defaultPassword]);
});

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/blog', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'blog.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/events', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'events.html'));
});

app.get('/resources', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'resources.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'login.html'));
});

app.get('/admin/dashboard', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'dashboard.html'));
});

// API Routes - Authentication
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  db.get('SELECT * FROM admins WHERE username = ?', [username], (err, admin) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!admin || !bcrypt.compareSync(password, admin.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    req.session.userId = admin.id;
    res.json({ success: true });
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// API Routes - Blog Posts
app.get('/api/blog-posts', (req, res) => {
  const category = req.query.category;
  let query = 'SELECT * FROM blog_posts ORDER BY created_at DESC';
  let params = [];
  
  if (category && category !== 'all') {
    query = 'SELECT * FROM blog_posts WHERE category = ? ORDER BY created_at DESC';
    params = [category];
  }
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

app.get('/api/blog-posts/:id', (req, res) => {
  db.get('SELECT * FROM blog_posts WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(row);
  });
});

app.post('/api/blog-posts', requireAuth, upload.single('image'), (req, res) => {
  const { title, content, category, author } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  
  db.run(
    'INSERT INTO blog_posts (title, content, category, author, image_url) VALUES (?, ?, ?, ?, ?)',
    [title, content, category, author, imageUrl],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ id: this.lastID, success: true });
    }
  );
});

app.delete('/api/blog-posts/:id', requireAuth, (req, res) => {
  db.run('DELETE FROM blog_posts WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true });
  });
});

// API Routes - Events
app.get('/api/events', (req, res) => {
  db.all('SELECT * FROM events ORDER BY event_date DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

app.post('/api/events', requireAuth, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'certificate', maxCount: 1 }
]), (req, res) => {
  const { title, description, event_date, event_type } = req.body;
  const imageUrl = req.files.image ? `/uploads/${req.files.image[0].filename}` : null;
  const certificateUrl = req.files.certificate ? `/uploads/${req.files.certificate[0].filename}` : null;
  
  db.run(
    'INSERT INTO events (title, description, event_date, event_type, image_url, certificate_url) VALUES (?, ?, ?, ?, ?, ?)',
    [title, description, event_date, event_type, imageUrl, certificateUrl],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ id: this.lastID, success: true });
    }
  );
});

app.delete('/api/events/:id', requireAuth, (req, res) => {
  db.run('DELETE FROM events WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true });
  });
});

// API Routes - Resources
app.get('/api/resources', (req, res) => {
  db.all('SELECT * FROM resources ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

app.post('/api/resources', requireAuth, upload.single('file'), (req, res) => {
  const { title, description, resource_type } = req.body;
  const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
  
  db.run(
    'INSERT INTO resources (title, description, file_url, resource_type) VALUES (?, ?, ?, ?)',
    [title, description, fileUrl, resource_type],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ id: this.lastID, success: true });
    }
  );
});

app.delete('/api/resources/:id', requireAuth, (req, res) => {
  db.run('DELETE FROM resources WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true });
  });
});

// API Routes - Olympiad Dates
app.get('/api/olympiad-dates', (req, res) => {
  db.all('SELECT * FROM olympiad_dates WHERE date >= date("now") ORDER BY date ASC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

app.get('/api/all-olympiad-dates', requireAuth, (req, res) => {
  db.all('SELECT * FROM olympiad_dates ORDER BY date DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

app.post('/api/olympiad-dates', requireAuth, (req, res) => {
  const { title, date, description, registration_deadline } = req.body;
  
  db.run(
    'INSERT INTO olympiad_dates (title, date, description, registration_deadline) VALUES (?, ?, ?, ?)',
    [title, date, description, registration_deadline],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ id: this.lastID, success: true });
    }
  );
});

app.delete('/api/olympiad-dates/:id', requireAuth, (req, res) => {
  db.run('DELETE FROM olympiad_dates WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true });
  });
});

// Contact form submission
app.post('/api/contact', (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  
  if (!name || !email || !phone || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  db.run(
    'INSERT INTO contact_submissions (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
    [name, email, phone, subject, message],
    function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to submit message' });
      }
      res.json({ success: true, message: 'Thank you for your message! We will get back to you soon.' });
    }
  );
});

// API Routes - Contact Submissions (Admin only)
app.get('/api/contact-submissions', requireAuth, (req, res) => {
  console.log('Contact submissions request received'); // Debug log
  db.all('SELECT * FROM contact_submissions ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      console.error('Database error:', err); // Debug log
      return res.status(500).json({ error: 'Database error' });
    }
    console.log(`Returning ${rows.length} contact submissions`); // Debug log
    res.json(rows);
  });
});

app.put('/api/contact-submissions/:id/read', requireAuth, (req, res) => {
  db.run('UPDATE contact_submissions SET read = 1 WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true });
  });
});

app.delete('/api/contact-submissions/:id', requireAuth, (req, res) => {
  db.run('DELETE FROM contact_submissions WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true });
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  console.log(`404 - API route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'API route not found' });
});

// Export app for Netlify serverless functions
module.exports = app;

// Only start server if running locally (not in Netlify)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Available API routes:');
    console.log('  GET  /api/contact-submissions (requires auth)');
    console.log('  PUT  /api/contact-submissions/:id/read (requires auth)');
    console.log('  DELETE /api/contact-submissions/:id (requires auth)');
  });
}

