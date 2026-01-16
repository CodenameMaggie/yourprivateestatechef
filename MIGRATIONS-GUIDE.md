# Database Migrations Guide

**Total Migrations**: 6
**Execution Method**: Supabase Dashboard SQL Editor
**Estimated Time**: 5-10 minutes

---

## How to Run Migrations

1. Log into **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project: **Your Private Estate Chef**
3. Go to **SQL Editor** (left sidebar)
4. Click **+ New query**
5. Copy/paste each migration SQL below (in order)
6. Click **Run** for each migration
7. Verify success message appears

---

## Migration 1: Culinary School Outreach

**File**: `/migrations/create-culinary-outreach-table.sql`

**Purpose**: Track culinary school partnership campaigns

**Tables Created**: `ypec_culinary_outreach`

**Success Message**:
```
Successfully created ypec_culinary_outreach table
Campaign statuses: draft, scheduled, sent, responded, partnership, declined
```

---

## Migration 2: B2B Partnership Outreach

**File**: `/migrations/create-partnership-outreach-table.sql`

**Purpose**: Track B2B partnership pipeline (Sotheby's, Airbnb Luxe, etc.)

**Tables Created**: `ypec_partnership_outreach`

**Success Message**:
```
Successfully created ypec_partnership_outreach table
Pipeline stages: outreach → discovery → proposal → contract → active
```

---

## Migration 3: Chef Compliance & Background Checks

**File**: `/migrations/add-chef-compliance-fields.sql`

**Purpose**: MANDATORY background check tracking for chef safety

**Tables Altered**: `users` (adds compliance fields)

**Fields Added**:
- compliance_status
- background_check_status
- background_check_date
- background_check_expiry_date
- background_check_jurisdiction
- vulnerable_sector_check
- rcmp_clearance

**Success Message**:
```
Successfully added compliance tracking fields to users table
All chefs now require background checks before placement
```

---

## Migration 4: Geographic Market Expansion

**File**: `/migrations/create-markets-table.sql`

**Purpose**: Demand-driven geographic expansion tracking

**Tables Created**: `ypec_markets`

**Success Message**:
```
Successfully created ypec_markets table for demand-driven geographic expansion
Market statuses: emerging (new), recruiting (campaign active), growing (1-4 chefs), established (5+ chefs)
```

---

## Migration 5: Multi-Channel Chef Recruitment

**File**: `/migrations/create-recruitment-tables.sql`

**Purpose**: Track chef recruitment campaigns across LinkedIn, Indeed, ZipRecruiter, etc.

**Tables Created**:
- `ypec_recruitment_campaigns`
- `ypec_job_postings`

**Success Message**:
```
Successfully created recruitment campaign and job posting tables
Supported channels: LinkedIn, Indeed, ZipRecruiter, Culinary Agents, Craigslist, Poached Jobs
```

---

## Migration 6: Client Lead Tracking & Scoring

**File**: `/migrations/add-client-lead-tracking-fields.sql`

**Purpose**: Dan's HNW client lead generation and qualification system

**Tables Altered**: `leads` (adds 13 new fields)

**Fields Added**:
- lead_score (0-100 algorithmic scoring)
- priority (high/medium/low)
- source (website, forbes_list, luxury_real_estate, etc.)
- location (consolidated location field)
- first_inquiry_date
- last_inquiry_date
- inquiry_count
- qualification_date
- qualification_notes
- home_value
- budget
- timeline
- consultation_date

**Success Message**:
```
Successfully added client lead tracking fields to leads table
New fields: lead_score, priority, source, location, inquiry tracking, qualification tracking
Dan ClientLeads bot is now ready to use!
```

---

## Post-Migration Verification

After running all 6 migrations, verify in Supabase:

1. **Table Editor** → Check that these tables exist:
   - `ypec_culinary_outreach`
   - `ypec_partnership_outreach`
   - `ypec_markets`
   - `ypec_recruitment_campaigns`
   - `ypec_job_postings`

2. **Table Editor** → Check `users` table has new columns:
   - `compliance_status`
   - `background_check_status`
   - (and other compliance fields)

3. **Table Editor** → Check `leads` table has new columns:
   - `lead_score`
   - `priority`
   - `source`
   - `location`
   - (and other lead tracking fields)

---

## Testing the Bots

Once migrations are complete, test each bot via Postman or curl:

### 1. Culinary Outreach Bot
```bash
curl -X POST https://yourprivateestatechef.com/api/ypec/culinary-outreach \
  -H "Content-Type: application/json" \
  -d '{"action":"status"}'
```

### 2. Partnership Outreach Bot
```bash
curl -X POST https://yourprivateestatechef.com/api/ypec/partnership-outreach \
  -H "Content-Type: application/json" \
  -d '{"action":"status"}'
```

### 3. Market Expansion Bot
```bash
curl -X POST https://yourprivateestatechef.com/api/ypec/market-expansion \
  -H "Content-Type: application/json" \
  -d '{"action":"status"}'
```

### 4. Chef Compliance Bot
```bash
curl -X POST https://yourprivateestatechef.com/api/ypec/chef-compliance \
  -H "Content-Type: application/json" \
  -d '{"action":"status"}'
```

### 5. Chef Recruitment Bot
```bash
curl -X POST https://yourprivateestatechef.com/api/ypec/chef-recruitment \
  -H "Content-Type: application/json" \
  -d '{"action":"status"}'
```

### 6. Client Leads Bot (Dan's Bot)
```bash
curl -X POST https://yourprivateestatechef.com/api/ypec/client-leads \
  -H "Content-Type: application/json" \
  -d '{"action":"status"}'
```

**Expected Response**: Each should return `{"bot": {...}, "status": "active", ...}`

---

## Troubleshooting

### Migration Error: "relation already exists"
- Migration was already run previously
- Safe to skip this migration

### Migration Error: "column already exists"
- Column was added in a previous run
- Safe to skip this migration

### Migration Error: "syntax error"
- Check for copy/paste issues
- Ensure entire SQL file content was copied
- Try running sections individually

### Bot Returns 404
- Check vercel.json has the route configured
- Verify file exists at `/api/ypec/{bot-name}.js`
- Redeploy via Railway if needed

### Bot Returns 500
- Check Railway logs for errors
- Verify SUPABASE_URL and SUPABASE_SERVICE_KEY are set
- Verify migrations were run successfully

---

## Next Steps After Migrations

1. ✅ All migrations complete
2. ✅ All bots tested and responding
3. **Review target lists** (culinary schools, partnerships)
4. **Approve first campaigns** (which schools/partners to contact first)
5. **Verify email templates** (before activating email sending)
6. **Launch Phase 4** (email service integration) - ONLY after user approval

---

## Migration Status Checklist

- [ ] Migration 1: Culinary Outreach Table
- [ ] Migration 2: Partnership Outreach Table
- [ ] Migration 3: Chef Compliance Fields
- [ ] Migration 4: Markets Table
- [ ] Migration 5: Recruitment Tables
- [ ] Migration 6: Client Lead Tracking Fields
- [ ] Verify all tables exist in Supabase
- [ ] Test all 6 bots via curl/Postman
- [ ] Review MARKETING-INFRASTRUCTURE.md
- [ ] Ready for campaign launch
