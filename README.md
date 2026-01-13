# Your Private Estate Chef (YPEC) - Complete System

**Company Number:** 7
**Parent Organization:** Maggie Forbes Strategies
**Version:** 1.0
**Status:** ✅ READY FOR DEPLOYMENT

---

## System Overview

Your Private Estate Chef is a comprehensive luxury personal chef service platform built on the Forbes Command infrastructure. The system includes 6 specialized bots, C-suite integration, automated lead generation, booking system, chef resource mapping, and ANNIE support chat.

### Quick Stats
- **6 AI Bots:** Concierge, Chef Relations, Operations, Revenue, Marketing, Lead Scraper
- **12 Database Tables:** Complete Supabase schema
- **11 Cron Jobs:** Automated daily/weekly/monthly tasks
- **8 Email Routes:** Automated inquiry handling
- **100% Free Lead Scraping:** Eventbrite, Zillow RSS, public sources
- **C-Suite Integration:** Reports to ANNIE, HENRY, DAVE, DAN

---

## What's Included

### ✅ Bots & Backend
- [x] **YPEC-Concierge** - Client inquiries, consultations (Reports to ANNIE)
- [x] **YPEC-ChefRelations** - Chef recruitment, matching (Reports to HENRY)
- [x] **YPEC-Operations** - Engagement management, scheduling (Reports to HENRY)
- [x] **YPEC-Revenue** - Invoicing, payments, reporting (Reports to DAVE)
- [x] **YPEC-Marketing** - Referrals, content, growth (Reports to DAN)
- [x] **YPEC-LeadScraper** - Automated lead generation (Reports to DAN)
- [x] **MFS C-Suite Integration** - All bots report to Forbes Command C-suite
- [x] **Email Router** - Automated email-to-bot routing

### ✅ Frontend & Interfaces
- [x] **Landing Page** - Deployed to Railway
- [x] **ANNIE Chat Widget** - Real-time support chat
- [x] **Booking System** - 4-step consultation/service booking
- [x] **Chef Resource Map** - Interactive Texas chef locations
- [x] **Lead Upload Interface** - CSV/JSON manual upload
- [x] **Admin Dashboard** - (Combined above interfaces)

### ✅ Automation & Intelligence
- [x] **11 Cron Jobs** - Daily, weekly, monthly automated tasks
- [x] **ATLAS Knowledge Base** - Complete YPEC documentation for AI
- [x] **Free Lead Scrapers** - Eventbrite, Zillow RSS, public sources
- [x] **Email Routing** - 8 email addresses → bot endpoints
- [x] **Lead Quality Scoring** - Hot/warm/cold classification
- [x] **Chef Matching Algorithm** - Location, cuisine, dietary, capacity

### ✅ Database & Infrastructure
- [x] **12-Table Supabase Schema** - Comprehensive data model
- [x] **Forbes Command Integration** - Server: 5.78.139.9
- [x] **Railway Landing Page** - Static site deployment
- [x] **Environment Configuration** - .env template and security

### ✅ Documentation
- [x] **DEPLOYMENT-CHECKLIST.md** - Complete 26-step deployment guide
- [x] **DEPLOYMENT-GUIDE.md** - Detailed technical deployment
- [x] **LEAD-SCRAPER-GUIDE.md** - Free lead scraper documentation
- [x] **EMAIL-SETUP.md** - Email routing configuration
- [x] **YPEC-SECURITY-ALERT.md** - Security incident response
- [x] **This README** - System overview and quick reference

---

## Quick Start

### 1. Deploy Database
```bash
# Run schema on Supabase
psql -h db.your-project.supabase.co -U postgres -d postgres -f ypec-comprehensive-schema.sql
```

### 2. Deploy Bots to Forbes Command
```bash
# Upload to server
scp -r api/ypec/*.js root@5.78.139.9:/root/mfs/api/ypec/
cd /root/mfs/api/ypec && npm install
```

