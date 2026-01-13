# YPEC Complete System Deployment Checklist

## Pre-Deployment

### 1. Database Setup ✓
- [x] Run `ypec-comprehensive-schema.sql` on Supabase
- [x] Verify all 12 tables created
- [x] Test database connectivity
- [x] Set up RLS policies (if needed)
- [x] Generate Supabase service key
- [ ] **ACTION REQUIRED:** Rotate exposed service key (see YPEC-SECURITY-ALERT.md)

### 2. Environment Configuration
- [ ] Create `.env` file on Forbes Command server
- [ ] Add Supabase credentials
- [ ] Add email SMTP settings
- [ ] Add base URL configuration
- [ ] Test environment variables loaded

### 3. Dependencies
- [ ] Install Node.js dependencies: `npm install`
- [ ] Verify all packages installed:
  - @supabase/supabase-js
  - axios
  - node-cron
  - multer
  - csv-parser
  - cheerio

---

## Bot Deployment

### 4. Upload Bot Files to Forbes Command
```bash
scp -r api/ypec/*.js root@5.78.139.9:/root/mfs/api/ypec/
scp api/package.json root@5.78.139.9:/root/mfs/api/ypec/
```

**Files to upload:**
- [ ] concierge.js
- [ ] chef-relations.js
- [ ] operations.js
- [ ] revenue.js
- [ ] marketing.js
- [ ] lead-scraper.js
- [ ] lead-upload.js
- [ ] email-router.js
- [ ] mfs-integration.js
- [ ] cron-config.js
- [ ] scrapers/eventbrite-scraper.js
- [ ] scrapers/venue-scraper.js
- [ ] scrapers/realestate-scraper.js
- [ ] package.json

### 5. Test All Bot Endpoints
```bash
# Concierge
curl -X POST http://localhost:3000/api/ypec/concierge -d '{"action":"status"}'

# Chef Relations
curl -X POST http://localhost:3000/api/ypec/chef-relations -d '{"action":"status"}'

# Operations
curl -X POST http://localhost:3000/api/ypec/operations -d '{"action":"status"}'

# Revenue
curl -X POST http://localhost:3000/api/ypec/revenue -d '{"action":"status"}'

# Marketing
curl -X POST http://localhost:3000/api/ypec/marketing -d '{"action":"status"}'

# Lead Scraper
curl -X POST http://localhost:3000/api/ypec/lead-scraper -d '{"action":"status"}'
```

- [ ] YPEC-Concierge responding
- [ ] YPEC-ChefRelations responding
- [ ] YPEC-Operations responding
- [ ] YPEC-Revenue responding
- [ ] YPEC-Marketing responding
- [ ] YPEC-LeadScraper responding

---

## Cron Jobs

### 6. Configure Scheduled Tasks

Add to Forbes Command cron scheduler or crontab:

```cron
# Lead Scraper - Daily 6am
0 6 * * * curl -X POST http://localhost:3000/api/ypec/lead-scraper -d '{"action":"run"}'

# Process Inquiries - Daily 7am
0 7 * * * curl -X POST http://localhost:3000/api/ypec/concierge -d '{"action":"process_inquiries"}'

# Chef Availability Sync - Daily 8am
0 8 * * * curl -X POST http://localhost:3000/api/ypec/chef-relations -d '{"action":"sync_availability"}'

# Consultation Reminders - Daily 9am
0 9 * * * curl -X POST http://localhost:3000/api/ypec/concierge -d '{"action":"send_reminders"}'

# Upcoming Events Check - Daily 10am
0 10 * * * curl -X POST http://localhost:3000/api/ypec/operations -d '{"action":"upcoming_events"}'

# Daily Summary to HENRY - Daily 6pm
0 18 * * * curl -X POST http://localhost:3000/api/ypec/operations -d '{"action":"daily_summary"}'

# Marketing Daily Run - Daily 11pm
0 23 * * * curl -X POST http://localhost:3000/api/ypec/marketing -d '{"action":"run"}'

# Revenue Daily Run - Daily Midnight
0 0 * * * curl -X POST http://localhost:3000/api/ypec/revenue -d '{"action":"run"}'

# Chef Recruitment - Weekly Monday 9am
0 9 * * 1 curl -X POST http://localhost:3000/api/ypec/chef-relations -d '{"action":"recruit"}'

# Weekly Revenue Report - Weekly Friday 4pm
0 16 * * 5 curl -X POST http://localhost:3000/api/ypec/revenue -d '{"action":"weekly_report"}'

# Monthly Invoices - 1st of Month 8am
0 8 1 * * curl -X POST http://localhost:3000/api/ypec/revenue -d '{"action":"generate_invoices"}'
```

- [ ] All 11 cron jobs added
- [ ] Verify cron schedule: `crontab -l`
- [ ] Test first run of each job

---

## Email Configuration

