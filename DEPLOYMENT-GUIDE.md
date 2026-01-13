# YPEC Deployment Guide

## Overview

This guide covers deploying Your Private Estate Chef (YPEC) to the Forbes Command infrastructure.

**Company Number:** 7
**Server:** 5.78.139.9 (Forbes Command)
**Landing Page:** Railway (yourprivateestatechef.railway.internal)

---

## Architecture

### Components

1. **Landing Page** - Static site hosted on Railway
2. **YPEC Bots** - Node.js APIs hosted on Forbes Command server
3. **Database** - Supabase PostgreSQL
4. **Cron Jobs** - Scheduled tasks via Forbes Command cron system
5. **Email Routing** - Port 25 → Bot endpoints

### Bot Structure

- **YPEC-Concierge** → Reports to ANNIE (CSO)
- **YPEC-ChefRelations** → Reports to HENRY (COO)
- **YPEC-Operations** → Reports to HENRY (COO)
- **YPEC-Revenue** → Reports to DAVE (CFO)
- **YPEC-Marketing** → Reports to DAN (CMO)
- **YPEC-LeadScraper** → Reports to DAN (CMO)

---

## Pre-Deployment Checklist

### 1. Database Setup

✅ **Supabase Schema**
- [ ] Run `ypec-comprehensive-schema.sql` on Supabase
- [ ] Verify all 12 tables created successfully
- [ ] Check indexes and triggers are active

**Tables:**
- ypec_households
- ypec_chefs
- ypec_chef_availability
- ypec_engagements
- ypec_menus
- ypec_events
- ypec_inquiries
- ypec_invoices
- ypec_chef_payments
- ypec_referrals
- ypec_communications
- ypec_reference_contacts

### 2. Environment Variables

✅ **Create `.env` file on Forbes Command server**

```bash
# /root/mfs/api/ypec/.env

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key-here

# Base URL
BASE_URL=https://yourprivateestatechef.com

# Email Configuration
SMTP_HOST=localhost
SMTP_PORT=25
EMAIL_FROM=concierge@yourprivateestatechef.com

# Company Info
COMPANY_NUMBER=7
COMPANY_NAME="Your Private Estate Chef"
```

**⚠️ SECURITY:** Never commit `.env` to git!

### 3. Security

✅ **Rotate Exposed Credentials**
- [ ] Generate new Supabase service key (if exposed)
- [ ] Update `.env` with new credentials
- [ ] Verify old key is revoked in Supabase dashboard

✅ **Access Control**
- [ ] Restrict `/admin/` directory with basic auth
- [ ] Set up HTTPS on custom domain
- [ ] Configure CORS for API endpoints

---

## Deployment Steps

### Step 1: Deploy Bots to Forbes Command

#### A. SSH to Forbes Command Server

```bash
ssh root@5.78.139.9
cd /root/mfs/api
```

#### B. Create YPEC Directory

```bash
mkdir -p ypec
cd ypec
```

#### C. Upload Bot Files

**From your local machine:**

```bash
# Navigate to project
cd ~/yourprivateestatechef

# Upload all bot files
scp -r api/ypec/*.js root@5.78.139.9:/root/mfs/api/ypec/
scp api/package.json root@5.78.139.9:/root/mfs/api/ypec/
```

**Files to upload:**
- concierge.js
- chef-relations.js
- operations.js
- revenue.js
- marketing.js
- lead-scraper.js
- lead-upload.js
- cron-config.js
- package.json

#### D. Install Dependencies

**On Forbes Command server:**

```bash
cd /root/mfs/api/ypec
npm install
```

This installs:
- @supabase/supabase-js
- axios
- node-cron
- multer
- csv-parser

#### E. Create .env File

```bash
nano /root/mfs/api/ypec/.env
```

Paste environment variables (see section 2 above), save and exit.

#### F. Test Bot Endpoints

```bash
# Test Concierge bot
curl -X POST http://localhost:3000/api/ypec/concierge \
  -H "Content-Type: application/json" \
  -d '{"action": "status"}'

# Test Lead Scraper
curl -X POST http://localhost:3000/api/ypec/lead-scraper \
  -H "Content-Type: application/json" \
  -d '{"action": "status"}'
```

Expected response:
```json
{
  "bot": {
    "name": "YPEC-Concierge",
    "reports_to": "ANNIE (CSO)",
    "company": "Your Private Estate Chef",
    "company_number": 7
  },
  "status": "active",
  "metrics": { ... }
}
```

### Step 2: Configure Cron Jobs

#### A. Add to Forbes Command Cron System

**On Forbes Command server:**

```bash
cd /root/mfs
nano cron-scheduler.js
```

Add YPEC jobs from `api/ypec/cron-config.js`:

```javascript
// YPEC Cron Jobs (Company #7)
const ypecCron = require('./api/ypec/cron-config');

// Jobs start automatically when required
```

