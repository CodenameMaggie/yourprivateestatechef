// ============================================================================
// YPEC EMAIL ROUTER
// Routes incoming emails from Port 25 to appropriate YPEC bots
// Integrates with Forbes Command email infrastructure
// ============================================================================

const axios = require('axios');

const EMAIL_ROUTES = {
  // Primary contact emails
  'concierge@yourprivateestatechef.com': {
    bot: 'concierge',
    action: 'acknowledge',
    priority: 'high',
    description: 'Main inquiry email - new client inquiries'
  },
  'info@yourprivateestatechef.com': {
    bot: 'concierge',
    action: 'acknowledge',
    priority: 'normal',
    description: 'General information requests'
  },
  'hello@yourprivateestatechef.com': {
    bot: 'concierge',
    action: 'acknowledge',
    priority: 'normal',
    description: 'General inquiries'
  },

  // Department-specific emails
  'chef-relations@yourprivateestatechef.com': {
    bot: 'chef-relations',
    action: 'recruit',
    priority: 'normal',
    description: 'Chef applications and recruitment'
  },
  'operations@yourprivateestatechef.com': {
    bot: 'operations',
    action: 'schedule',
    priority: 'normal',
    description: 'Event scheduling and operations'
  },
  'billing@yourprivateestatechef.com': {
    bot: 'revenue',
    action: 'invoices',
    priority: 'high',
    description: 'Billing and payment inquiries'
  },
  'revenue@yourprivateestatechef.com': {
    bot: 'revenue',
    action: 'invoices',
    priority: 'high',
    description: 'Revenue and financial matters'
  },
  'marketing@yourprivateestatechef.com': {
    bot: 'marketing',
    action: 'referrals',
    priority: 'normal',
    description: 'Marketing and partnership inquiries'
  },

  // Support aliases
  'support@yourprivateestatechef.com': {
    bot: 'concierge',
    action: 'acknowledge',
    priority: 'high',
    description: 'Customer support requests'
  },
  'help@yourprivateestatechef.com': {
    bot: 'concierge',
    action: 'acknowledge',
    priority: 'high',
    description: 'Help requests'
  }
};

/**
 * Main email routing handler
 * Called by Forbes Command Port 25 email listener
 * @param {Object} email - Parsed email object
 * @returns {Object} Routing result
 */
async function routeEmail(email) {
  const { to, from, subject, body, headers } = email;

  console.log(`[EmailRouter] Incoming email to: ${to}`);
  console.log(`[EmailRouter] From: ${from}`);
  console.log(`[EmailRouter] Subject: ${subject}`);

  // Find route configuration
  const route = EMAIL_ROUTES[to.toLowerCase()];

  if (!route) {
    console.log(`[EmailRouter] No route found for: ${to}`);
    return {
      success: false,
      error: 'No route configured for this email address',
      fallback: 'concierge' // Default fallback
    };
  }

  // Extract email data
  const emailData = parseEmailData(email);

  try {
    // Route to appropriate bot
    const botEndpoint = `/api/ypec/${route.bot}`;
    const response = await axios.post(`http://localhost:3000${botEndpoint}`, {
      action: route.action,
      data: emailData
    }, {
      timeout: 30000
    });

    console.log(`[EmailRouter] Successfully routed to ${route.bot}`);

    return {
      success: true,
      bot: route.bot,
      action: route.action,
      response: response.data
    };

  } catch (error) {
    console.error(`[EmailRouter] Error routing to ${route.bot}:`, error.message);

    return {
      success: false,
      error: error.message,
      bot: route.bot,
      action: route.action
    };
  }
}

/**
 * Parse email into structured data for bot consumption
 * @param {Object} email - Raw email object
 * @returns {Object} Structured email data
 */
function parseEmailData(email) {
  // Extract sender info
  const fromMatch = email.from.match(/(.+?)\s*<(.+?)>/) || [null, email.from, email.from];
  const senderName = fromMatch[1] ? fromMatch[1].trim().replace(/^"|"$/g, '') : '';
  const senderEmail = fromMatch[2] || email.from;

  // Extract phone number from signature if present
  const phoneRegex = /(\+?1?\s*\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/;
  const phoneMatch = email.body.match(phoneRegex);
  const phone = phoneMatch ? phoneMatch[1] : null;

  // Try to extract city/state from signature
  const cityStateRegex = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})/;
  const locationMatch = email.body.match(cityStateRegex);
  const city = locationMatch ? locationMatch[1] : null;
  const state = locationMatch ? locationMatch[2] : null;

  // Determine service interest from subject/body
  const serviceInterest = detectServiceInterest(email.subject, email.body);

  return {
    email: senderEmail,
    name: senderName || 'Unknown',
    phone: phone,
    city: city,
    state: state,
    message: email.body,
    subject: email.subject,
    service_interest: serviceInterest,
    referral_source: 'Email',
    email_headers: {
      message_id: email.headers['message-id'],
      date: email.headers['date'],
      reply_to: email.headers['reply-to']
    }
  };
}

/**
 * Detect service interest from email content
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 * @returns {string} Detected service type
 */
function detectServiceInterest(subject, body) {
  const content = `${subject} ${body}`.toLowerCase();

  if (content.includes('full-time') || content.includes('full time') || content.includes('40 hours')) {
    return 'Full-Time Chef';
  }
  if (content.includes('weekly') || content.includes('part-time') || content.includes('part time')) {
    return 'Weekly Service';
  }
  if (content.includes('event') || content.includes('party') || content.includes('dinner party') || content.includes('celebration')) {
    return 'Event Catering';
  }
  if (content.includes('consultation') || content.includes('learn more') || content.includes('information')) {
    return 'Consultation';
  }
  if (content.includes('chef application') || content.includes('join') || content.includes('work with')) {
    return 'Chef Application';
  }

  return 'Personal Chef'; // Default
}

/**
 * Get email routing configuration for display/debugging
 * @returns {Object} Email routes
 */
function getRoutes() {
  return EMAIL_ROUTES;
}

/**
 * Test email routing (for development)
 * @param {string} toEmail - Destination email address
 * @param {Object} testData - Test email data
 * @returns {Object} Routing test result
 */
async function testRoute(toEmail, testData) {
  const testEmail = {
    to: toEmail,
    from: testData.from || 'test@example.com',
    subject: testData.subject || 'Test Email',
    body: testData.body || 'This is a test email',
    headers: testData.headers || {}
  };

  console.log(`[EmailRouter] Testing route for: ${toEmail}`);

  return await routeEmail(testEmail);
}

// Express route handler
module.exports = async (req, res) => {
  const { action, data } = req.body;

  try {
    switch (action) {
      case 'route':
        const result = await routeEmail(data);
        return res.json(result);

      case 'test':
        const testResult = await testRoute(data.email);
        return res.json(testResult);

      case 'routes':
        return res.json({ routes: EMAIL_ROUTES });

      default:
        return res.status(400).json({
          error: 'Invalid action',
          available_actions: ['route', 'test', 'routes']
        });
    }
  } catch (error) {
    console.error('[EmailRouter] Error:', error);
    return res.status(500).json({
      error: 'Email routing failed',
      message: error.message
    });
  }
};

// Export helper functions for direct use
module.exports.routeEmail = routeEmail;
module.exports.parseEmailData = parseEmailData;
module.exports.detectServiceInterest = detectServiceInterest;
module.exports.getRoutes = () => EMAIL_ROUTES;
module.exports.testRoute = testRoute;
module.exports.EMAIL_ROUTES = EMAIL_ROUTES;