### 7. DNS Setup

- [ ] Add MX record pointing to 5.78.139.9
- [ ] Add A record for mail.yourprivateestatechef.com
- [ ] Add SPF record
- [ ] Generate and add DKIM key
- [ ] Add DMARC policy
- [ ] Wait 24-48 hours for DNS propagation

### 8. Email Routing

- [ ] Update Forbes Command email-listener.js
- [ ] Add YPEC email routing logic
- [ ] Test email routing with test@example.com
- [ ] Verify emails reach correct bot endpoints

**Email addresses to test:**
- [ ] concierge@yourprivateestatechef.com
- [ ] info@yourprivateestatechef.com
- [ ] support@yourprivateestatechef.com
- [ ] chef-relations@yourprivateestatechef.com
- [ ] operations@yourprivateestatechef.com
- [ ] billing@yourprivateestatechef.com
- [ ] marketing@yourprivateestatechef.com

---

## Landing Page & Public Files

### 9. Railway Deployment (Already Done ✓)

Current status: `yourprivateestatechef.railway.internal`

- [ ] Add custom domain: yourprivateestatechef.com
- [ ] Configure DNS CNAME record
- [ ] Verify SSL certificate auto-generated
- [ ] Test landing page loads

### 10. Admin Interfaces

Upload admin files to Forbes Command or Railway:

- [ ] `/admin/lead-upload.html` - Lead CSV/JSON upload interface
- [ ] `/admin/chef-map.html` - Chef resource mapping system
- [ ] `/booking.html` - Booking/scheduling system
- [ ] `/js/annie-chat-widget.js` - ANNIE chat widget

- [ ] Test lead upload interface
- [ ] Test chef map (loads sample data)
- [ ] Test booking flow (all 4 steps)
- [ ] Test ANNIE chat widget appears on landing page

---

## ATLAS Integration

### 11. Load Knowledge Base

- [ ] Upload `atlas/ypec-knowledge-base.md` to ATLAS
- [ ] Upload `atlas/atlas-config.json` to ATLAS
- [ ] Test ATLAS can answer YPEC questions
- [ ] Verify response tone matches brand guidelines

**Test questions for ATLAS:**
- "What services does YPEC offer?"
- "How much does a personal chef cost?"
- "How do I get started?"
- "What areas do you serve?"

---

## C-Suite Integration

### 12. MFS Reporting

- [ ] Verify mfs-integration.js loaded
- [ ] Test report to ANNIE (inquiry notification)
- [ ] Test report to HENRY (daily summary)
- [ ] Test report to DAVE (weekly revenue)
- [ ] Test report to DAN (marketing insights)

**Verify in Forbes Command logs:**
```bash
tail -f /var/log/mfs-integration.log | grep YPEC
```

---

## Lead Scraper System

### 13. Configure Free Scrapers

- [ ] Set up Zillow RSS feeds (see LEAD-SCRAPER-GUIDE.md)
- [ ] Add RSS feed URLs to .env: `ZILLOW_RSS_FEEDS=url1,url2,url3`
- [ ] Test Eventbrite scraper for Austin
- [ ] Test Eventbrite scraper for Dallas
- [ ] Test Eventbrite scraper for Houston
- [ ] Test Eventbrite scraper for San Antonio

### 14. Lead Upload

- [ ] Test CSV upload via admin interface
- [ ] Test JSON upload via admin interface
- [ ] Verify leads appear in ypec_inquiries table
- [ ] Verify lead quality scoring works
- [ ] Test duplicate detection

---

## End-to-End Testing

### 15. Complete Inquiry Flow

**Test Scenario: Website Visitor to Scheduled Consultation**

1. [ ] Submit inquiry via landing page form
2. [ ] Verify inquiry stored in database
3. [ ] Verify YPEC-Concierge creates record
4. [ ] Verify acknowledgment email sent
5. [ ] Verify ANNIE notified via C-suite integration
6. [ ] Verify communication logged
7. [ ] Manually schedule consultation via Operations bot
8. [ ] Verify household record created
9. [ ] Verify consultation email sent
10. [ ] Verify ANNIE notified of scheduled consultation

### 16. Complete Chef Matching Flow

**Test Scenario: Consultation to Chef Assignment**

1. [ ] Create household via Concierge
2. [ ] Trigger chef matching via Chef Relations bot
3. [ ] Verify scoring algorithm works
4. [ ] Verify top 3 chefs returned
5. [ ] Assign chef to household
6. [ ] Create engagement record
7. [ ] Verify chef capacity updated
8. [ ] Verify HENRY notified if capacity warning triggered

### 17. Complete Revenue Flow

**Test Scenario: Engagement to Invoice to Payment**

