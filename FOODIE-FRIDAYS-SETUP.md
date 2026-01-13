# Foodie Fridays Podcast - Calendly Integration

## Overview

**Foodie Fridays** is the YPEC podcast featuring culinary professionals, chefs, and food industry experts. Bookings are handled via Calendly with automatic webhook integration.

**🎙️ RULE:** Only Friday bookings allowed (hence "Foodie Fridays")

---

## Calendly Configuration

### Public Booking Link
```
https://calendly.com/maggie-maggieforbesstrategies/podcast-your-private-estate-chef
```

Share this link with potential podcast guests. Calendly is configured to only show Friday time slots.

### Webhook URL
```
https://yourprivateestatechef.com/api/ypec/calendly-webhook
```

### Personal Access Token (Already Configured)
```
eyJraWQiOiIxY2UxZTEzNjE3ZGNmNzY2YjNjZWJjY2Y4ZGM1YmFmYThhNjVlNjg0MDIzZjdjMzJiZTgzNDliMjM4MDEzNWI0IiwidHlwIjoiUEFUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJodHRwczovL2F1dGguY2FsZW5kbHkuY29tIiwiaWF0IjoxNzY4MzM0NDc3LCJqdGkiOiIwYjg4ZDc2Zi1lZDMyLTQ0YTQtYjNjYi0wYjM2ZTY3ZDM3NWIiLCJ1c2VyX3V1aWQiOiJkNDk1YjhhOS01ZTMwLTQzMmItOTE0ZC1hMGNlYjM4MWQyOGIifQ.e1DIkA5lwvmQQvrRGQXc2Vjl7EHghFTiiR-Uz04avChPsyRUXYV2K9V_a-s2Irdbx_VFJavJGHx4TfoQ0AgCyQ
```

---

## Setup Steps

### 1. Configure Calendly Event

1. Log into Calendly: https://calendly.com/
2. Create new event type: **"Foodie Fridays Podcast Recording"**
3. Settings:
   - **Duration:** 60 minutes
   - **Availability:** Fridays ONLY
   - **Time slots:** 9:00 AM - 4:00 PM (Central Time)
   - **Buffer time:** 15 minutes between recordings

4. **Custom Questions** (recommended):
   ```
   Q1: What is your culinary expertise or specialty?
   Q2: What topic would you like to discuss on the podcast?
   Q3: Brief professional background (1-2 sentences)
   ```

### 2. Set Up Webhook in Calendly

1. Go to Calendly **Integrations → Webhooks**
2. Click **Add Webhook**
3. Webhook URL:
   ```
   https://yourprivateestatechef.com/api/ypec/calendly-webhook
   ```
4. Subscribe to events:
   - ✅ `invitee.created` (New booking)
   - ✅ `invitee.canceled` (Cancellation)
5. Save webhook

### 3. Test the Integration

```bash
# Test webhook endpoint
curl -X POST https://yourprivateestatechef.com/api/ypec/calendly-webhook \
  -H "Content-Type: application/json" \
  -d '{"event":"test"}'
```

Expected response:
```json
{
  "success": true,
  "message": "Calendly webhook test successful",
  "config": {
    "allowed_day": "Friday",
    "event_name": "Foodie Fridays Podcast"
  }
}
```

---

## How It Works

### Booking Flow

```
1. Guest books on Calendly
   ↓
2. Calendly sends webhook to YPEC
   ↓
3. System validates: Is it a Friday?
   ├─ YES → Booking confirmed
   │   ├─ Store in ypec_podcast_bookings table
   │   ├─ Send confirmation email to guest
   │   ├─ Notify ANNIE (Customer Service)
   │   ├─ Notify DAN (Marketing - potential lead)
   │   └─ Sync to MFS central database
   │
   └─ NO → Booking rejected
       ├─ Send email: "Please book on a Friday"
       └─ Guest must reschedule
```

### Friday Validation

The system automatically checks the day of week:
- **Friday ✅** → Booking proceeds
- **Monday-Thursday or Saturday-Sunday ❌** → Booking rejected with friendly email

---

## Database Table

Run this SQL in Supabase to create the podcast bookings table:

**File:** `database/03-podcast-table.sql`

**Table:** `ypec_podcast_bookings`

**Fields:**
- Guest info (name, email, phone)
- Scheduling (date, time, timezone)
- Guest details (expertise, topic, background)
- Status (confirmed, completed, canceled, no_show)
- Recording details (Zoom link, recording URL, episode number)

---

## Email Confirmations

### Confirmation Email (Sent Automatically)

**Subject:** 🎙️ Foodie Friday Confirmed - See You Soon!

**Content:**
```
Dear [Guest Name],

Welcome to Foodie Fridays!

Your podcast recording is confirmed:

📅 DATE: [Friday, Month Day, Year]
⏰ TIME: [Time] [Timezone]
⏱️ DURATION: 45-60 minutes

WHAT TO EXPECT:
✓ Relaxed conversation about your culinary expertise
✓ Behind-the-scenes stories and cooking tips
✓ Discussion about [their topic]
✓ Live recording via Zoom (link sent 24 hours before)

PREPARATION:
- Have your favorite cooking stories ready
- Quiet space with good lighting
- Headphones recommended for best audio
- Be yourself and have fun!

Looking forward to Friday!

Warmly,
The Foodie Fridays Team
Your Private Estate Chef
```

### Rejection Email (Non-Friday Booking)

**Subject:** Foodie Fridays - Please Book on a Friday

