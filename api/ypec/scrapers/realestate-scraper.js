// ============================================================================
// REAL ESTATE SCRAPER
// Scrapes public real estate listings for $2M+ homes
// 100% FREE - Uses public listing data
// ============================================================================

const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrapes Zillow RSS feeds for luxury homes (free, public data)
 * @param {string} city - City to search
 * @param {number} minPrice - Minimum price (default $2M)
 * @returns {Array} Array of property leads
 */
async function scrapeZillowRSS(city, minPrice = 2000000) {
  const leads = [];

  try {
    // Zillow provides free RSS feeds for saved searches
    // Users can create these manually and provide the RSS URL
    console.log(`[RealEstate] Zillow RSS requires manual saved search setup`);
    console.log(`[RealEstate] Visit zillow.com, search "${city} TX homes ${minPrice}+", save search, get RSS link`);

    return leads;

  } catch (error) {
    console.error('[RealEstate] Error:', error.message);
    return leads;
  }
}

/**
 * Parse Zillow RSS feed URL (provided by user)
 * @param {string} rssUrl - RSS feed URL from Zillow saved search
 * @returns {Array} Array of property/agent leads
 */
async function parseZillowRSS(rssUrl) {
  const leads = [];

  try {
    const response = await axios.get(rssUrl, {
      timeout: 10000
    });

    const $ = cheerio.load(response.data, { xmlMode: true });

    $('item').each((i, item) => {
      const title = $(item).find('title').text();
      const link = $(item).find('link').text();
      const description = $(item).find('description').text();

      // Extract price from title (format: "$2,500,000 - 4bd/3ba - Address")
      const priceMatch = title.match(/\$([0-9,]+)/);
      const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 0;

      // Extract address
      const addressMatch = title.match(/ - (.+)$/);
      const address = addressMatch ? addressMatch[1] : '';

      if (price >= 2000000) {
        leads.push({
          name: 'Luxury Property Owner', // Would need to visit listing for actual name
          email: null, // Contact through listing agent
          source: 'Zillow RSS - Luxury Homes',
          property_price: price,
          property_address: address,
          listing_url: link,
          city: null, // Extract from address
          state: 'TX',
          lead_quality: 'warm',
          service_interest: 'Personal Chef',
          message: `Luxury property owner - potential client for estate chef services`,
          metadata: {
            found_at: new Date().toISOString(),
            listing_description: description
          }
        });
      }
    });

    console.log(`[RealEstate] Parsed ${leads.length} luxury property leads from RSS`);

  } catch (error) {
    console.error('[RealEstate] Error parsing RSS:', error.message);
  }

  return leads;
}

/**
 * Manual entry for luxury property data
 * @param {Object} propertyData - Manually collected property information
 * @returns {Object} Formatted lead object
 */
function createPropertyLead(propertyData) {
  return {
    name: propertyData.owner_name || 'Property Owner',
    email: propertyData.email || null,
    phone: propertyData.phone || null,
    city: propertyData.city,
    state: 'TX',
    source: 'Luxury Real Estate',
    lead_quality: propertyData.lead_quality || 'warm',
    service_interest: 'Personal Chef',
    message: `${propertyData.price ? `$${propertyData.price.toLocaleString()}` : 'Luxury'} property owner in ${propertyData.city}`,
    metadata: {
      property_price: propertyData.price,
      property_address: propertyData.address,
      listing_url: propertyData.listing_url,
      collected_at: new Date().toISOString()
    }
  };
}

/**
 * Instructions for setting up Zillow RSS feeds
 */
function getZillowRSSInstructions() {
  return `
=== How to Set Up Zillow RSS Feeds (FREE) ===

1. Go to Zillow.com
2. Search for: "Austin TX, $2,000,000+ homes"
3. Filter by:
   - Price: $2M minimum
   - Property Type: Single Family, Luxury
4. Click "Save this search" (requires free Zillow account)
5. In your saved searches, click the RSS icon
6. Copy the RSS feed URL
7. Add the RSS URL to YPEC lead scraper configuration

Repeat for Dallas, Houston, San Antonio.

RSS feeds update automatically when new luxury listings appear!
  `.trim();
}

module.exports = {
  scrapeZillowRSS,
  parseZillowRSS,
  createPropertyLead,
  getZillowRSSInstructions
};
