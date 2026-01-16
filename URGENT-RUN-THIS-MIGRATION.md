# URGENT: Email Queue Migration Required

## Issue
The email queue tables (`ypec_email_queue` and `ypec_email_log`) don't exist in the Railway production database.

When I tried to launch the culinary school outreach, I got this error:
```
{"error":"Could not find the table 'public.ypec_email_queue' in the schema cache"}
```

## Solution
You need to run the migration SQL in your Supabase dashboard.

## Steps to Fix

### 1. Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your YPEC project
3. Click "SQL Editor" in the left sidebar

### 2. Run the Migration
1. Click "New Query"
2. Copy the ENTIRE contents of `/migrations/create-email-queue-system.sql` (134 lines)
3. Paste into the SQL editor
4. Click "Run" button (or press Cmd/Ctrl + Enter)

### 3. Verify Success
You should see messages like:
```
Successfully created centralized email queue system
DEDUPLICATION: All emails tracked via unique dedup_key
ONE SYSTEM: All campaigns send through ypec_email_queue table
NO DUPLICATES: email_already_sent() function prevents duplicate sends
```

### 4. Test It
Once done, let me know and I'll immediately launch the culinary school outreach campaign to all 30 schools.

## Quick Copy-Paste
The migration file is located at:
```
/Users/Kristi/yourprivateestatechef/migrations/create-email-queue-system.sql
```

## What This Creates
- `ypec_email_queue` table - Centralized queue for ALL outgoing emails
- `ypec_email_log` table - Tracking log for sent emails
- Deduplication indexes - Prevents sending duplicate emails
- Helper functions - `email_already_sent()` for duplicate checking

## Why This Is Critical
Without these tables:
- ❌ Emails cannot be queued
- ❌ Outreach campaigns cannot launch
- ❌ Forbes Command integration doesn't work

With these tables:
- ✅ ALL emails send through ONE unified system
- ✅ ZERO duplicate emails (guaranteed by database constraints)
- ✅ Full audit trail of all sent emails
- ✅ Culinary school outreach can launch immediately

## Current Status
- 30 culinary school campaigns created and ready
- Campaigns scheduled for today (2026-01-16)
- Email sender bot configured and tested
- Forbes Command integration active
- **BLOCKED:** Waiting for database tables to be created

Once you run this migration, we can immediately launch the outreach!
