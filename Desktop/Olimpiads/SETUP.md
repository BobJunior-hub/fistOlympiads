# Quick Setup Guide

## Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)

## Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Server**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

3. **Access the Website**
   - Open your browser and go to: `http://localhost:3000`
   - Admin panel: `http://localhost:3000/admin`
   - Default admin credentials:
     - Username: `admin`
     - Password: `admin123`

## First Steps After Setup

1. **Change the Admin Password**
   - Log in to the admin panel
   - For security, you should change the default password
   - (You can do this by modifying the database or adding a password change feature)

2. **Add Content**
   - Add upcoming Olympiad dates
   - Create blog posts
   - Upload events with photos and certificates
   - Add study resources

3. **Customize**
   - Edit the HTML files in `public/` to customize content
   - Modify `public/css/style.css` to change the design
   - Update contact information in `contact.html`

## File Structure

- `server.js` - Main server file with all API endpoints
- `public/` - All frontend files (HTML, CSS, JavaScript)
- `public/admin/` - Admin panel pages
- `public/uploads/` - Directory for uploaded files (created automatically)
- `olympiads.db` - SQLite database (created automatically on first run)

## Features Included

✅ Home page with upcoming dates display
✅ Blog with category filtering
✅ About Us page
✅ Events page with photos and certificates
✅ Resources page for study materials
✅ Contact form
✅ Admin panel for content management
✅ Responsive design
✅ File upload support

## Additional Features You Can Add

- User registration and login for students
- Email notifications
- Search functionality
- Comments on blog posts
- Calendar view for events
- Download statistics
- Newsletter subscription

## Troubleshooting

**Port already in use:**
- Change the PORT in `server.js` or set environment variable: `PORT=3001 npm start`

**Database errors:**
- Delete `olympiads.db` and restart the server to recreate it

**File upload issues:**
- Ensure `public/uploads/` directory exists and has write permissions

## Production Deployment

Before deploying to production:

1. Change the session secret in `server.js`
2. Use environment variables for sensitive data
3. Set up proper database backups
4. Configure HTTPS
5. Set up proper file storage (consider cloud storage for uploads)
6. Add rate limiting and security headers
7. Change default admin password

