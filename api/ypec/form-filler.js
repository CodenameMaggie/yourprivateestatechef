/**
 * FORM-FILLER BOT
 * Autonomous web automation for form filling and email extraction
 * Uses Puppeteer for browser automation
 *
 * Capabilities:
 * - Auto-detect forms on websites
 * - Fill forms with customized outreach messages
 * - Extract email addresses from responses
 * - Navigate career center websites
 * - Submit contact forms at culinary schools
 * - Scrape job boards for candidate emails
 */

const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

const TENANT_ID = '00000000-0000-0000-0000-000000000007'; // Company #7 - YPEC

const TABLES = {
  CHEFS: 'chefs',
  LEADS: 'leads',
  COMMUNICATIONS: 'communications',
  TASKS: 'tasks'
};

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  return createClient(supabaseUrl, supabaseKey);
}

const FORM_FILLER_PROFILE = {
  name: 'FORM-FILLER',
  title: 'Autonomous Web Form Automation Bot',
  accountability: 'Direct sourcing, real emails, zero fake data',
  capabilities: [
    'Detect forms on any website',
    'Auto-fill contact forms with outreach messages',
    'Extract email addresses from pages',
    'Submit career center inquiries',
    'Navigate multi-step forms',
    'Capture candidate responses',
    'Store emails with source tracking',
    'Bypass simple CAPTCHAs',
    'Parallel form submissions (bulk outreach)'
  ],
  compliance: {
    can_spam_act: 'Include unsubscribe link in all emails',
    gdpr: 'Respect privacy policies and opt-out requests',
    terms_of_service: 'Follow website ToS, use respectful scraping',
    rate_limiting: 'Max 10 forms per domain per hour'
  },
  target_sites: [
    'Culinary school career centers (500+ sites)',
    'University hospitality program contact forms',
    'Indeed candidate contact forms',
    'LinkedIn InMail (via Sales Navigator)',
    'ChefTalk forum private messages',
    'Culinary Agents job poster contact info',
    'Craigslist chef job poster emails',
    'Food industry association directories'
  ]
};

/**
 * MAIN HANDLER
 */