### 3. Configure Environment
```bash
# Create .env file on server
nano /root/mfs/api/ypec/.env
# Add: SUPABASE_URL, SUPABASE_SERVICE_KEY, BASE_URL
```

### 4. Test Bots
```bash
curl -X POST http://localhost:3000/api/ypec/concierge -d '{"action":"status"}'
```

### 5. Set Up Cron Jobs
```bash
crontab -e
# Add all 11 cron jobs from DEPLOYMENT-CHECKLIST.md
```

### 6. Configure Email
```bash
# Update DNS: MX, SPF, DKIM, DMARC
# Update Forbes Command email-listener.js
# See EMAIL-SETUP.md for details
```

### 7. Deploy Landing Page
```bash
# Already deployed to Railway ✓
# Add custom domain: yourprivateestatechef.com
```

---

## File Structure

```
yourprivateestatechef/
├── api/
│   ├── ypec/
│   │   ├── concierge.js                 ← ANNIE's bot (inquiries, consultations)
│   │   ├── chef-relations.js            ← HENRY's bot (chef recruitment, matching)
│   │   ├── operations.js                ← HENRY's bot (scheduling, events)
│   │   ├── revenue.js                   ← DAVE's bot (invoicing, payments)
│   │   ├── marketing.js                 ← DAN's bot (referrals, growth)
│   │   ├── lead-scraper.js              ← DAN's bot (automated leads)
│   │   ├── lead-upload.js               ← Manual lead upload endpoint
│   │   ├── email-router.js              ← Email routing logic
│   │   ├── mfs-integration.js           ← C-suite reporting integration
│   │   ├── cron-config.js               ← Scheduled task configuration
│   │   ├── scrapers/
│   │   │   ├── eventbrite-scraper.js    ← FREE Eventbrite scraper
│   │   │   ├── venue-scraper.js         ← FREE venue scraper
│   │   │   └── realestate-scraper.js    ← FREE Zillow RSS parser
│   │   └── package.json                 ← Dependencies
├── public/
│   ├── index.html                       ← Landing page (Railway)
│   ├── booking.html                     ← 4-step booking system
│   ├── js/
│   │   └── annie-chat-widget.js         ← ANNIE support chat
│   └── admin/
│       ├── lead-upload.html             ← Manual lead upload UI
│       └── chef-map.html                ← Chef resource map
├── atlas/
│   ├── ypec-knowledge-base.md           ← ATLAS documentation
│   └── atlas-config.json                ← ATLAS configuration
├── ypec-comprehensive-schema.sql        ← 12-table database schema
├── DEPLOYMENT-CHECKLIST.md              ← 26-step deployment guide
├── DEPLOYMENT-GUIDE.md                  ← Technical deployment details
├── LEAD-SCRAPER-GUIDE.md                ← Free lead scraper guide
├── EMAIL-SETUP.md                       ← Email routing setup
├── YPEC-SECURITY-ALERT.md               ← Security incident response
├── .gitignore                           ← Git ignore rules
├── .env.example                         ← Environment template
├── package.json                         ← Static site dependencies
└── README.md                            ← This file
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     YPEC SYSTEM FLOW                        │
└─────────────────────────────────────────────────────────────┘

Website Visitor
     │
     ├──► Landing Page (Railway)
     │         │
     │         ├──► ANNIE Chat Widget ──────┐
     │         │                             │
     │         └──► Booking System ──────────┤
     │                                       │
     ├──► Email (Port 25) ──────────────────┤
     │                                       │
     └──► Lead Upload (Admin) ──────────────┤
                                             │
                                             ▼
                                    Email Router
                                             │
          ┌──────────────────────────────────┼──────────────────────────────┐
          │                                  │                              │
          ▼                                  ▼                              ▼
    YPEC-Concierge              YPEC-ChefRelations              YPEC-Operations
    (Reports to ANNIE)          (Reports to HENRY)              (Reports to HENRY)
          │                                  │                              │
          │                                  │                              │
          ▼                                  ▼                              ▼
    YPEC-Revenue                YPEC-Marketing                 YPEC-LeadScraper
    (Reports to DAVE)           (Reports to DAN)               (Reports to DAN)
          │                                  │                              │
          └──────────────────────────────────┼──────────────────────────────┘
                                             │
                                             ▼
                                    Supabase Database
                                    (12 Tables)
                                             │
                                             ▼
                                    Forbes Command C-Suite
                                    (ANNIE, HENRY, DAVE, DAN)
```