Or manually add to crontab:

```bash
crontab -e
```

Add:
```cron
# YPEC Lead Scraper - Daily 6am
0 6 * * * curl -X POST http://localhost:3000/api/ypec/lead-scraper -d '{"action":"run"}'

# YPEC Process Inquiries - Daily 7am
0 7 * * * curl -X POST http://localhost:3000/api/ypec/concierge -d '{"action":"process_inquiries"}'

# YPEC Chef Availability Sync - Daily 8am
0 8 * * * curl -X POST http://localhost:3000/api/ypec/chef-relations -d '{"action":"sync_availability"}'

# YPEC Consultation Reminders - Daily 9am
0 9 * * * curl -X POST http://localhost:3000/api/ypec/concierge -d '{"action":"send_reminders"}'

# YPEC Upcoming Events - Daily 10am
0 10 * * * curl -X POST http://localhost:3000/api/ypec/operations -d '{"action":"upcoming_events"}'

# YPEC Daily Summary - Daily 6pm
0 18 * * * curl -X POST http://localhost:3000/api/ypec/operations -d '{"action":"daily_summary"}'

# YPEC Marketing Daily Run - Daily 11pm
0 23 * * * curl -X POST http://localhost:3000/api/ypec/marketing -d '{"action":"run"}'

# YPEC Revenue Daily Run - Daily Midnight
0 0 * * * curl -X POST http://localhost:3000/api/ypec/revenue -d '{"action":"run"}'

# YPEC Chef Recruitment - Weekly Monday 9am
0 9 * * 1 curl -X POST http://localhost:3000/api/ypec/chef-relations -d '{"action":"recruit"}'

# YPEC Weekly Revenue Report - Weekly Friday 4pm
0 16 * * 5 curl -X POST http://localhost:3000/api/ypec/revenue -d '{"action":"weekly_report"}'

# YPEC Monthly Invoices - 1st of Month 8am
0 8 1 * * curl -X POST http://localhost:3000/api/ypec/revenue -d '{"action":"generate_invoices"}'
```

#### B. Verify Cron Jobs

```bash
# List active cron jobs
crontab -l | grep YPEC

# Check cron logs
tail -f /var/log/cron.log
```

### Step 3: Configure Email Routing

#### A. Set Up Email Addresses

Add to Forbes Command email router:

```
concierge@yourprivateestatechef.com → /api/ypec/concierge (action: acknowledge)
info@yourprivateestatechef.com → /api/ypec/concierge (action: acknowledge)
chef-relations@yourprivateestatechef.com → /api/ypec/chef-relations
operations@yourprivateestatechef.com → /api/ypec/operations
revenue@yourprivateestatechef.com → /api/ypec/revenue
marketing@yourprivateestatechef.com → /api/ypec/marketing
```

#### B. Configure Port 25 Listener

Update Forbes Command port 25 email handler to route YPEC emails to appropriate bots.

### Step 4: Deploy Landing Page to Railway

✅ **Already Deployed**

Current status: `yourprivateestatechef.railway.internal`

#### Next Steps:

1. **Add Custom Domain**
   ```bash
   # In Railway dashboard
   Settings → Domains → Add Domain
   # Add: yourprivateestatechef.com
   ```

2. **Configure DNS**
   ```
   # Add CNAME record
   Type: CNAME
   Name: @
   Value: yourprivateestatechef.railway.internal
   TTL: 3600
   ```

3. **Update Environment Variables**
   ```
   BASE_URL=https://yourprivateestatechef.com
   ```

### Step 5: Create Upload Directory

**On Forbes Command server:**

```bash
mkdir -p /tmp/ypec-uploads
chmod 755 /tmp/ypec-uploads
```

This directory is used by the lead upload endpoint (`multer`).

---

## Post-Deployment Testing

### 1. Test All Bot Endpoints

```bash
# Concierge
curl -X POST https://yourprivateestatechef.com/api/ypec/concierge \
  -d '{"action":"status"}'

# Chef Relations
curl -X POST https://yourprivateestatechef.com/api/ypec/chef-relations \
  -d '{"action":"status"}'

# Operations
curl -X POST https://yourprivateestatechef.com/api/ypec/operations \
  -d '{"action":"status"}'

# Revenue
curl -X POST https://yourprivateestatechef.com/api/ypec/revenue \
  -d '{"action":"status"}'

# Marketing
curl -X POST https://yourprivateestatechef.com/api/ypec/marketing \
  -d '{"action":"status"}'

# Lead Scraper
curl -X POST https://yourprivateestatechef.com/api/ypec/lead-scraper \
  -d '{"action":"status"}'
```

### 2. Test End-to-End Inquiry Flow

#### A. Submit Inquiry via Landing Page

Navigate to `https://yourprivateestatechef.com`