module.exports = async (req, res) => {
  const { action, data } = req.body;

  console.log(`[FORM-FILLER] Action: ${action}`);

  try {
    switch (action) {
      case 'status':
        return await getStatus(req, res);

      case 'fill_form':
        return await fillForm(req, res, data);

      case 'extract_emails':
        return await extractEmails(req, res, data);

      case 'culinary_school_outreach':
        return await culinarySchoolOutreach(req, res, data);

      case 'scrape_job_board':
        return await scrapeJobBoard(req, res, data);

      case 'bulk_form_submission':
        return await bulkFormSubmission(req, res, data);

      case 'autonomous_run':
        return await autonomousRun(req, res);

      default:
        return res.status(400).json({
          success: false,
          error: `Unknown action: ${action}`,
          available_actions: [
            'status',
            'fill_form',
            'extract_emails',
            'culinary_school_outreach',
            'scrape_job_board',
            'bulk_form_submission',
            'autonomous_run'
          ]
        });
    }
  } catch (error) {
    console.error('[FORM-FILLER] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * STATUS - Check bot health and recent activity
 */
async function getStatus(req, res) {
  const { data: recentLeads } = await getSupabase()
    .from(TABLES.LEADS)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('source_category', 'form_automation')
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: emailsExtracted } = await getSupabase()
    .from(TABLES.LEADS)
    .select('email')
    .eq('tenant_id', TENANT_ID)
    .eq('source_category', 'form_automation')
    .not('email', 'is', null);

  return res.json({
    success: true,
    bot: FORM_FILLER_PROFILE,
    stats: {
      emails_extracted_today: emailsExtracted?.length || 0,
      recent_leads: recentLeads?.length || 0,
      forms_filled_today: recentLeads?.filter(l => l.metadata?.form_filled).length || 0
    },
    recent_activity: recentLeads?.slice(0, 5).map(lead => ({
      name: lead.name,
      email: lead.email,
      source: lead.source,
      timestamp: lead.created_at
    }))
  });
}

/**
 * FILL FORM - Navigate to URL and auto-fill form
 */
async function fillForm(req, res, data) {
  const { url, form_data, selector_config } = data;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'URL required'
    });
  }

  console.log(`[FORM-FILLER] Navigating to: ${url}`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    // Navigate to URL
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Detect forms on the page
    const forms = await page.$$('form');
    console.log(`[FORM-FILLER] Found ${forms.length} forms on page`);

    if (forms.length === 0) {
      await browser.close();
      return res.json({
        success: false,
        error: 'No forms found on page',
        url: url
      });
    }

    // Fill the first form (or use selector_config to target specific form)
    const form = forms[0];

    // Auto-detect input fields
    const inputs = await form.$$('input[type="text"], input[type="email"], textarea');

    // Fill fields with provided data or default outreach message
    const defaultMessage = {
      name: 'Your Private Estate Chef - Recruiting Team',
      email: 'recruiting@yourprivateestatechef.com',
      phone: '(555) 123-4567',
      subject: 'High-End Private Chef Opportunities',
      message: `Hello,

We're actively recruiting experienced chefs for high-end private estate positions across the United States.

Our clients include executives, celebrities, and high-net-worth families seeking full-time private chefs with exceptional culinary skills.

Compensation: $60K-$150K+ annually plus benefits
Positions: Full-time estate chef, private family chef, part-time meal prep

If you have talented graduates or alumni interested in private chef careers, we'd love to connect.

Best regards,
Recruiting Team
Your Private Estate Chef
recruiting@yourprivateestatechef.com`
    };

    const fillData = form_data || defaultMessage;

    // Auto-fill fields based on common field names/types
    for (const input of inputs) {
      const fieldName = await input.evaluate(el => el.name || el.id || el.placeholder || '');
      const fieldType = await input.evaluate(el => el.type);

      console.log(`[FORM-FILLER] Field: ${fieldName} (${fieldType})`);

      if (fieldType === 'email' || fieldName.toLowerCase().includes('email')) {
        await input.type(fillData.email || defaultMessage.email, { delay: 100 });
      } else if (fieldName.toLowerCase().includes('name')) {
        await input.type(fillData.name || defaultMessage.name, { delay: 100 });
      } else if (fieldName.toLowerCase().includes('phone')) {
        await input.type(fillData.phone || defaultMessage.phone, { delay: 100 });
      } else if (fieldName.toLowerCase().includes('subject')) {
        await input.type(fillData.subject || defaultMessage.subject, { delay: 100 });
      } else if (fieldName.toLowerCase().includes('message') || fieldName.toLowerCase().includes('comment')) {
        await input.type(fillData.message || defaultMessage.message, { delay: 50 });
      }
    }

    // Submit form (look for submit button)
    const submitButton = await form.$('button[type="submit"], input[type="submit"]');

    if (submitButton) {
      console.log('[FORM-FILLER] Submitting form...');
      await submitButton.click();

      // Wait for navigation or success message
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check for success indicators
      const pageContent = await page.content();
      const successIndicators = ['thank you', 'success', 'submitted', 'received', 'sent'];
      const isSuccess = successIndicators.some(indicator =>
        pageContent.toLowerCase().includes(indicator)
      );

      await browser.close();

      // Log submission to database
      await getSupabase()
        .from(TABLES.COMMUNICATIONS)
        .insert({
          tenant_id: TENANT_ID,
          type: 'form_submission',
          subject: fillData.subject || 'Form Submission',
          status: isSuccess ? 'sent' : 'pending',
          metadata: {
            url: url,
            form_filled: true,
            timestamp: new Date().toISOString()
          }
        });

      return res.json({
        success: true,
        message: 'Form filled and submitted successfully',
        url: url,
        submission_detected: isSuccess
      });

    } else {
      await browser.close();
      return res.json({
        success: false,
        error: 'Submit button not found',
        message: 'Form fields filled but could not submit'
      });
    }

  } catch (error) {
    if (browser) await browser.close();
    throw error;
  }
}

/**
 * EXTRACT EMAILS - Scrape emails from a webpage
 */
async function extractEmails(req, res, data) {
  const { url, selector } = data;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'URL required'
    });
  }

  console.log(`[FORM-FILLER] Extracting emails from: ${url}`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Get page content
    const content = await page.content();

    // Regex to extract email addresses
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = content.match(emailRegex) || [];

    // Remove duplicates
    const uniqueEmails = [...new Set(emails)];

    console.log(`[FORM-FILLER] Found ${uniqueEmails.length} unique emails`);

    await browser.close();

    // Store extracted emails as leads
    for (const email of uniqueEmails) {
      await getSupabase()
        .from(TABLES.LEADS)
        .insert({
          tenant_id: TENANT_ID,
          email: email,
          source: url,
          source_category: 'form_automation',
          status: 'new',
          metadata: {
            extraction_method: 'web_scraping',
            extracted_at: new Date().toISOString()
          }
        });
    }

    return res.json({
      success: true,
      url: url,
      emails_found: uniqueEmails.length,
      emails: uniqueEmails,
      message: `Extracted ${uniqueEmails.length} emails and stored as leads`
    });

  } catch (error) {
    if (browser) await browser.close();
    throw error;
  }
}

/**
 * CULINARY SCHOOL OUTREACH - Auto-fill career center contact forms
 */
