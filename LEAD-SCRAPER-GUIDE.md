# YPEC Lead Scraper System Guide

## Overview

The YPEC Lead Scraper System is an automated lead generation tool that pulls potential high-net-worth client leads from free public sources and feeds them into your inquiry pipeline.

**Reports to:** DAN (CMO) via Marketing bot
**Company:** Your Private Estate Chef (#7)
**Purpose:** Automated lead acquisition from public sources

---

## System Components

### 1. Lead Scraper Bot (`/api/ypec/lead-scraper.js`)

**Actions:**
- `status` - Get scraping statistics and metrics
- `scrape` - Run scraper for specific or all sources
- `sources` - List all configured scraper sources
- `validate` - Validate scraped leads (email format, quality scoring)
- `run` - Daily automated run (scrape + validate)

**Cron Schedule:** Daily at 6:00 AM

### 2. Lead Upload Endpoint (`/api/ypec/lead-upload.js`)

Manual CSV/JSON upload endpoint for:
- LinkedIn Sales Navigator exports
- Event attendee lists
- Real estate databases
- Partnership lead lists

### 3. Admin Interface (`/public/admin/lead-upload.html`)

Web interface for manual lead uploads with drag-and-drop support.

**Access:** `https://yourprivateestatechef.com/admin/lead-upload.html`

---

## Scraper Sources

### Currently Configured Sources

#### 1. **Zillow Luxury** (Placeholder)
- **Target:** $2M+ property buyers/owners
- **Frequency:** Weekly
- **Status:** Requires manual setup (RSS feeds or API access)
- **Note:** Respects robots.txt - use Zillow's official APIs or saved search notifications

#### 2. **Luxury Events** (Placeholder)
- **Target:** Charity galas, wine tastings, private events
- **Frequency:** Weekly
- **Status:** Requires regional configuration
- **Sources:** Eventbrite, local chamber of commerce, country clubs

#### 3. **LinkedIn Export** (Active)
- **Target:** C-suite executives, business owners
- **Frequency:** Manual
- **Method:** Export from LinkedIn Sales Navigator → Upload via admin interface
- **Recommended filters:**
  - Job Title: CEO, President, Founder, Owner
  - Company Size: 50-500+ employees
  - Location: Target regions (Austin, Dallas, Houston, etc.)

#### 4. **Country Clubs** (Disabled)
- **Target:** Club member directories
- **Frequency:** Monthly
- **Status:** Enable manually for specific regions
- **Legal:** Only use publicly available directories

---

## Manual Lead Upload Process

### CSV Upload

#### Required Columns:
- `email` - Valid email address
- `name` OR (`first_name` + `last_name`)

#### Optional Columns:
- `phone` - Contact phone number
- `city` - City location
- `state` - State/province
- `company` - Company name
- `title` - Job title
- `notes` - Additional notes
- `service_interest` - Service type (defaults to "Personal Chef")

#### Example CSV:
```csv
name,email,phone,city,state,company,title,service_interest
John Smith,john@example.com,555-1234,Austin,TX,Tech Corp,CEO,Personal Chef
Jane Doe,jane@example.com,555-5678,Dallas,TX,Finance LLC,CFO,Event Catering
```

### JSON Upload

#### Format:
```json
[
  {
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "555-1234",
    "city": "Austin",
    "state": "TX",
    "company": "Tech Corp",
    "title": "CEO",
    "service_interest": "Personal Chef"
  }
]
```

### Upload via Admin Interface

1. Navigate to `https://yourprivateestatechef.com/admin/lead-upload.html`
2. Drag & drop your CSV/JSON file or click "Choose File"
3. Select the lead source from dropdown
4. Check "Validate email addresses" (recommended)
5. Click "Upload Leads"
6. Review results:
   - **Stored:** Successfully added to database
   - **Duplicates:** Emails already in system
   - **Invalid:** Failed validation (bad email format, missing required fields)

---

## Lead Quality Scoring

Leads are automatically scored as **hot**, **warm**, or **cold** based on:

| Criteria | Points |
|----------|--------|
| Has name | 15 |
| Has phone number | 20 |
| Has location (city + state) | 25 |
| Has company + title | 20 |
| Has detailed message (20+ chars) | 10 |
| Specific service interest | 10 |

**Scoring:**
- **70+ points:** Hot lead (immediate follow-up)
- **40-69 points:** Warm lead (schedule outreach)
- **< 40 points:** Cold lead (nurture campaign)

---

## API Usage

### Check Scraper Status
```bash
curl -X POST https://yourprivateestatechef.com/api/ypec/lead-scraper \
  -H "Content-Type: application/json" \
  -d '{"action": "status"}'
```

### Manual Scraper Run
```bash
curl -X POST https://yourprivateestatechef.com/api/ypec/lead-scraper \
  -H "Content-Type: application/json" \
  -d '{"action": "scrape", "data": {"source": "luxury_events"}}'
```

### Validate Leads
```bash
curl -X POST https://yourprivateestatechef.com/api/ypec/lead-scraper \
  -H "Content-Type: application/json" \
  -d '{"action": "validate"}'
```

### Upload Leads via API
```bash
curl -X POST https://yourprivateestatechef.com/api/ypec/lead-upload \
  -F "file=@leads.csv" \
  -F "source=LinkedIn Export" \
  -F "validate_emails=true"
```

---

## Integration with YPEC Bots

### Lead Flow

1. **Lead Scraper** → Scrapes/uploads leads → Stores in `ypec_inquiries` table
   - Status: `new`
   - Referral Source: `Lead Scraper` or upload source name
   - Lead Quality: `hot`, `warm`, or `cold`

2. **Concierge Bot** → Processes new inquiries (7am daily)
   - Sends acknowledgment emails to hot leads
   - Marks as `reviewing`
   - Logs communication

3. **Marketing Bot** → Tracks lead sources (daily)
   - Analyzes conversion rates by source
   - Recommends scaling best performers

4. **Operations Bot** → Schedules consultations
   - Converts qualified leads to households
   - Assigns chefs

---

## Recommended Lead Sources (Free)

### LinkedIn Sales Navigator
- **Setup:** Create saved search with target criteria
- **Export:** Download leads as CSV weekly
- **Upload:** Use admin interface

### Eventbrite
- **Target:** High-end charity galas, wine tastings, food events
- **Method:** Search events by city → Extract organizer emails
- **Frequency:** Weekly

### Local Luxury Publications
- **Target:** Magazine subscriber lists (if publicly available)
- **Examples:** Austin Monthly, Dallas Observer VIP events
- **Method:** Event pages often list contact emails

### Real Estate Listings
- **Target:** $2M+ home listings
- **Method:** Zillow saved searches → RSS feed → Extract agent contacts
- **Note:** Contact property owners through agents

### Chamber of Commerce Directories
- **Target:** Business owner directories
- **Method:** Export member lists (if publicly available)
- **Cities:** Austin, Dallas, Houston, San Antonio

### Country Club Websites
- **Target:** Publicly listed member events
- **Method:** Event organizer contacts
- **Note:** Only use publicly available information

---

## Cron Schedule

```
Daily 6:00 AM - Lead scraper run (automated scraping + validation)
Daily 7:00 AM - Concierge processes new inquiries
Daily 11:00 PM - Marketing analyzes lead sources
```

---

## Best Practices

### 1. **Respect Privacy Laws**
- Only scrape publicly available data
- Include opt-out links in all communications
- Follow CAN-SPAM Act guidelines
- Comply with GDPR for international leads

### 2. **Quality Over Quantity**
- Focus on high-quality sources (LinkedIn, luxury events)
- Validate all leads before mass outreach
- Remove duplicates and invalid emails

### 3. **Source Tracking**
- Always tag leads with accurate source
- Monitor conversion rates by source
- Scale best performers, cut underperformers

### 4. **Lead Nurturing**
- **Hot leads:** Immediate personal outreach
- **Warm leads:** Automated email sequence
- **Cold leads:** Newsletter/content marketing

### 5. **Regular Uploads**
- LinkedIn exports: Weekly
- Event attendee lists: After each event
- Partnership leads: As received

---

## Metrics to Monitor

Access via Marketing Bot:
```bash
curl -X POST /api/ypec/marketing -d '{"action": "sources"}'
```

**Key Metrics:**
- Total leads scraped/uploaded
- Conversion rate by source
- Lead quality distribution (hot/warm/cold)
- Time from lead to conversion
- Cost per acquisition (if using paid sources)

---

## Dependencies

Required npm packages:
```json
{
  "multer": "^1.4.5-lts.1",
  "csv-parser": "^3.0.0",
  "axios": "^1.6.0"
}
```

Install:
```bash
npm install multer csv-parser axios
```

---

## Troubleshooting

### "Invalid email format" errors
- Check CSV column names match expected fields
- Ensure emails don't have spaces or special characters
- Use email validation: `name@domain.com`

### "Duplicate" warnings
- Normal - system prevents duplicate entries
- Check if leads already exist in database before upload

### Scraper not running
- Check cron schedule is enabled
- Verify SUPABASE_URL and SUPABASE_SERVICE_KEY in .env
- Check logs: `tail -f /var/log/ypec-scraper.log`

### File upload fails
- Check file size (max 10MB recommended)
- Ensure proper CSV/JSON formatting
- Check multer upload directory exists: `/tmp/ypec-uploads/`

---

## Security Considerations

1. **Environment Variables**
   - Never commit `.env` file to git
   - Rotate Supabase service key if exposed
   - Use read-only keys where possible

2. **Admin Interface**
   - Add authentication (basic auth or OAuth)
   - Restrict access to `/admin/` directory
   - Monitor upload activity

3. **Data Protection**
   - Encrypt lead data at rest
   - Use HTTPS for all uploads
   - Regular database backups

---

## Next Steps

1. **Enable LinkedIn Integration**
   - Set up LinkedIn Sales Navigator
   - Create saved searches for target profiles
   - Schedule weekly CSV exports

2. **Configure Event Scraping**
   - Identify local luxury event calendars
   - Set up RSS feeds for high-end events
   - Automate event organizer contact extraction

3. **Add Email Validation Service**
   - Integrate ZeroBounce or Hunter.io
   - Validate emails before storing
   - Reduce bounce rates

4. **Set Up Lead Nurturing**
   - Create email sequences for warm/cold leads
   - Integrate with email marketing platform
   - Track engagement metrics

---

## Support

For questions or issues with the lead scraper system:

1. Check bot status: `POST /api/ypec/lead-scraper {"action": "status"}`
2. Review logs on Forbes Command server
3. Contact system administrator

---

**Last Updated:** 2026-01-12
**Version:** 1.0
**Maintained by:** Forbes Command Dev Team