1. [ ] Create active engagement
2. [ ] Wait for 1st of month (or trigger manually)
3. [ ] Verify invoice generated
4. [ ] Verify invoice stored in database
5. [ ] Verify DAVE notified
6. [ ] Mark invoice as paid
7. [ ] Verify revenue metrics updated
8. [ ] Trigger weekly revenue report
9. [ ] Verify DAVE receives report

---

## Monitoring & Alerts

### 18. Set Up Monitoring

- [ ] Bot health checks every 5 minutes
- [ ] Database connection monitoring
- [ ] Email deliverability monitoring
- [ ] Cron job execution logging
- [ ] Error alerting to Slack/Discord

**Health check script:**
```bash
#!/bin/bash
for bot in concierge chef-relations operations revenue marketing lead-scraper; do
  response=$(curl -s http://localhost:3000/api/ypec/$bot -d '{"action":"status"}')
  if [[ $response == *"\"status\":\"active\""* ]]; then
    echo "✓ $bot is healthy"
  else
    echo "✗ $bot is DOWN - ALERT!"
    # Send alert
  fi
done
```

---

## Security

### 19. Security Hardening

- [ ] Rotate Supabase service key (REQUIRED - see SECURITY ALERT)
- [ ] Set up firewall rules (allow Port 25, 3000, 443)
- [ ] Enable HTTPS on all endpoints
- [ ] Add authentication to /admin/ endpoints
- [ ] Set up rate limiting on API endpoints
- [ ] Configure CORS properly
- [ ] Review and restrict file upload sizes
- [ ] Enable SQL injection protection in Supabase
- [ ] Set up regular backups (daily)

### 20. Access Control

- [ ] Restrict SSH access to Forbes Command server
- [ ] Use SSH keys (not passwords)
- [ ] Set up 2FA for Supabase dashboard
- [ ] Limit Supabase API key permissions
- [ ] Create read-only keys where possible
- [ ] Document all credentials in password manager

---

## Documentation

### 21. Team Handoff

- [ ] Review DEPLOYMENT-GUIDE.md with team
- [ ] Review LEAD-SCRAPER-GUIDE.md with DAN (CMO)
- [ ] Review EMAIL-SETUP.md with ops team
- [ ] Document custom configurations
- [ ] Create runbook for common issues
- [ ] Schedule training session for C-suite

### 22. Final Checks

- [ ] All passwords secured
- [ ] All API keys documented
- [ ] No secrets in git repository
- [ ] .gitignore includes .env
- [ ] README.md updated
- [ ] CHANGELOG.md created
- [ ] Version tagged in git

---

## Go Live

### 23. Soft Launch

- [ ] Deploy to production
- [ ] Test with 5-10 test leads
- [ ] Monitor for 48 hours
- [ ] Fix any issues found
- [ ] Optimize based on metrics

### 24. Full Launch

- [ ] Announce to team
- [ ] Update website with live booking link
- [ ] Enable all email addresses
- [ ] Start lead scraper cron jobs
- [ ] Monitor for first week continuously
- [ ] Collect feedback from ANNIE, HENRY, DAVE, DAN

---

## Post-Launch

### 25. Week 1 Checklist

- [ ] Review all bot logs
- [ ] Check inquiry conversion rates
- [ ] Review email deliverability (>95%)
- [ ] Verify cron jobs running
- [ ] Check database performance
- [ ] Review C-suite feedback
- [ ] Optimize slow queries
- [ ] Fix any user-reported issues

### 26. Month 1 Checklist

- [ ] Analyze lead quality by source
- [ ] Review chef capacity utilization
- [ ] Check revenue metrics
- [ ] Evaluate marketing effectiveness
- [ ] Update ATLAS knowledge base
- [ ] Optimize lead scraper sources
- [ ] Plan feature enhancements

---

## Support Contacts

**Technical Issues:**
- Forbes Command Server: root@5.78.139.9
- Supabase: https://app.supabase.com
- Railway: https://railway.app

**Bot Ownership:**
- ANNIE (CSO): Concierge, Support
- HENRY (COO): Chef Relations, Operations
- DAVE (CFO): Revenue, Invoicing
- DAN (CMO): Marketing, Lead Scraper

**Emergency Contacts:**
- System down: [Add contact]
- Database issues: [Add contact]
- Email not working: [Add contact]

---

## Success Metrics

**Target Metrics (First Month):**
- [ ] Inquiry-to-consultation: >40%
- [ ] Consultation-to-engagement: >60%
- [ ] Email deliverability: >95%
- [ ] Bot uptime: >99%
- [ ] Response time: <24 hours
- [ ] Lead quality (hot+warm): >70%

**Track Weekly:**
- New inquiries
- Scheduled consultations
- Active engagements
- Monthly recurring revenue
- Chef capacity utilization
- Lead conversion by source

---

**Deployment Version:** 1.0
**Last Updated:** 2026-01-12
**Status:** READY FOR DEPLOYMENT
**Deployed By:** [Add name]
**Date Deployed:** [Add date]