---

## Key Features

### 1. C-Suite Integration
All bots report to Forbes Command C-suite:
- **ANNIE (CSO):** New inquiries, consultations, support
- **HENRY (COO):** Chef capacity, operations, daily summaries
- **DAVE (CFO):** Revenue reports, overdue invoices, forecasts
- **DAN (CMO):** Lead sources, referrals, marketing insights

### 2. Automated Lead Generation (100% FREE)
- Eventbrite luxury event scraper (Austin, Dallas, Houston, San Antonio)
- Zillow RSS feed parser ($2M+ homes)
- Manual CSV/JSON upload for LinkedIn, partnerships
- Lead quality scoring (hot/warm/cold)

### 3. Intelligent Chef Matching
Algorithm scores chefs based on:
- Location compatibility (50 points)
- Cuisine preferences (20 points each)
- Dietary expertise (15 points each)
- Capacity availability (10 points)
- Experience (up to 10 points)

### 4. Complete Booking Flow
4-step booking system:
1. Select service (consultation, event, weekly, full-time)
2. Enter details (name, contact, preferences)
3. Choose date/time
4. Confirm and book

### 5. Real-Time Support
ANNIE chat widget provides:
- Instant answers to common questions
- Quick action buttons
- Session persistence
- Beautiful luxury-branded UI

---

## Cron Schedule

```
6:00 AM  - Lead Scraper Run
7:00 AM  - Process New Inquiries
8:00 AM  - Sync Chef Availability
9:00 AM  - Send Consultation Reminders
9:00 AM  - Chef Recruitment (Mondays)
10:00 AM - Check Upcoming Events
4:00 PM  - Weekly Revenue Report (Fridays)
6:00 PM  - Daily Summary to HENRY
8:00 AM  - Generate Monthly Invoices (1st of month)
11:00 PM - Marketing Daily Run
Midnight - Revenue Daily Run (check overdue invoices)
```

---

## Email Addresses

All route to appropriate bots:

**Primary:**
- concierge@yourprivateestatechef.com → Concierge (High Priority)
- info@yourprivateestatechef.com → Concierge
- support@yourprivateestatechef.com → Concierge (High Priority)

**Departments:**
- chef-relations@yourprivateestatechef.com → Chef Relations
- operations@yourprivateestatechef.com → Operations
- billing@yourprivateestatechef.com → Revenue (High Priority)
- marketing@yourprivateestatechef.com → Marketing

---

## Database Schema (12 Tables)

1. **ypec_households** - Client households
2. **ypec_chefs** - Chef network
3. **ypec_chef_availability** - Weekly availability
4. **ypec_engagements** - Chef-household assignments
5. **ypec_menus** - Custom menus
6. **ypec_events** - Scheduled events
7. **ypec_inquiries** - Lead tracking
8. **ypec_invoices** - Billing
9. **ypec_chef_payments** - Chef payments
10. **ypec_referrals** - Referral tracking
11. **ypec_communications** - All communications log
12. **ypec_reference_contacts** - Professional references

---

## API Endpoints

### Bot Actions

**Concierge:**
- `POST /api/ypec/concierge` - `{"action": "status"}`
- Actions: status, inquiries, acknowledge, schedule, assign, process_inquiries, send_reminders, run

**Chef Relations:**
- `POST /api/ypec/chef-relations` - `{"action": "status"}`
- Actions: status, recruit, onboard, availability, match, feedback, sync_availability, run

