// ============================================================================
// YPEC LEAD SCRAPER SYSTEM
// Purpose: Automated lead generation from free public sources
// Reports to: DAN (CMO) via Marketing bot
// ============================================================================

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const BOT_INFO = {
  name: 'YPEC-LeadScraper',
  reports_to: 'DAN (CMO)',
  company: 'Your Private Estate Chef',
  company_number: 7,
  purpose: 'Automated lead generation from public sources',
  actions: ['status', 'scrape', 'sources', 'validate', 'run']
};

// ============================================================================
// SCRAPER CONFIGURATION
// ============================================================================

const SCRAPER_SOURCES = {
  // Luxury real estate - high-end property buyers/owners
  zillow_luxury: {
    enabled: true,
    url_pattern: 'https://www.zillow.com/homes/for_sale/',
    min_price: 2000000, // $2M+ homes
    frequency: 'weekly',
    fields: ['address', 'city', 'state', 'zip', 'price']
  },

  // Local luxury event calendars (wine tastings, charity galas, etc.)
  luxury_events: {
    enabled: true,
    search_terms: ['charity gala', 'wine tasting', 'private event', 'estate sale'],
    frequency: 'weekly',
    fields: ['event_name', 'location', 'contact_email', 'organizer']
  },

  // LinkedIn Sales Navigator (manual export)
  linkedin_export: {
    enabled: true,
    upload_endpoint: '/api/ypec/lead-scraper/upload',
    frequency: 'manual',
    fields: ['name', 'title', 'company', 'email', 'location']
  },

  // Country club directories (publicly available)
  country_clubs: {
    enabled: false, // Enable manually for specific regions
    regions: [],
    frequency: 'monthly',
    fields: ['club_name', 'location', 'website']
  }
};

// ============================================================================
// MAIN HANDLER
// ============================================================================

