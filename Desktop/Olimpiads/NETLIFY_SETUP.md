# Netlify Deployment Guide

This guide will help you deploy the FIST Olympiads website to Netlify with Postgres database support.

## Prerequisites

1. A Netlify account (sign up at https://netlify.com)
2. A GitHub account with your repository pushed

## Step 1: Add Netlify Postgres Database

1. Go to your Netlify dashboard
2. Navigate to your site (or create a new site)
3. Go to **Data** → **Postgres**
4. Click **Add Postgres database**
5. Note the database connection details

## Step 2: Set Environment Variables

In your Netlify dashboard:

1. Go to **Site settings** → **Environment variables**
2. Add the following variables:

```
NETLIFY_DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
NETLIFY_DATABASE_URL_UNPOOLED=postgresql://user:password@host:port/database?sslmode=require
NODE_ENV=production
PORT=8888
SESSION_SECRET=your-secret-key-here-change-this
```

**Important**: 
- Replace the connection string with your actual Netlify Postgres connection details
- Use a strong, random `SESSION_SECRET` (you can generate one with: `openssl rand -base64 32`)

## Step 3: Configure Build Settings

In Netlify dashboard → **Site settings** → **Build & deploy**:

- **Build command**: `npm install`
- **Publish directory**: Leave empty (we're using a server)
- **Functions directory**: Leave empty

## Step 4: Add netlify.toml

Create a `netlify.toml` file in your project root:

```toml
[build]
  command = "npm install"
  publish = "."

[[plugins]]
  package = "@netlify/plugin-nextjs"

[functions]
  node_bundler = "esbuild"
```

## Step 5: Deploy

1. Connect your GitHub repository to Netlify
2. Netlify will automatically detect your repository
3. Configure the build settings as above
4. Click **Deploy site**

## Step 6: Verify Database Connection

After deployment:

1. Visit your site URL
2. Try logging into the admin panel
3. Check that data persists (create a blog post, then refresh)

## Troubleshooting

### Database Connection Issues

- Verify environment variables are set correctly
- Check that `NETLIFY_DATABASE_URL` is set
- Ensure SSL mode is set to `require` in the connection string

### Build Errors

- Make sure `pg` package is in `package.json`
- Check that all dependencies are listed
- Review build logs in Netlify dashboard

### Session Issues

- Ensure `SESSION_SECRET` is set
- For HTTPS sites, set `cookie.secure = true` in server.js

## Local Development

For local development, the app will automatically use SQLite if no database environment variables are set.

To use Postgres locally:

1. Create a `.env` file:
```
NETLIFY_DATABASE_URL=your-postgres-connection-string
NODE_ENV=development
```

2. Install dependencies:
```bash
npm install
```

3. Run the server:
```bash
npm start
```

## Notes

- The app automatically detects whether to use SQLite (local) or Postgres (Netlify)
- File uploads are stored in `public/uploads/` - you may need to configure Netlify storage for production
- Consider using Netlify Blobs or S3 for file storage in production