**Operations:**
- `POST /api/ypec/operations` - `{"action": "status"}`
- Actions: status, engagements, schedule, upcoming, overdue, upcoming_events, daily_summary, run

**Revenue:**
- `POST /api/ypec/revenue` - `{"action": "status"}`
- Actions: status, revenue, invoices, payments, forecast, report, generate_invoices, weekly_report, run

**Marketing:**
- `POST /api/ypec/marketing` - `{"action": "status"}`
- Actions: status, referrals, content, waitlist, sources, run

**Lead Scraper:**
- `POST /api/ypec/lead-scraper` - `{"action": "status"}`
- Actions: status, scrape, sources, validate, run

---

## Security

### Critical Actions Required
1. **Rotate Supabase service key** (exposed in git - see YPEC-SECURITY-ALERT.md)
2. Add authentication to `/admin/` endpoints
3. Configure HTTPS on custom domain
4. Enable rate limiting on API endpoints
5. Set up regular database backups

### Security Features
- .gitignore prevents committing .env
- .env.example template provided
- Email spam filtering
- Rate limiting on email routing
- SQL injection protection via Supabase
- CORS configuration

---

## Performance

### Target Metrics
- Bot response time: <2 seconds
- Email acknowledgment: <5 minutes
- Inquiry-to-consultation: >40%
- Consultation-to-engagement: >60%
- Bot uptime: >99%
- Email deliverability: >95%

### Optimization
- Database indexes on all foreign keys
- Cron jobs staggered to avoid overlap
- Rate limiting on scrapers (respectful)
- Connection pooling for Supabase
- Cached responses where possible

---

## Troubleshooting

### Common Issues

**Bots Not Responding:**
```bash
# Check if running
curl http://localhost:3000/api/ypec/concierge -d '{"action":"status"}'

# Check logs
tail -f /root/mfs/api/ypec/logs/concierge.log

# Restart
pm2 restart ypec-concierge
```

**Emails Not Arriving:**
```bash
# Check DNS
dig MX yourprivateestatechef.com

# Check email listener
pm2 logs email-listener

# Test routing
node /root/mfs/api/ypec/email-router.js
```

**Cron Jobs Not Running:**
```bash
# List cron jobs
crontab -l

# Check cron logs
tail -f /var/log/cron.log | grep YPEC
```

---

## Next Steps

### Before Launch
1. Complete DEPLOYMENT-CHECKLIST.md (26 steps)
2. Rotate exposed Supabase service key
3. Set up DNS for email (MX, SPF, DKIM, DMARC)
4. Configure Zillow RSS feeds for lead scraper
5. Test end-to-end inquiry flow

### After Launch
1. Monitor logs for first 48 hours
2. Analyze lead quality by source
3. Optimize chef matching algorithm
4. Gather feedback from C-suite
5. Plan feature enhancements

---

## Support

**Documentation:**
- DEPLOYMENT-CHECKLIST.md - Step-by-step deployment
- DEPLOYMENT-GUIDE.md - Technical details
- LEAD-SCRAPER-GUIDE.md - Lead generation setup
- EMAIL-SETUP.md - Email routing configuration

**Technical:**
- Forbes Command Server: 5.78.139.9
- Supabase Dashboard: https://app.supabase.com
- Railway Dashboard: https://railway.app

**Bot Owners:**
- ANNIE (CSO) - Concierge, Support
- HENRY (COO) - Chef Relations, Operations
- DAVE (CFO) - Revenue
- DAN (CMO) - Marketing, Lead Scraper

---

## Version History

**v1.0 (2026-01-12)**
- Initial complete system
- 6 bots with C-suite integration
- Free lead scraper system
- Booking and mapping interfaces
- ANNIE chat widget
- ATLAS knowledge base
- Comprehensive documentation

---

## License

**Proprietary**
© 2026 Maggie Forbes Strategies
All rights reserved.

---

**Built with:** Node.js, Supabase, Forbes Command, Railway
**Maintained by:** Forbes Command Dev Team
**Last Updated:** 2026-01-12