module.exports = async (req, res) => {
  const { action, data } = req.body;

  try {
    switch (action) {
      case 'status':
        return await getStatus(req, res);

      case 'scrape':
        return await runScraper(req, res, data);

      case 'sources':
        return await getSources(req, res);

      case 'validate':
        return await validateLeads(req, res);

      case 'run':
        return await dailyRun(req, res);

      default:
        return res.status(400).json({
          error: 'Invalid action',
          available_actions: BOT_INFO.actions
        });
    }
  } catch (error) {
    console.error(`[${BOT_INFO.name}] Error:`, error);
    return res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// STATUS
// ============================================================================

async function getStatus(req, res) {
  // Get scraping statistics
  const { data: leads } = await supabase
    .from('ypec_inquiries')
    .select('id, status, created_at, referral_source')
    .eq('referral_source', 'Lead Scraper');

  const today = new Date();
  const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const metrics = {
    total_leads_scraped: leads?.length || 0,
    this_week: leads?.filter(l => new Date(l.created_at) >= thisWeek).length || 0,
    this_month: leads?.filter(l => new Date(l.created_at) >= thisMonth).length || 0,
    converted: leads?.filter(l => l.status === 'converted').length || 0,
    active_sources: Object.keys(SCRAPER_SOURCES).filter(k => SCRAPER_SOURCES[k].enabled).length
  };

  return res.json({
    bot: BOT_INFO,
    status: 'active',
    metrics,
    sources: SCRAPER_SOURCES,
    last_run: new Date().toISOString()
  });
}

// ============================================================================
// RUN SCRAPER
// ============================================================================

async function runScraper(req, res, data) {
  const { source } = data || {};

  console.log(`[${BOT_INFO.name}] Starting scraper run${source ? ` for ${source}` : ''}`);

  let totalLeads = 0;
  const results = {};

  // If specific source requested, run only that one
  const sourcesToRun = source
    ? [source]
    : Object.keys(SCRAPER_SOURCES).filter(k => SCRAPER_SOURCES[k].enabled);

  for (const sourceName of sourcesToRun) {
    const sourceConfig = SCRAPER_SOURCES[sourceName];

    if (!sourceConfig || !sourceConfig.enabled) {
      console.log(`[${BOT_INFO.name}] Skipping disabled source: ${sourceName}`);
      continue;
    }

    try {
      let leads = [];

      switch (sourceName) {
        case 'zillow_luxury':
          leads = await scrapeZillowLuxury(sourceConfig);
          break;

        case 'luxury_events':
          leads = await scrapeLuxuryEvents(sourceConfig);
          break;

        case 'linkedin_export':
          // Manual upload - skip in automated runs
          console.log(`[${BOT_INFO.name}] LinkedIn export requires manual upload`);
          break;

        default:
          console.log(`[${BOT_INFO.name}] Unknown source: ${sourceName}`);
      }

      // Process and store leads
      if (leads && leads.length > 0) {
        const stored = await storeLeads(leads, sourceName);
        results[sourceName] = {
          scraped: leads.length,
          stored: stored.success,
          duplicates: stored.duplicates
        };
        totalLeads += stored.success;
      }

    } catch (error) {
      console.error(`[${BOT_INFO.name}] Error scraping ${sourceName}:`, error.message);
      results[sourceName] = { error: error.message };
    }
  }

  console.log(`[${BOT_INFO.name}] Scraper run complete: ${totalLeads} new leads`);

  return res.json({
    success: true,
    total_new_leads: totalLeads,
    sources_run: sourcesToRun.length,
    results,
    timestamp: new Date().toISOString()
  });
}

// ============================================================================
// SCRAPING FUNCTIONS
// ============================================================================

async function scrapeZillowLuxury(config) {
  console.log(`[${BOT_INFO.name}] Scraping Zillow luxury properties...`);

  // Use Zillow RSS feeds (free, public data)
  const { parseZillowRSS, getZillowRSSInstructions } = require('./scrapers/realestate-scraper');

  // Check if user has configured RSS feed URLs
  const rssFeeds = process.env.ZILLOW_RSS_FEEDS ? process.env.ZILLOW_RSS_FEEDS.split(',') : [];

  if (rssFeeds.length === 0) {
    console.log(`[${BOT_INFO.name}] No Zillow RSS feeds configured`);
    console.log(getZillowRSSInstructions());
    return [];
  }

  const leads = [];
  for (const rssUrl of rssFeeds) {
    try {
      const rssLeads = await parseZillowRSS(rssUrl.trim());
      leads.push(...rssLeads);
    } catch (error) {
      console.error(`[${BOT_INFO.name}] Error parsing RSS feed:`, error.message);
    }
  }

  console.log(`[${BOT_INFO.name}] Found ${leads.length} leads from Zillow RSS feeds`);
  return leads;
}

async function scrapeLuxuryEvents(config) {
  console.log(`[${BOT_INFO.name}] Scraping luxury event calendars...`);

  const { scrapeEventbrite } = require('./scrapers/eventbrite-scraper');

  const cities = ['Austin', 'Dallas', 'Houston', 'San Antonio'];
  const allLeads = [];

  for (const city of cities) {
    try {
      const leads = await scrapeEventbrite(city);
      allLeads.push(...leads);

      // Rate limiting between cities
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      console.error(`[${BOT_INFO.name}] Error scraping ${city}:`, error.message);
    }
  }

  console.log(`[${BOT_INFO.name}] Found ${allLeads.length} leads from Eventbrite`);
  return allLeads;
}

// ============================================================================
// STORE LEADS
// ============================================================================

async function storeLeads(leads, source) {
  let success = 0;
  let duplicates = 0;

  for (const lead of leads) {
    try {
      // Validate required fields
      if (!lead.email || !lead.name) {
        console.log(`[${BOT_INFO.name}] Skipping invalid lead:`, lead);
        continue;
      }

      // Check for duplicate
      const { data: existing } = await supabase
        .from('ypec_inquiries')
        .select('id')
        .eq('email', lead.email)
        .single();

      if (existing) {
        duplicates++;
        console.log(`[${BOT_INFO.name}] Duplicate lead: ${lead.email}`);
        continue;
      }

      // Create inquiry
      const { error } = await supabase
        .from('ypec_inquiries')
        .insert({
          email: lead.email,
          name: lead.name,
          phone: lead.phone || null,
          city: lead.city || null,
          state: lead.state || null,
          message: lead.message || `Automated lead from ${source}`,
          service_interest: lead.service_interest || 'Personal Chef',
          referral_source: 'Lead Scraper',
          status: 'new',
          lead_quality: lead.quality || 'warm',
          notes: JSON.stringify({
            scraper_source: source,
            scraped_at: new Date().toISOString(),
            ...lead.metadata
          })
        });

      if (error) {
        console.error(`[${BOT_INFO.name}] Error storing lead:`, error);
      } else {
        success++;
        console.log(`[${BOT_INFO.name}] Stored lead: ${lead.email}`);
      }

    } catch (error) {
      console.error(`[${BOT_INFO.name}] Error processing lead:`, error);
    }
  }

  return { success, duplicates };
}

// ============================================================================
// VALIDATE LEADS
// ============================================================================

async function validateLeads(req, res) {
  console.log(`[${BOT_INFO.name}] Validating scraped leads...`);

  // Get all leads from scraper
  const { data: leads } = await supabase
    .from('ypec_inquiries')
    .select('*')
    .eq('referral_source', 'Lead Scraper')
    .eq('status', 'new');

  let validated = 0;
  let invalid = 0;

  for (const lead of leads || []) {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(lead.email)) {
        await supabase
          .from('ypec_inquiries')
          .update({ status: 'invalid', notes: 'Invalid email format' })
          .eq('id', lead.id);
        invalid++;
        continue;
      }

      // Mark as validated
      await supabase
        .from('ypec_inquiries')
        .update({
          status: 'reviewing',
          lead_quality: calculateLeadQuality(lead)
        })
        .eq('id', lead.id);

      validated++;

    } catch (error) {
      console.error(`[${BOT_INFO.name}] Error validating lead:`, error);
    }
  }

  return res.json({
    success: true,
    validated,
    invalid,
    total_checked: leads?.length || 0
  });
}

// ============================================================================
// HELPER: CALCULATE LEAD QUALITY
// ============================================================================

function calculateLeadQuality(lead) {
  let score = 0;

  // Has phone number
  if (lead.phone) score += 20;

  // Has location data
  if (lead.city && lead.state) score += 20;

  // Has message/notes
  if (lead.message && lead.message.length > 20) score += 20;

  // Has service interest specified
  if (lead.service_interest && lead.service_interest !== 'Unknown') score += 20;

  // Scoring
  if (score >= 80) return 'hot';
  if (score >= 50) return 'warm';
  return 'cold';
}

// ============================================================================
// GET SOURCES
// ============================================================================

async function getSources(req, res) {
  return res.json({
    success: true,
    sources: SCRAPER_SOURCES,
    active: Object.keys(SCRAPER_SOURCES).filter(k => SCRAPER_SOURCES[k].enabled),
    inactive: Object.keys(SCRAPER_SOURCES).filter(k => !SCRAPER_SOURCES[k].enabled)
  });
}

// ============================================================================
// DAILY RUN
// ============================================================================

async function dailyRun(req, res) {
  console.log(`[${BOT_INFO.name}] Daily run started`);

  // Run enabled scrapers
  await runScraper({ body: {} }, null);

  // Validate new leads
  await validateLeads({ body: {} }, null);

  return res.json({
    success: true,
    message: 'Daily scraper run completed',
    timestamp: new Date().toISOString()
  });
}
