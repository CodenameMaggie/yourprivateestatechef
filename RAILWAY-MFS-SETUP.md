# Railway Environment Variables - MFS Integration Setup

## Overview
YPEC needs access to the **MFS Central Database** to sync leads across all Forbes portfolio companies (Steading Home, Timber Homestead, IntroConnected, Frequency & Form, and YPEC).

---

## Step-by-Step Setup

### 1. Go to Railway Dashboard
https://railway.app/dashboard

### 2. Select Your YPEC Project
Click on "Your Private Estate Chef" or "yourprivateestatechef" project

### 3. Click on "Variables" Tab

### 4. Add MFS Database Variables

Click **"+ New Variable"** and add each of these **THREE** variables:

#### Variable 1: MFS_SUPABASE_URL
```
MFS_SUPABASE_URL
```
**Value:**
```
https://bixudsnkdeafczzqfvdq.supabase.co
```

#### Variable 2: MFS_SUPABASE_ANON_KEY
```
MFS_SUPABASE_ANON_KEY
```
**Value:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpeHVkc25rZGVhZmN6enFmdmRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NTUyOTQsImV4cCI6MjA3OTMzMTI5NH0.a3fXuai1t8CGM7XlthgcDwOS76G_KnQ4k2wWBOifVLU
```

#### Variable 3: MFS_SUPABASE_SERVICE_KEY
```
MFS_SUPABASE_SERVICE_KEY
```
**Value:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpeHVkc25rZGVhZmN6enFmdmRxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzc1NTI5NCwiZXhwIjoyMDc5MzMxMjk0fQ.eGuTmmYqpS2SPaRN9Xz4Tryy0Ndw_td91ylc07TgJi0
```

### 5. Save Variables

Railway will automatically redeploy your application with the new environment variables.

---

## Current Railway Variables (Should Have)

After setup, you should have **ALL** of these variables:

### YPEC Local Database (Already Set)
- ✅ `SUPABASE_URL` - Your YPEC-specific database
- ✅ `SUPABASE_ANON_KEY` - YPEC database anon key
- ✅ `SUPABASE_SERVICE_KEY` - YPEC database service key

### MFS Central Database (NEW - Add These)
- ⚠️ `MFS_SUPABASE_URL` - MFS central database URL
- ⚠️ `MFS_SUPABASE_ANON_KEY` - MFS anon key
- ⚠️ `MFS_SUPABASE_SERVICE_KEY` - MFS service key

### Other Variables (Already Set)
- ✅ `NODE_ENV` - production
- ✅ `PORT` - 3000 (or auto-assigned by Railway)
- ✅ `DOMAIN` - https://yourprivateestatechef.com
- ✅ `MFS_BASE_URL` - https://maggieforbesstrategies.com (optional)

---

## Test MFS Connection

After Railway redeploys (takes ~1-2 minutes), test the connection:

```bash
curl -X POST https://yourprivateestatechef.com/api/ypec/marketing \
  -H "Content-Type: application/json" \
  -d '{"action":"test_mfs_connection"}'
```

**Expected Response:**
```json
{
  "success": true,
  "connected": true,
  "message": "MFS Central Database connected successfully",
  "ypec_leads_count": 0
}
```

---

## Available MFS Actions

Once connected, you can:

### 1. Test Connection
```bash
POST /api/ypec/marketing
{"action": "test_mfs_connection"}
```

### 2. Sync YPEC Leads to MFS
```bash
POST /api/ypec/marketing
{"action": "sync_mfs_leads"}
```
Syncs all YPEC inquiries to MFS central database with source tag `YPEC_osm`

### 3. Get Cross-Portfolio Lead Opportunities
```bash
POST /api/ypec/marketing
{"action": "cross_portfolio_leads"}
```
Finds high-net-worth leads from Steading Home and Timber Homestead who might need private chef services

---

## How It Works

### Dual-Database Architecture

**YPEC Local Database:**
- `ypec_households` - Client households
- `ypec_chefs` - Chef network
- `ypec_events` - Scheduled dinners/meals
- `ypec_engagements` - Ongoing service contracts
- `ypec_inquiries` - Booking form submissions

**MFS Central Database:**
- `leads` table - ALL leads from all Forbes companies
- Source field identifies business: `YPEC_osm`, `SH_osm`, `TH_osm`, etc.
- Enables cross-selling and unified lead tracking

### Lead Flow
1. User submits booking form on yourprivateestatechef.com
2. YPEC stores inquiry in local database (`ypec_inquiries`)
3. Marketing bot syncs to MFS central database (`leads` with `source: 'YPEC_osm'`)
4. Appears in centralized Forbes Command dashboard across all companies

---

## Troubleshooting

### "MFS database not configured" Error
- Check that all 3 MFS variables are added to Railway
- Verify variable names are **exact** (case-sensitive)
- Wait 1-2 minutes for Railway to redeploy

### Connection Test Fails
- Verify SUPABASE_URL ends with `.supabase.co`
- Check that keys are complete (very long strings starting with `eyJhbG...`)
- Ensure no extra spaces in variable values

### Leads Not Syncing
- Run sync manually: `POST /api/ypec/marketing` with `action: sync_mfs_leads`
- Check Railway logs: `railway logs` (if Railway CLI installed)
- Verify MFS database has `leads` table with `source` column

---

## Security Notes

- ✅ All credentials stored as Railway environment variables (secure)
- ✅ Never committed to GitHub
- ✅ Service keys give full database access - keep secure
- ✅ ANON keys are safe for frontend (protected by Row Level Security)

---

## Next Steps After Setup

1. ✅ Add 3 MFS variables to Railway
2. ✅ Wait for automatic redeploy (~2 min)
3. ✅ Test connection via curl
4. ✅ Run initial lead sync
5. ✅ Monitor cross-portfolio opportunities

Then leads will automatically sync between YPEC and the MFS central system!
