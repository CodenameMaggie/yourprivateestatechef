/**
 * YPEC API Server
 * Express server for all Forbes Command bots and lead systems
 */

const path = require('path');

// Load environment variables first
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  next();
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'YPEC API Server',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Bot endpoints
const concierge = require('./ypec/concierge');
const chefRelations = require('./ypec/chef-relations');
const operations = require('./ypec/operations');
const revenue = require('./ypec/revenue');
const marketing = require('./ypec/marketing');
const leadScraper = require('./ypec/lead-scraper');
const leadUpload = require('./ypec/lead-upload');
const emailRouter = require('./ypec/email-router');
const payments = require('./ypec/payments');
const calendlyWebhook = require('./ypec/calendly-webhook');

app.post('/api/ypec/concierge', concierge);
app.post('/api/ypec/chef-relations', chefRelations);
app.post('/api/ypec/operations', operations);
app.post('/api/ypec/revenue', revenue);
app.post('/api/ypec/marketing', marketing);
app.post('/api/ypec/lead-scraper', leadScraper);
app.post('/api/ypec/lead-upload', leadUpload);
app.post('/api/ypec/email-router', emailRouter);
app.post('/api/ypec/payments', payments);
app.post('/api/ypec/calendly-webhook', calendlyWebhook);

// Initialize cron jobs
const cronJobs = require('./ypec/cron-config');
console.log('🕐 Starting cron jobs...');
console.log(`📅 ${Object.keys(cronJobs).length} cron jobs initialized`);

// 404 handler - serve 404.html for missing routes
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '../public/404.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message, // Show error message for debugging
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ YPEC API Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Serving static files from: ${path.join(__dirname, '../public')}`);
  console.log(`🤖 Forbes Command bots initialized`);
  console.log(`📧 Email routing active`);
  console.log(`🔍 Lead scrapers ready`);
});

module.exports = app;