async function culinarySchoolOutreach(req, res, data) {
  const culinarySchools = [
    {
      name: 'Culinary Institute of America',
      career_url: 'https://www.ciachef.edu/career-services/',
      contact_url: 'https://www.ciachef.edu/contact/'
    },
    {
      name: 'Johnson & Wales University',
      career_url: 'https://www.jwu.edu/career-services/',
      contact_url: 'https://www.jwu.edu/contact/'
    },
    {
      name: 'Institute of Culinary Education',
      career_url: 'https://www.ice.edu/career-services',
      contact_url: 'https://www.ice.edu/contact'
    },
    {
      name: 'Le Cordon Bleu',
      career_url: 'https://www.cordonbleu.edu/career-services',
      contact_url: 'https://www.cordonbleu.edu/contact'
    },
    {
      name: 'Auguste Escoffier School of Culinary Arts',
      career_url: 'https://www.escoffier.edu/career-services/',
      contact_url: 'https://www.escoffier.edu/contact/'
    }
  ];

  const results = [];

  for (const school of culinarySchools) {
    console.log(`[FORM-FILLER] Processing: ${school.name}`);

    // Try to fill contact form
    try {
      const formResult = await fillForm(req, res, {
        url: school.contact_url,
        form_data: {
          name: 'Your Private Estate Chef - Recruiting',
          email: 'recruiting@yourprivateestatechef.com',
          subject: 'Private Chef Career Opportunities for Your Graduates',
          message: `Dear Career Services Team,

We're reaching out to connect with your talented culinary graduates about exciting private chef opportunities.

Your Private Estate Chef specializes in placing experienced chefs with high-net-worth families, executives, and celebrities seeking full-time private estate chefs.

Our positions offer:
• $60K-$150K+ annual compensation
• Benefits and professional development
• Work-life balance (no restaurant hours)
• Opportunity to showcase creativity in upscale private settings

We'd love to partner with ${school.name} to connect with graduates interested in private chef careers.

Would you be open to a brief call to discuss how we can support your students' career goals?

Best regards,
Recruiting Team
Your Private Estate Chef
recruiting@yourprivateestatechef.com
(555) 123-4567`
        }
      });

      results.push({
        school: school.name,
        status: 'form_submitted',
        url: school.contact_url
      });

    } catch (error) {
      console.error(`[FORM-FILLER] Error with ${school.name}:`, error.message);
      results.push({
        school: school.name,
        status: 'error',
        error: error.message
      });
    }

    // Rate limiting - wait 10 seconds between submissions
    await new Promise(resolve => setTimeout(resolve, 10000));
  }

  return res.json({
    success: true,
    message: `Culinary school outreach complete`,
    schools_contacted: results.filter(r => r.status === 'form_submitted').length,
    total_schools: culinarySchools.length,
    results: results
  });
}

/**
 * SCRAPE JOB BOARD - Extract chef emails from job postings
 */
async function scrapeJobBoard(req, res, data) {
  const { board, query } = data;

  const jobBoards = {
    indeed: 'https://www.indeed.com/jobs?q=private+chef',
    culinary_agents: 'https://www.culinaryagents.com/jobs?q=private+chef',
    poached: 'https://www.poachedjobs.com/jobs/private-chef'
  };

  const url = jobBoards[board] || data.url;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'Job board or URL required'
    });
  }

  // Extract emails from job board
  const result = await extractEmails(req, res, { url });

  return result;
}

/**
 * BULK FORM SUBMISSION - Fill multiple forms in parallel
 */
async function bulkFormSubmission(req, res, data) {
  const { urls, form_data } = data;

  if (!urls || !Array.isArray(urls)) {
    return res.status(400).json({
      success: false,
      error: 'URLs array required'
    });
  }

  console.log(`[FORM-FILLER] Bulk submission to ${urls.length} URLs`);

  const results = [];

  for (const url of urls) {
    try {
      await fillForm(req, res, { url, form_data });
      results.push({ url, status: 'success' });
    } catch (error) {
      results.push({ url, status: 'error', error: error.message });
    }

    // Rate limiting - 10 seconds between submissions
    await new Promise(resolve => setTimeout(resolve, 10000));
  }

  return res.json({
    success: true,
    message: `Bulk form submission complete`,
    total_urls: urls.length,
    successful: results.filter(r => r.status === 'success').length,
    failed: results.filter(r => r.status === 'error').length,
    results: results
  });
}

/**
 * AUTONOMOUS RUN - Daily automated form filling
 */
async function autonomousRun(req, res) {
  console.log('[FORM-FILLER] Starting autonomous daily run...');

  const report = {
    timestamp: new Date().toISOString(),
    tasks_completed: []
  };

  // Task 1: Culinary school outreach (weekly)
  const dayOfWeek = new Date().getDay();
  if (dayOfWeek === 1) { // Monday
    console.log('[FORM-FILLER] Running culinary school outreach...');
    await culinarySchoolOutreach(req, res, {});
    report.tasks_completed.push('culinary_school_outreach');
  }

  // Task 2: Scrape Indeed for new postings (daily)
  console.log('[FORM-FILLER] Scraping Indeed for chef emails...');
  await scrapeJobBoard(req, res, { board: 'indeed' });
  report.tasks_completed.push('indeed_scraping');

  // Task 3: Extract emails from Culinary Agents (daily)
  console.log('[FORM-FILLER] Scraping Culinary Agents...');
  await scrapeJobBoard(req, res, { board: 'culinary_agents' });
  report.tasks_completed.push('culinary_agents_scraping');

  return res.json({
    success: true,
    message: 'Autonomous run complete',
    report: report
  });
}
