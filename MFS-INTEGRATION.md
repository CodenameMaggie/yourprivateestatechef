# MFS Central Database Integration

## Overview

YPEC integrates with the **Maggie Forbes Strategies Central Database** - a unified Supabase database that stores leads from all Forbes portfolio companies.

**Central Database URL:** `https://bixudsnkdeafczzqfvdq.supabase.co`

---

## Database Architecture

### Centralized Leads Table

All leads flow into a single `leads` table with a `source` field to identify the business:

| Source Code | Business |
|-------------|----------|
| `SH_osm` | Steading Home |
| `TH_osm` | Timber Homestead |
| `IC_osm` | IntroConnected |
| `FF_osm` | Frequency & Form |
| **`YPEC_osm`** | **Your Private Estate Chef** |

---

## Environment Variables

### Required in Railway

Add these to your Railway environment variables:

```bash
# MFS Central Database (Shared across all Forbes companies)
MFS_SUPABASE_URL=https://bixudsnkdeafczzqfvdq.supabase.co
MFS_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
MFS_SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# YPEC Local Database (YPEC-specific tables)
SUPABASE_URL=<your-ypec-specific-url>
SUPABASE_ANON_KEY=<your-ypec-anon-key>
SUPABASE_SERVICE_KEY=<your-ypec-service-key>
```

### Database Usage Pattern

- **MFS Central DB** → Store leads with `source: 'YPEC_osm'`
- **YPEC Local DB** → Store YPEC-specific data (households, chefs, events, engagements, etc.)

---

## Integration Points

### 1. Lead Ingestion
When a booking form is submitted on yourprivateestatechef.com:
- Store lead in **MFS Central DB** `leads` table with `source: 'YPEC_osm'`
- Create household record in **YPEC Local DB** `ypec_households`
- Link via external_id or email

### 2. Lead Scraper
YPEC Lead Scraper bot (`/api/ypec/lead-scraper`):
- Searches web for high-net-worth individuals
- Stores scraped leads in **MFS Central DB** with `source: 'YPEC_osm'`
- Daily cron job runs at 6:00 AM

### 3. Cross-Portfolio Insights
Access leads from other Forbes businesses for cross-selling:
```sql
-- View all luxury homeowners (potential YPEC clients)
SELECT * FROM leads
WHERE source IN ('SH_osm', 'TH_osm')
  AND income_level = 'high_net_worth';
```

---

## Implementation Steps

### Step 1: Add MFS Environment Variables to Railway

1. Go to Railway dashboard → Your Private Estate Chef project
2. Click **Variables** tab
3. Add these three variables:
   - `MFS_SUPABASE_URL`
   - `MFS_SUPABASE_ANON_KEY`
   - `MFS_SUPABASE_SERVICE_KEY`
4. Save (Railway will auto-redeploy)

### Step 2: Update Bot Code

Bots will use dual-database pattern:
```javascript
const { getSupabase } = require('./database');           // YPEC local
const { getMFSSupabase } = require('./mfs-database');    // MFS central

// Store lead in MFS central
await getMFSSupabase().from('leads').insert({
  source: 'YPEC_osm',
  email: 'client@example.com',
  name: 'John Doe',
  ...
});

// Store household in YPEC local
await getSupabase().from('ypec_households').insert({
  primary_contact_email: 'client@example.com',
  ...
});
```

### Step 3: Test Integration

```bash
# Test MFS database connection
curl -X POST https://yourprivateestatechef.com/api/ypec/marketing \
  -H "Content-Type: application/json" \
  -d '{"action":"test_mfs_connection"}'
```

---

## Lead Schema (MFS Central)

### Typical Fields in `leads` Table

```sql
id                UUID PRIMARY KEY
source            VARCHAR(50)     -- 'YPEC_osm'
email             VARCHAR(255)
name              VARCHAR(255)
phone             VARCHAR(50)
location          VARCHAR(255)
income_level      VARCHAR(50)     -- 'high_net_worth', 'ultra_high_net_worth'
interest_level    VARCHAR(50)
notes             TEXT
created_at        TIMESTAMPTZ
updated_at        TIMESTAMPTZ
assigned_to       VARCHAR(100)
status            VARCHAR(50)     -- 'new', 'contacted', 'qualified', 'converted'
```

---

## Cross-Selling Opportunities

### From Other Forbes Companies → YPEC

**Steading Home (SH_osm):**
- Homeowners building luxury estates
- Perfect fit for private chef services

**Timber Homestead (TH_osm):**
- High-end timber home buyers
- Likely need estate chef for entertaining

**IntroConnected (IC_osm):**
- Executive networking leads
- Executive dinner series opportunity

**Frequency & Form (FF_osm):**
- Wellness-focused high achievers
- Nutrition-focused chef services

### From YPEC → Other Forbes Companies

**YPEC clients may need:**
- SH_osm: Estate design consultation
- TH_osm: Luxury timber pavilions for outdoor dining
- IC_osm: Executive networking
- FF_osm: Wellness coaching

---

## Security Notes

- ✅ MFS credentials stored as Railway environment variables (secure)
- ✅ Service keys never committed to GitHub
- ✅ ANON keys safe for frontend (RLS policies protect data)
- ✅ All API calls use backend endpoints (credentials hidden from users)

---

## Monitoring

### Check Lead Flow
```sql
-- Count YPEC leads in MFS central database
SELECT COUNT(*) FROM leads WHERE source = 'YPEC_osm';

-- Recent YPEC leads
SELECT * FROM leads
WHERE source = 'YPEC_osm'
ORDER BY created_at DESC
LIMIT 10;
```

### Check Cross-Portfolio Leads
```sql
-- All Forbes portfolio leads from last 7 days
SELECT source, COUNT(*) as lead_count
FROM leads
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY source;
```

---

## Support

**MFS Central Database Issues:**
Contact system admin or check Supabase dashboard:
https://supabase.com/dashboard/project/bixudsnkdeafczzqfvdq

**YPEC Bot Issues:**
Check Railway logs: `railway logs`
Check API health: `curl https://yourprivateestatechef.com/api/health`
