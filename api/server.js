/**
 * YPEC API Server
 * Express server for all Forbes Command bots and lead systems
 */

const path = require('path');

// Load environment variables first
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const cron = require('node-cron');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  }
}));

// HTTPS enforcement in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Secure CORS - whitelist specific origins
const allowedOrigins = [
  'https://yourprivateestatechef.com',
  'https://www.yourprivateestatechef.com'
];

// In development, allow localhost
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:3000');
  allowedOrigins.push('http://127.0.0.1:3000');
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Credentials', 'true');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful logins
});

// Apply rate limiting
app.use('/api/', apiLimiter);

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

// Authentication middleware
const { verifyActionAuth } = require('./ypec/middleware/auth');

// Public endpoints (no auth required)
app.post('/api/ypec/concierge', concierge);
app.post('/api/ypec/calendly-webhook', calendlyWebhook);
app.post('/api/ypec/payments', payments); // Stripe handles its own auth

// Operations endpoint with authentication and rate limiting
// Login actions have stricter rate limiting
app.post('/api/ypec/operations', loginLimiter, verifyActionAuth, operations);

// Protected endpoints (require authentication)
app.post('/api/ypec/chef-relations', chefRelations);
app.post('/api/ypec/revenue', revenue);
app.post('/api/ypec/marketing', marketing);
app.post('/api/ypec/lead-scraper', leadScraper);
app.post('/api/ypec/lead-upload', leadUpload);
app.post('/api/ypec/email-router', emailRouter);

// Initialize cron jobs
const cronJobs = require('./ypec/cron-config');
console.log('🕐 Starting cron jobs...');
console.log(`📅 ${Object.keys(cronJobs).length} cron jobs initialized`);

// 404 handler - serve 404.html for missing routes
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '../public/404.html'));
});

// Error handler - sanitize errors in production
app.use((err, req, res, next) => {
  console.error('[Server Error]', {
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });

  // Only send detailed errors in development
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  } else {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: err.message,
      stack: err.stack
    });
  }
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
