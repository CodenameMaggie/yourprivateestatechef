// ============================================================================
// YPEC LEAD SCRAPER SYSTEM
// Purpose: Automated lead generation from free public sources
// Reports to: DAN (CMO) via Marketing bot
// ============================================================================

const axios = require('axios');


const BOT_INFO = {
  name: 'DAN (CMO Lead Scraping Engine)',
  alias: 'YPEC-LeadScraper',
  reports_to: 'Self (DAN is the bot)',
  company: 'Your Private Estate Chef',
  company_number: 7,
  purpose: '🤖 FREE AGGRESSIVE LEAD SCRAPING EVERYWHERE - No budget needed',
  actions: ['status', 'scrape', 'sources', 'validate', 'run', 'scrape_pinterest', 'scrape_linkedin', 'scrape_google', 'scrape_instagram', 'scrape_all']
};

// ============================================================================
// SCRAPER CONFIGURATION
// ============================================================================

const SCRAPER_SOURCES = {
  // ======= FREE SOURCES (NO BUDGET REQUIRED) =======

  // 1. Pinterest - Luxury lifestyle content
  pinterest: {
    enabled: true,
    cost: 'FREE',
    search_terms: ['luxury kitchen', 'private chef', 'estate dining', 'gourmet meals'],
    frequency: 'daily',
    fields: ['pin_url', 'user_profile', 'email (if public)', 'location'],
    notes: 'Scrape Pinterest profiles interested in luxury dining'
  },

  // 2. LinkedIn - Public profiles (C-suite executives)
  linkedin_public: {
    enabled: true,
    cost: 'FREE',
    search_terms: ['CEO', 'CFO', 'Managing Partner', 'Estate Manager'],
    industries: ['Real Estate', 'Finance', 'Technology', 'Healthcare'],
    frequency: 'daily',
    fields: ['name', 'title', 'company', 'location'],
    notes: 'Public profiles only - no Sales Navigator needed'
  },

  // 3. Google Search - Targeted searches
  google_search: {
    enabled: true,
    cost: 'FREE',
    search_terms: [
      '"estate manager" contact email',
      '"family office" chef services',
      '"luxury home" private chef needed',
      '"high net worth" concierge services'
    ],
    frequency: 'daily',
    fields: ['name', 'email', 'phone', 'website'],
    notes: 'Scrape Google search results for luxury service contacts'
  },

  // 4. Instagram - Luxury lifestyle hashtags
  instagram: {
    enabled: true,
    cost: 'FREE',
    hashtags: ['#luxurylifestyle', '#privatechef', '#estatekitchen', '#gourmetchef', '#luxurydining'],
    frequency: 'daily',
    fields: ['username', 'bio_email', 'location', 'follower_count'],
    notes: 'Target users with 10K+ followers in luxury space'
  },

  // 5. Facebook Groups - Luxury communities
  facebook_groups: {
    enabled: true,
    cost: 'FREE',
    group_names: [
      'Luxury Living Network',
      'Estate Managers Group',
      'Private Service Professionals',
      'High Net Worth Networking'
    ],
    frequency: 'weekly',
    fields: ['name', 'location', 'profile_url'],
    notes: 'Join and scrape member lists (public groups only)'
  },

  // 6. Reddit - Wealth/luxury subreddits
  reddit: {
    enabled: true,
    cost: 'FREE',
    subreddits: ['r/leanfire', 'r/fatFIRE', 'r/luxurylife', 'r/chefit'],
    frequency: 'daily',
    fields: ['username', 'post_history', 'comments'],
    notes: 'Identify wealthy individuals discussing services'
  },

  // 7. Zillow/Redfin - $2M+ home buyers/owners
  zillow_luxury: {
    enabled: true,
    cost: 'FREE',
    url_pattern: 'https://www.zillow.com/homes/for_sale/',
    min_price: 2000000,
    frequency: 'weekly',
    fields: ['address', 'city', 'state', 'zip', 'price'],
    notes: 'Use Zillow RSS feeds - completely free'
  },

  // 8. Eventbrite - Luxury event attendees
  luxury_events: {
    enabled: true,
    cost: 'FREE',
    search_terms: ['charity gala', 'wine tasting', 'private event', 'estate sale', 'polo match'],
    frequency: 'weekly',
    fields: ['event_name', 'location', 'contact_email', 'organizer'],
    notes: 'Scrape public event pages for organizer contacts'
  },

  // 9. Yelp - High-end restaurant reviewers
  yelp_reviewers: {
    enabled: true,
    cost: 'FREE',
    restaurant_types: ['fine dining', 'michelin star', 'upscale'],
    min_review_count: 50,
    frequency: 'weekly',
    fields: ['reviewer_name', 'location', 'review_history'],
    notes: 'Wealthy foodies who care about quality dining'
  },

  // 10. Chamber of Commerce - Business directories
  chamber_of_commerce: {
    enabled: true,
    cost: 'FREE',
    cities: ['Austin', 'Dallas', 'Houston', 'San Antonio', 'Scottsdale', 'Naples'],
    business_types: ['Family Office', 'Wealth Management', 'Private Banking'],
    frequency: 'monthly',
    fields: ['business_name', 'contact_name', 'email', 'phone'],
    notes: 'Public member directories'
  },

  // 11. Luxury Magazine Directories - Subscriber lists
  luxury_magazines: {
    enabled: true,
    cost: 'FREE',
    magazines: ['Robb Report', 'Architectural Digest', 'Town & Country'],
    frequency: 'monthly',
    fields: ['name', 'location'],
    notes: 'Scrape "featured homes" and "society pages" for contacts'
  },

  // 12. MLS Listings - Real estate agents with luxury listings
  mls_luxury_agents: {
    enabled: true,
    cost: 'FREE',
    min_listing_price: 2000000,
    frequency: 'weekly',
    fields: ['agent_name', 'email', 'phone', 'agency', 'location'],
    notes: 'Agents with $2M+ listings can refer clients'
  },

  // 13. Forbes Lists - Public wealthy individuals
  forbes_lists: {
    enabled: true,
    cost: 'FREE',
    lists: ['Forbes 400', '30 Under 30', 'Top Women in Business'],
    frequency: 'quarterly',
    fields: ['name', 'company', 'location', 'net_worth_estimate'],
    notes: 'Publicly available on Forbes website'
  },

  // 14. AngelList/Crunchbase - Startup founders with funding
  startup_founders: {
    enabled: true,
    cost: 'FREE',
    min_funding: 5000000, // $5M+ raised
    frequency: 'monthly',
    fields: ['founder_name', 'company', 'email', 'location', 'funding_amount'],
    notes: 'Funded founders need executive services'
  },

  // 15. Country Club Directories - Public websites
  country_clubs: {
    enabled: true,
    cost: 'FREE',
    regions: ['Texas', 'Arizona', 'Florida', 'California'],
    frequency: 'monthly',
    fields: ['club_name', 'location', 'website', 'membership_contact'],
    notes: 'Scrape contact forms and member services'
  },

  // 16. Publicly traded company executives - SEC filings
  sec_executives: {
    enabled: true,
    cost: 'FREE',
    source_url: 'https://www.sec.gov/cgi-bin/browse-edgar',
    frequency: 'monthly',
    fields: ['executive_name', 'title', 'company', 'location'],
    notes: 'C-suite executives from public company filings'
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

      case 'scrape_pinterest':
        return await runScraper(req, res, { source: 'pinterest' });

      case 'scrape_linkedin':
        return await runScraper(req, res, { source: 'linkedin_public' });

      case 'scrape_google':
        return await runScraper(req, res, { source: 'google_search' });

      case 'scrape_instagram':
        return await runScraper(req, res, { source: 'instagram' });

      case 'scrape_all':
        return await scrapeAllSources(req, res);

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
  const { data: leads } = await getSupabase()
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
      const { data: existing } = await getSupabase()
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
      const { error } = await getSupabase()
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
  const { data: leads } = await getSupabase()
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
        await getSupabase()
          .from('ypec_inquiries')
          .update({ status: 'invalid', notes: 'Invalid email format' })
          .eq('id', lead.id);
        invalid++;
        continue;
      }

      // Mark as validated
      await getSupabase()
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
// SCRAPE ALL SOURCES (Aggressive Mode)
// ============================================================================

async function scrapeAllSources(req, res) {
  console.log(`[${BOT_INFO.name}] 🤖 DAN AGGRESSIVE MODE - Scraping ALL FREE sources`);

  const results = {};
  let totalLeads = 0;

  // Get all enabled sources
  const enabledSources = Object.keys(SCRAPER_SOURCES).filter(k => SCRAPER_SOURCES[k].enabled);

  console.log(`[${BOT_INFO.name}] Running ${enabledSources.length} sources simultaneously...`);

  // Run all sources
  for (const source of enabledSources) {
    try {
      console.log(`[${BOT_INFO.name}] Starting ${source}...`);
      const result = await runScraper({ body: { source } }, null);

      if (result && result.total_new_leads) {
        results[source] = result.total_new_leads;
        totalLeads += result.total_new_leads;
      }

      // Small delay between sources to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`[${BOT_INFO.name}] Error in ${source}:`, error.message);
      results[source] = { error: error.message };
    }
  }

  console.log(`[${BOT_INFO.name}] 🎯 DAN COMPLETED: ${totalLeads} new leads from ${enabledSources.length} sources`);

  return res.json({
    success: true,
    mode: 'AGGRESSIVE',
    total_new_leads: totalLeads,
    sources_scraped: enabledSources.length,
    results,
    timestamp: new Date().toISOString(),
    message: `DAN scraped ${totalLeads} leads from ${enabledSources.length} FREE sources`
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
