# Olympiads Website

A comprehensive website for school pupils participating in Olympiads, featuring blog posts, events, resources, and an admin panel for content management.

## Features

- **Home Page**: Welcome page with upcoming Olympiad dates
- **Blog**: Categorized blog posts with dropdown menu (All Categories, Our History, Study Tips, Success Stories)
- **About Us**: Information about the Olympiad program
- **Events**: Past and upcoming events with photos and certificates
- **Resources**: Study materials and resources for Olympiad preparation
- **Contact Us**: Contact form for inquiries
- **Admin Panel**: Secure admin interface for managing all content

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

## Default Admin Credentials

- Username: `admin`
- Password: `admin123`

**Important**: Change the default password after first login in production!

## Project Structure

```
Olimpiads/
├── server.js              # Main server file
├── package.json           # Dependencies
├── public/                # Frontend files
│   ├── index.html        # Home page
│   ├── blog.html         # Blog page
│   ├── about.html        # About page
│   ├── events.html       # Events page
│   ├── resources.html    # Resources page
│   ├── contact.html      # Contact page
│   ├── css/              # Stylesheets
│   ├── js/               # JavaScript files
│   ├── admin/            # Admin panel
│   └── uploads/          # Uploaded files
└── olympiads.db          # SQLite database (created automatically)
```

## API Endpoints

### Public Endpoints
- `GET /api/blog-posts` - Get all blog posts (optional ?category=)
- `GET /api/events` - Get all events
- `GET /api/resources` - Get all resources
- `GET /api/olympiad-dates` - Get upcoming Olympiad dates
- `POST /api/contact` - Submit contact form

### Admin Endpoints (require authentication)
- `POST /api/login` - Admin login
- `POST /api/logout` - Admin logout
- `POST /api/blog-posts` - Create blog post
- `DELETE /api/blog-posts/:id` - Delete blog post
- `POST /api/events` - Create event
- `DELETE /api/events/:id` - Delete event
- `POST /api/resources` - Create resource
- `DELETE /api/resources/:id` - Delete resource
- `POST /api/olympiad-dates` - Create Olympiad date
- `DELETE /api/olympiad-dates/:id` - Delete Olympiad date

## Technologies Used

- Node.js & Express.js - Backend server
- SQLite - Database
- HTML/CSS/JavaScript - Frontend
- Multer - File uploads
- bcryptjs - Password hashing

## License

ISC

