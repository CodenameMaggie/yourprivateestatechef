# YPEC Database Schema

This directory contains the database schema for **Your Private Estate Chef** (Company #7 in the MFS ecosystem).

## Overview

The YPEC database tracks:
- **Households** - Client families and their preferences
- **Chefs** - Private estate chefs in the network
- **Engagements** - Ongoing service arrangements between households and chefs
- **Events** - Individual meals, dinners, and gatherings
- **Communications** - Log of all interactions

## Setup Instructions

### 1. Access your Supabase Project

```bash
# Log in to Supabase (if not already)
npx supabase login

# Link to your project
npx supabase link --project-ref YOUR_PROJECT_REF
```

### 2. Run the Migration

You can either:

**Option A: Via Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `001_initial_schema.sql`
4. Run the query

**Option B: Via CLI**
```bash
# From the yourprivateestatechef directory
npx supabase db push

# Or apply the specific migration
psql YOUR_DATABASE_URL -f database/001_initial_schema.sql
```

### 3. Verify Tables

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'ypec_%';
```

You should see:
- ypec_households
- ypec_chefs
- ypec_engagements
- ypec_events
- ypec_communications

## Table Relationships

```
ypec_households (1) ─┬─ (M) ypec_engagements ─ (M) ypec_chefs
                     │
                     └─ (M) ypec_events ─ (M) ypec_chefs
```

## Key Fields

### ypec_households
- `status`: inquiry → consultation_scheduled → consultation_complete → active
- `service_type`: weekly, events, residency, seasonal
- `chef_assigned`: FK to ypec_chefs

### ypec_chefs
- `status`: applicant → interview → onboarding → active
- `availability`: available, limited, full, inactive
- `specialties`: Array of culinary specialties

### ypec_engagements
- `service_type`: weekly, one-time, seasonal, residency
- `status`: proposed → accepted → active → completed/cancelled
- Links household to chef with terms

### ypec_events
- Individual meal prep sessions or dinner parties
- Linked to engagement and household
- Tracks menu, feedback, ratings

## Row Level Security (RLS)

RLS is currently **disabled** in the schema. To enable:

```sql
ALTER TABLE ypec_households ENABLE ROW LEVEL SECURITY;
ALTER TABLE ypec_chefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ypec_engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ypec_events ENABLE ROW LEVEL SECURITY;

-- Create policies as needed
CREATE POLICY "Allow admin access" ON ypec_households
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
```

## Forbes Command Integration

The YPEC bots will interact with these tables:

- **YPEC-Concierge**: Reads/writes to `ypec_households` (inquiries, consultations)
- **YPEC-Operations**: Reads/writes to `ypec_engagements`, `ypec_events`
- **YPEC-ChefRelations**: Reads/writes to `ypec_chefs`
- **YPEC-Client**: Reads all tables, writes to `ypec_communications`

## Environment Variables

Add to your Forbes Command `.env`:

```env
# YPEC Database (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# YPEC Email
YPEC_INQUIRY_EMAIL=private@yourprivateestatechef.com
```

## Backup

Recommended: Set up Supabase automatic backups or use:

```bash
pg_dump YOUR_DATABASE_URL > ypec_backup_$(date +%Y%m%d).sql
```

## Next Steps

1. ✅ Run migration in Supabase
2. Create YPEC bots in Forbes Command
3. Connect bots to database via Supabase client
4. Set up email forwarding to bot endpoints
5. Test inquiry workflow
