// Netlify serverless function wrapper for Express app
const serverless = require('serverless-http');

// Set Netlify environment variable
process.env.NETLIFY = 'true';

// Import app after setting environment
const app = require('../../server');

// Wrap Express app for Netlify Functions
const handler = serverless(app, {
  binary: ['image/*', 'application/pdf', 'application/zip']
});

exports.handler = async (event, context) => {
  // Return the handler
  return handler(event, context);
};
