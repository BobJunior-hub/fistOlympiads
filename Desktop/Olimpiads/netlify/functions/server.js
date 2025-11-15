// Netlify serverless function wrapper for Express app
const serverless = require('serverless-http');
const app = require('../../server');

// Wrap Express app for Netlify Functions
exports.handler = serverless(app);
