# YPEC Marketing & Recruitment System
## Your Private Estate Chef - Automated Outreach Infrastructure

**Last Updated:** 2026-01-15
**Company:** Your Private Estate Chef (Company #7 in Forbes Command)
**Tenant ID:** `00000000-0000-0000-0000-000000000007`

---

## 🎯 Overview

This document describes YPEC's comprehensive multi-channel marketing and recruitment system designed to:
1. **Recruit elite chefs** through culinary schools and job boards
2. **Acquire high-net-worth clients** through strategic B2B partnerships
3. **Automate outreach campaigns** while maintaining quality targeting

**Strategic Priority:** Build targeting databases FIRST, activate email sending LAST (per user directive: "2,3,4 then 1 as I do not want to send emails that are not to the right client base")

---

## 📊 System Components

### 1. Culinary School Outreach System
**Purpose:** Automated chef recruitment through elite culinary institutions
**Target:** 21,450 annual graduates from 30 top-tier schools
**Status:** ✅ Complete (awaiting migration)

#### Files Created:
- **Database:** `/data/culinary-schools.json`
  - 30 elite schools (CIA, Le Cordon Bleu, Johnson & Wales, etc.)
  - Contact information, rankings, program details
  - Estimated annual graduate counts

- **Bot:** `/api/ypec/culinary-outreach.js`
  - Actions: `status`, `schools`, `campaigns`, `create_campaign`, `track_response`, `analytics`, `run`
  - Professional email templates (initial outreach, follow-up, partnership invitation)
  - Campaign tracking (draft → scheduled → sent → responded → partnership/declined)
  - Career fair and alumni network integration

- **Migration:** `/migrations/create-culinary-outreach-table.sql`
  - `ypec_culinary_outreach` table
  - Tracks campaigns, responses, partnership status
  - Automated follow-up scheduling

#### Sample Email Template:
```
Subject: Partnership Opportunity: Your Private Estate Chef & [School Name]

We work exclusively with graduates from top-tier culinary programs...
• Competitive compensation ($60K - $150K+ annually)
• Long-term, stable positions with benefits
• Career advancement in private service
```

#### API Usage:
```bash
# Get status
curl -X POST https://yourprivateestatechef.com/api/ypec/culinary-outreach \
  -H "Content-Type: application/json" \
  -d '{"action":"status"}'

# Create campaign for top 10 schools
curl -X POST https://yourprivateestatechef.com/api/ypec/culinary-outreach \
  -H "Content-Type: application/json" \
  -d '{"action":"create_campaign","data":{"school_ids":["cia-ny","cordon-bleu-paris","johnson-wales-ri"]}}'
```

---

### 2. B2B Partnership Outreach System
**Purpose:** Strategic partnerships with luxury brands for client referrals
**Target:** $2.16B-$5.4B TAM across 600,000 qualified households
**Status:** ✅ Complete (awaiting migration)

#### Market Opportunity:
- **Tier 1 (Ultra-Luxury):** Sotheby's, Airbnb Luxe, Morgan Stanley PWM, Amex Centurion
  - Min deal value: $500K/year
  - Avg home price: $8.5M+

- **Tier 2 (Luxury):** Compass, Soho House, Quintessentially, UBS
  - Min deal value: $200K/year
  - Avg home price: $2.5M+

- **Tier 3 (Premium):** Airbnb Plus, Vrbo Premier, Velocity Black
  - Min deal value: $50K/year
  - Broader market access

#### Files Created:
- **Database:** `/data/partnership-targets.json`
  - 25 strategic partnerships across 6 categories:
    - Luxury Real Estate (Sotheby's, Compass, Douglas Elliman, Christie's, Corcoran)
    - Luxury Hospitality (Airbnb Luxe, Airbnb Plus, Vrbo, onefinestay)
    - Wealth Management (Morgan Stanley, Goldman Sachs, UBS)
    - Private Clubs (Soho House, Core Club, Casa Cipriani)
    - Luxury Concierge (Quintessentially, John Paul, Velocity Black)
    - Luxury Brands (Amex Centurion, Ritz-Carlton, Four Seasons Residences)

- **Bot:** `/api/ypec/partnership-outreach.js`
  - Actions: `status`, `partners`, `campaigns`, `create_campaign`, `track_response`, `analytics`, `pipeline`, `run`
  - Category-specific email templates (real estate, hospitality, wealth management)
  - Partnership pipeline (outreach → discovery → qualification → proposal → negotiation → contract → onboarding → active)
  - Revenue tracking with weighted pipeline values
  - ROI analytics

- **Migration:** `/migrations/create-partnership-outreach-table.sql`
  - `ypec_partnership_outreach` table
  - Partnership stages, revenue tracking, contact management
  - Decision maker tracking (JSONB)

#### Partnership Models:
1. **Referral Commission** (5-10%): Real estate agents, wealth advisors
2. **White Label** (80-85% revenue share): Concierge services, private clubs
3. **Concierge Integration**: Building amenities, credit card perks
4. **Building Amenity**: Ritz-Carlton/Four Seasons residences

#### Sample Email Template (Luxury Real Estate):
```
Subject: Strategic Partnership: Sotheby's x Your Private Estate Chef

When your clients purchase an $8.5M home, they're upgrading their entire lifestyle.

WHAT'S IN IT FOR YOU:
• 5% referral commission on successful placements
• Differentiate your service with exclusive lifestyle concierge
• No cost to you or your clients
• White-glove service for your ultra-high-net-worth buyers
```

#### API Usage:
```bash
# Get partnership pipeline
curl -X POST https://yourprivateestatechef.com/api/ypec/partnership-outreach \
  -H "Content-Type: application/json" \
  -d '{"action":"pipeline"}'

# Create campaign for Tier 1 partners
curl -X POST https://yourprivateestatechef.com/api/ypec/partnership-outreach \
  -H "Content-Type: application/json" \
  -d '{"action":"create_campaign","data":{"partner_ids":["sothebys-intl","airbnb-luxe","morgan-stanley-wealth"]}}'
```

---

### 3. Migration System
**Purpose:** Deploy database schemas to Supabase
**Status:** ✅ Complete (ready to run)

#### Files Created:
- **Runner:** `/migrations/run-migrations.js`
  - Node.js script for running SQL migrations
  - Usage: `node migrations/run-migrations.js [file.sql]`

- **Web Interface:** `/public/run-migrations.html`
  - Visual migration runner
  - Shows migration status and output
  - Access at: `https://yourprivateestatechef.com/run-migrations.html`

#### How to Run Migrations:
**Option 1: Supabase Dashboard (Recommended)**
1. Go to Supabase Dashboard → SQL Editor
2. Copy SQL from `/migrations/create-culinary-outreach-table.sql`
3. Click "Run"
4. Repeat for `/migrations/create-partnership-outreach-table.sql`

**Option 2: Node.js Script**
```bash
node migrations/run-migrations.js create-culinary-outreach-table.sql
node migrations/run-migrations.js create-partnership-outreach-table.sql
```

**Option 3: Web Interface**
```
https://yourprivateestatechef.com/run-migrations.html
```

---

## 🗂️ Database Schema

### Multi-Tenant Architecture
All tables include `tenant_id` for isolation:
```javascript
const TENANT_ID = '00000000-0000-0000-0000-000000000007'; // YPEC
```

### Table Mappings (Updated)
```javascript
const TABLES = {
  // Shared multi-tenant tables
  STAFF: 'staff',
  CLIENTS: 'clients',
  LEADS: 'leads',
  USERS: 'users',
  ENGAGEMENTS: 'engagements',
  COMMUNICATIONS: 'communications',

  // YPEC-specific tables
  CHEF_REFERRALS: 'ypec_chef_referrals',
  CULINARY_OUTREACH: 'ypec_culinary_outreach', // ✅ NEW
  PARTNERSHIP_OUTREACH: 'ypec_partnership_outreach', // ✅ NEW
  EVENTS: 'ypec_events',
  INVOICES: 'ypec_invoices'
};
```

---

## 📈 Market Opportunity Analysis

### Chef Recruitment (Supply Side)
- **Total Addressable Market:** 21,450 graduates/year from elite programs
- **Target Conversion:** 2-5% = 429-1,073 chef placements/year
- **Avg Placement Fee:** $6,000-$15,000
- **Annual Revenue Potential:** $2.6M - $16M

### Client Acquisition (Demand Side)
- **Total Addressable Market:** 600,000 qualified HNW households
- **Target Conversion:** 2-5% = 12,000-30,000 clients
- **Avg Lifetime Value:** $180,000
- **Total Market Value:** $2.16B - $5.4B

### Partnership Revenue Models
1. **Referral Commissions:** $500-$5,000 per referral
2. **White-Label Services:** 80-85% revenue share
3. **Concierge Integrations:** Monthly/annual retainers
4. **Building Amenities:** Annual contracts ($50K-$500K)

---

## 🚀 Deployment Checklist

### Phase 1: Database Setup ✅ COMPLETE
- [x] Create culinary schools database
- [x] Create partnership targets database
- [x] Create outreach bots
- [x] Create SQL migrations
- [x] Create migration runner

### Phase 2: Database Deployment (PENDING)
- [ ] Run `/migrations/create-culinary-outreach-table.sql`
- [ ] Run `/migrations/create-partnership-outreach-table.sql`
- [ ] Verify tables created in Supabase
- [ ] Test bot API endpoints

### Phase 3: Code Deployment (PENDING)
- [ ] Commit changes to git
- [ ] Push to Railway
- [ ] Verify deployment success
- [ ] Test APIs in production

### Phase 4: Email Service Integration (DEFERRED)
- [ ] Install email service (Resend/SendGrid/Nodemailer)
- [ ] Configure email templates
- [ ] Test email delivery
- [ ] Activate daily automation

### Phase 5: Multi-Channel Recruitment (PENDING)
- [ ] LinkedIn scraping integration
- [ ] Job board posting (Indeed, LinkedIn Jobs, ZipRecruiter)
- [ ] Chef community partnerships
- [ ] Influencer outreach system

### Phase 6: Client Lead Generation (PENDING)
- [ ] Dan's lead scraping system
- [ ] Website inquiry capture
- [ ] Referral tracking system
- [ ] CRM integration

---

## 🔐 Security & Compliance

### Data Protection
- All queries use tenant_id filtering
- Helper functions: `tenantInsert()`, `tenantUpdate()`, `tenantDelete()`
- Row-level security (RLS) enabled in Supabase

### Email Compliance
- CAN-SPAM compliant templates
- Unsubscribe links in all outreach
- Professional tone and targeting
- No spam - quality over quantity

---

## 📞 Bot Contact Information

### C-Suite Reporting Structure
- **Atlas (CEO)** - Overall strategy
- **Henry (COO)** - Operations and talent pipeline
- **Dave (CFO)** - Financial tracking
- **Dan (CMO)** - Marketing campaigns (owns these bots)
- **Annie (CSO)** - Sales partnerships
- **Jordan (CTO)** - Technical infrastructure
- **Alex (CPO)** - Product development

### Bot Responsibilities
- **Culinary Outreach Bot** - Reports to Dan (CMO), supports Henry (COO)
- **Partnership Outreach Bot** - Reports to Dan (CMO), supports Atlas (CEO) and Annie (CSO)

---

## 🎯 Next Steps

1. **Run Database Migrations** (5 min)
   - Use Supabase Dashboard SQL Editor
   - Execute both migration files

2. **Deploy to Railway** (10 min)
   - Commit code changes
   - Push to production
   - Verify deployment

3. **Test API Endpoints** (15 min)
   - Test culinary outreach status
   - Test partnership pipeline
   - Verify data is being tracked

4. **Strategic Decision: Email Activation** (TBD)
   - Review targeting quality
   - Confirm email service provider
   - Activate automated campaigns

---

## 📊 Success Metrics

### Culinary School Outreach
- Schools contacted: Target 30/30
- Response rate: Target 20-30%
- Partnerships formed: Target 10-15 schools
- Annual graduate reach: Target 5,000-10,000

### B2B Partnerships
- Tier 1 partnerships: Target 2-3 (Ultra-Luxury)
- Tier 2 partnerships: Target 5-7 (Luxury)
- Tier 3 partnerships: Target 8-10 (Premium)
- Pipeline value: Target $1M-$5M annually

### Overall Platform
- Chef applications: Target 100-300/month
- Client inquiries: Target 50-150/month
- Conversion rate: Target 15-25%
- Annual placements: Target 200-500

---

## 🛠️ Technical Stack

- **Backend:** Node.js, Vercel Serverless Functions
- **Database:** Supabase (PostgreSQL)
- **Hosting:** Railway (backend), Vercel (frontend)
- **Email:** TBD (Resend/SendGrid recommended)
- **Architecture:** Multi-tenant with Company #7 isolation

---

**Questions?** Contact the Forbes Command C-Suite or review the bot documentation in `/api/ypec/`.

**Repository:** https://github.com/yourprivateestatechef
**Production:** https://yourprivateestatechef.com
**Migration UI:** https://yourprivateestatechef.com/run-migrations.html
