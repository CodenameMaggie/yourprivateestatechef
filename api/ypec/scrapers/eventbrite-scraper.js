// ============================================================================
// EVENTBRITE FREE SCRAPER
// Scrapes public event listings from Eventbrite for luxury events
// 100% FREE - No API key required
// ============================================================================

const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrapes Eventbrite for luxury events in Texas cities
 * @param {string} city - City to search (Austin, Dallas, Houston, San Antonio)
 * @returns {Array} Array of potential leads from event organizers
 */
async function scrapeEventbrite(city) {
  const leads = [];

  const searchTerms = [
    'wine tasting',
    'charity gala',
    'private dining',
    'culinary event',
    'food festival',
    'chef dinner'
  ];

  for (const term of searchTerms) {
    try {
      const url = `https://www.eventbrite.com/d/tx--${city.toLowerCase()}/${encodeURIComponent(term)}/`;

      console.log(`[Eventbrite] Searching: ${term} in ${city}`);

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);

      // Parse event cards
      $('.search-event-card').each((i, elem) => {
        try {
          const eventName = $(elem).find('.event-card__title').text().trim();
          const organizerName = $(elem).find('.event-card__organizer').text().trim();
          const eventUrl = $(elem).find('a').attr('href');

          if (eventName && eventUrl) {
            leads.push({
              name: organizerName || 'Event Organizer',
              email: null, // Will need to visit event page to extract
              source: 'Eventbrite',
              event_name: eventName,
              event_url: eventUrl,
              city: city,
              search_term: term,
              lead_quality: 'warm',
              metadata: {
                found_at: new Date().toISOString(),
                event_type: term
              }
            });
          }
        } catch (err) {
          console.error('[Eventbrite] Error parsing event:', err.message);
        }
      });

      // Rate limiting - be respectful
      await sleep(2000);

    } catch (error) {
      console.error(`[Eventbrite] Error scraping ${term}:`, error.message);
    }
  }

  console.log(`[Eventbrite] Found ${leads.length} potential leads in ${city}`);
  return leads;
}

/**
 * Extract organizer contact from event page
 * @param {string} eventUrl - URL of the event page
 * @returns {Object} Organizer details with email if available
 */
async function extractOrganizerDetails(eventUrl) {
  try {
    const response = await axios.get(eventUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);

    // Try to find organizer email (may not always be public)
    let email = null;
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    const pageText = $('body').text();
    const emailMatches = pageText.match(emailRegex);

    if (emailMatches && emailMatches.length > 0) {
      // Filter out common non-personal emails
      email = emailMatches.find(e =>
        !e.includes('noreply') &&
        !e.includes('no-reply') &&
        !e.includes('eventbrite')
      );
    }

    const organizerName = $('.organizer-listing__name-link').text().trim();
    const organizerUrl = $('.organizer-listing__name-link').attr('href');

    return {
      organizer_name: organizerName,
      organizer_url: organizerUrl,
      email: email,
      phone: null // Phone numbers rarely public on Eventbrite
    };

  } catch (error) {
    console.error('[Eventbrite] Error extracting organizer:', error.message);
    return null;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  scrapeEventbrite,
  extractOrganizerDetails
};