Fill out contact form → Submit

#### B. Verify Inquiry Stored

```bash
# Check Supabase
# ypec_inquiries table should have new record
```

#### C. Verify Acknowledgment Email

Check email routing → Concierge bot should send acknowledgment

### 3. Test Lead Upload

Navigate to `https://yourprivateestatechef.com/admin/lead-upload.html`

Upload sample CSV:
```csv
name,email,city,state,service_interest
Test User,test@example.com,Austin,TX,Personal Chef
```

Verify:
- Upload succeeds
- Lead appears in `ypec_inquiries` table
- Lead quality is calculated

### 4. Test Cron Jobs

Wait for scheduled run or trigger manually:

```bash
# Trigger lead scraper
curl -X POST http://localhost:3000/api/ypec/lead-scraper \
  -d '{"action":"run"}'

# Check logs
tail -f /var/log/ypec-scraper.log
```

---

## Monitoring

### 1. Bot Health Checks

Set up monitoring for each bot endpoint:

```bash
# Add to monitoring script
*/5 * * * * curl -s http://localhost:3000/api/ypec/concierge -d '{"action":"status"}' || echo "YPEC Concierge DOWN"
```

### 2. Database Metrics

Monitor Supabase dashboard:
- Query performance
- Storage usage
- Active connections

### 3. Cron Job Logs

```bash
# View cron execution logs
tail -f /var/log/cron.log | grep YPEC

# View bot-specific logs
tail -f /root/mfs/api/ypec/logs/*.log
```

### 4. Lead Scraper Metrics

Daily metrics via Marketing bot:

```bash
curl -X POST https://yourprivateestatechef.com/api/ypec/marketing \
  -d '{"action":"sources"}'
```

---

## Troubleshooting

### Bot Returns 500 Error

**Check:**
1. Environment variables are set correctly
2. Supabase credentials are valid
3. Database tables exist

**Debug:**
```bash
cd /root/mfs/api/ypec
node concierge.js
# Check for error messages
```

### Cron Jobs Not Running

**Check:**
```bash
# Verify crontab
crontab -l

# Check cron service
systemctl status cron

# View cron logs
tail -f /var/log/cron.log
```

### Lead Upload Fails

**Check:**
1. `/tmp/ypec-uploads/` directory exists and is writable
2. CSV format matches expected columns
3. Multer is installed: `npm list multer`

### Email Routing Not Working

**Check:**
1. Port 25 listener is running
2. Email addresses are configured in router
3. DNS MX records point to Forbes Command server

---

## Maintenance

### Weekly Tasks

- [ ] Review lead scraper metrics
- [ ] Check for failed cron jobs
- [ ] Monitor Supabase storage usage
- [ ] Review inquiry conversion rates

### Monthly Tasks

- [ ] Rotate logs
- [ ] Database backup
- [ ] Review and optimize queries
- [ ] Update dependencies: `npm update`

### Quarterly Tasks

- [ ] Security audit
- [ ] Review bot performance
- [ ] Update lead scraper sources
- [ ] Analyze C-suite reporting effectiveness

---

## Rollback Procedure

If deployment fails:

1. **Stop Bots**
   ```bash
   pm2 stop ypec-*
   ```

2. **Disable Cron Jobs**
   ```bash
   crontab -e
   # Comment out YPEC jobs
   ```

3. **Restore Previous Version**
   ```bash
   cd /root/mfs/api/ypec
   git checkout <previous-commit>
   npm install
   pm2 restart ypec-*
   ```

4. **Verify Rollback**
   ```bash
   curl http://localhost:3000/api/ypec/concierge -d '{"action":"status"}'
   ```

---

## Support Contacts

**Technical Issues:**
- Forbes Command Server: root@5.78.139.9
- Supabase Dashboard: https://app.supabase.com
- Railway Dashboard: https://railway.app

**Bot Ownership:**
- ANNIE (CSO) - Concierge
- HENRY (COO) - Chef Relations, Operations
- DAVE (CFO) - Revenue
- DAN (CMO) - Marketing, Lead Scraper

---

## Next Steps After Deployment

1. **Configure Lead Sources**
   - Set up LinkedIn Sales Navigator
   - Identify local luxury event calendars
   - Configure RSS feeds for high-end properties

2. **Email Templates**
   - Design acknowledgment email template
   - Create consultation reminder template
   - Build nurture email sequences

3. **Analytics Setup**
   - Track inquiry-to-consultation conversion
   - Monitor lead quality by source
   - Analyze C-suite report engagement

4. **Integration**
   - Connect with Steading Home for cross-promotion
   - Set up Sovereign Design It podcast chef interviews
   - Configure Timber Homestead estate kitchen content

---

**Deployment Version:** 1.0
**Last Updated:** 2026-01-12
**Deployed By:** Forbes Command Dev Team