**Content:**
```
Dear [Guest Name],

Thank you for your interest in Foodie Fridays!

We noticed you tried to book on a [Day]. Our podcast recordings only take place on FRIDAYS (hence the name 😊).

Please visit our Calendly link again and select a Friday that works for you:
https://calendly.com/maggie-maggieforbesstrategies/podcast-your-private-estate-chef

We'd love to have you on the show!
```

---

## Team Notifications

### ANNIE (Customer Service) Receives:
- ✅ New booking notifications
- ✅ Cancellation notifications
- ✅ Guest contact info for follow-up

### DAN (Marketing) Receives:
- ✅ New guest bookings (potential YPEC leads)
- ✅ Guest details for marketing outreach
- ✅ Opportunity to convert podcast guests to clients

### MFS Central Database:
- All podcast guests stored as leads with source: `YPEC_osm`
- Tagged as "engaged" leads (podcast participation = high intent)

---

## Viewing Bookings

### In Admin Dashboard
```
GET /api/ypec/operations
action: "upcoming_events"
```

Shows upcoming Foodie Friday recordings.

### Database Query
```sql
-- Upcoming Friday recordings
SELECT * FROM ypec_podcast_bookings
WHERE scheduled_date >= CURRENT_DATE
  AND status = 'confirmed'
ORDER BY scheduled_date;

-- This week's recordings
SELECT
  guest_name,
  guest_email,
  scheduled_date,
  scheduled_time,
  topic,
  expertise
FROM ypec_podcast_bookings
WHERE scheduled_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
  AND status = 'confirmed';
```

---

## Webhook Events

### invitee.created
**Trigger:** New booking made
**Action:**
- Validate Friday
- Store booking
- Send confirmation
- Notify team

### invitee.canceled
**Trigger:** Guest cancels booking
**Action:**
- Update status to 'canceled'
- Notify team
- Open slot for rebooking

---

## Recording Workflow

### 24 Hours Before Recording
1. Send Zoom link to guest (manual or automated)
2. Send prep materials
3. Confirm guest availability

### Day of Recording
1. Join Zoom 10 minutes early
2. Record conversation
3. Thank guest
4. Update booking status to 'completed'

### After Recording
1. Upload recording URL to database
2. Edit and publish episode
3. Update `published_date` field
4. Send published episode link to guest

---

## Troubleshooting

### Webhook Not Firing

**Check:**
1. Webhook URL is correct in Calendly
2. Endpoint is live: `curl https://yourprivateestatechef.com/api/ypec/calendly-webhook -d '{"event":"test"}'`
3. Calendly webhook subscription is active

**Fix:**
```bash
# Check Railway logs
railway logs | grep Calendly

# Test endpoint manually
curl -X POST https://yourprivateestatechef.com/api/ypec/calendly-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "invitee.created",
    "payload": {
      "event": {
        "uri": "https://api.calendly.com/scheduled_events/TEST",
        "start_time": "2026-01-17T10:00:00Z",
        "end_time": "2026-01-17T11:00:00Z"
      },
      "invitee": {
        "uri": "https://api.calendly.com/scheduled_events/TEST/invitees/TEST",
        "name": "Test Guest",
        "email": "test@example.com",
        "created_at": "2026-01-13T00:00:00Z",
        "timezone": "America/Chicago"
      }
    }
  }'
```

### Non-Friday Bookings Getting Through

**Check:**
1. Calendly event settings (should only show Fridays)
2. Day validation logic in `calendly-webhook.js`

**Fix:**
- Update Calendly event to restrict availability to Fridays only
- System will still reject non-Friday bookings via webhook

### Emails Not Sending

**Check:**
1. Email configuration in YPEC system
2. `ypec_communications` table for email records

**Fix:**
```bash
# Check email sending capability
curl -X POST https://yourprivateestatechef.com/api/ypec/concierge \
  -H "Content-Type: application/json" \
  -d '{"action":"test_email"}'
```

---

## Marketing Benefits

### Podcast Guests = High-Value Leads

**Why podcast guests are premium leads:**
1. **Pre-qualified:** Culinary professionals or food enthusiasts
2. **Engaged:** Willing to spend 60 minutes discussing food
3. **Network:** Likely know other high-net-worth individuals
4. **Trust:** Already interacted with YPEC brand

**DAN's Actions:**
- Track all podcast guests in MFS central database
- Follow up 1 week after recording with YPEC services info
- Offer exclusive "podcast guest discount" on first service
- Ask for referrals to their network

---

## Future Enhancements

### Phase 2 (After First Revenue)
- [ ] Automated Zoom link generation
- [ ] Pre-recording email sequence (3 days, 1 day, morning of)
- [ ] Post-recording thank you sequence
- [ ] Automated episode publishing workflow
- [ ] Guest rating/feedback system
- [ ] Referral tracking (guest brings other guests)

### Phase 3 (After 10 Episodes)
- [ ] Podcast website integration
- [ ] Episode library on YPEC site
- [ ] Guest testimonials auto-published
- [ ] Social media auto-posting
- [ ] Podcast analytics dashboard

---

## Summary

✅ **Webhook URL:** `https://yourprivateestatechef.com/api/ypec/calendly-webhook`
✅ **Token:** Already configured in `calendly-webhook.js`
✅ **Restriction:** Fridays ONLY (automated validation)
✅ **Database:** `ypec_podcast_bookings` table
✅ **Notifications:** ANNIE + DAN automatically notified
✅ **Lead Tracking:** All guests synced to MFS central database

**Ready to launch Foodie Fridays! 🎙️🍽️**
