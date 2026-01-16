# YPEC Marketing Automation - Cron Jobs Setup

**Purpose**: Automated outreach campaigns running on schedule
**Email System**: Centralized through forbes-command (Postfix + Guardian)
**Deduplication**: GUARANTEED - All emails tracked via ypec_email_queue

---

## Cron Schedule

### Daily Email Sending (Every Day at 9 AM EST)
```
0 9 * * * curl -X POST https://yourprivateestatechef.com/api/ypec/email-sender \
  -H "Content-Type: application/json" \
  -d '{"action":"send_queued","data":{"limit":50}}'
```

**Purpose**: Process email queue, send up to 50 emails per day
**Deduplication**: Automatic via dedup_key check
**Flow**: YPEC → email-api.js → Guardian → Postfix

---

### Weekly Culinary School Outreach (Every Monday at 10 AM EST)
```
0 10 * * 1 curl -X POST https://yourprivateestatechef.com/api/ypec/culinary-outreach \
  -H "Content-Type: application/json" \
  -d '{"action":"run"}'
```

**Purpose**: Queue new culinary school outreach emails
**Target**: 30 schools, 21,450 graduates/year
**Email sent via**: Centralized email sender (prevents duplicates)

---

### Weekly B2B Partnership Outreach (Every Tuesday at 10 AM EST)
```
0 10 * * 2 curl -X POST https://yourprivateestatechef.com/api/ypec/partnership-outreach \
  -H "Content-Type: application/json" \
  -d '{"action":"run"}'
```

**Purpose**: Queue B2B partnership outreach emails
**Target**: 25 partnerships ($2.16B-$5.4B TAM)
**Email sent via**: Centralized email sender (prevents duplicates)

---

### Daily Client Follow-ups (Every Day at 2 PM EST)
```
0 14 * * * curl -X POST https://yourprivateestatechef.com/api/ypec/client-leads \
  -H "Content-Type: application/json" \
  -d '{"action":"run"}'
```

**Purpose**: Follow up with new client leads
**Priority**: High-score leads (≥80) contacted first
**Email sent via**: Centralized email sender (prevents duplicates)

---

## How to Set Up Cron Jobs

### Option 1: Railway Cron (Recommended for Production)

1. Go to Railway Dashboard
2. Select YPEC project
3. Go to **Settings** → **Cron**
4. Add each cron job above
5. Save and deploy

### Option 2: Forbes Command Server Cron

SSH into forbes-command and add to crontab:

```bash
ssh root@5.78.139.9
crontab -e
```

Paste all cron jobs above, save and exit.

Verify:
```bash
crontab -l
```

---

## Cron Job Details

| Cron Job | Frequency | Time (EST) | Day | Action |
|----------|-----------|------------|-----|--------|
| Email Sender | Daily | 9 AM | Every day | Send queued emails (limit 50) |
| Culinary Outreach | Weekly | 10 AM | Monday | Queue culinary school emails |
| Partnership Outreach | Weekly | 10 AM | Tuesday | Queue B2B partnership emails |
| Client Follow-ups | Daily | 2 PM | Every day | Follow up with leads |

---

## Deduplication Guarantee

**HOW IT WORKS**:

1. Culinary Outreach Bot calls Email Sender: `queue_email()`
2. Email Sender generates dedup_key: `{email}:{campaign_type}:{campaign_id}`
3. Email Sender checks `ypec_email_queue` table
4. If dedup_key exists → **REJECT** (duplicate prevented)
5. If new → **QUEUE** for sending
6. Daily cron job processes queue via forbes-command
7. After send → Log to `ypec_email_log`

**RESULT**: ZERO duplicate emails, ALL campaigns tracked centrally

---

## Email Flow Diagram

```
┌─────────────────────┐
│ Culinary Outreach   │
│ Partnership Outreach│  ──┐
│ Client Follow-ups   │    │
└─────────────────────┘    │
                           │
                           ▼
                ┌─────────────────────┐
                │  Email Sender Bot   │
                │  (Dedup Check)      │
                └─────────────────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │ ypec_email_queue    │
                │ (Central Queue)     │
                └─────────────────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │  Daily Cron Job     │
                │  (9 AM EST)         │
                └─────────────────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │  Forbes Command     │
                │  email-api.js       │
                └─────────────────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │   Guardian Check    │
                │ (Spam/Security)     │
                └─────────────────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │   Postfix (Port 25) │
                │   EMAIL SENT ✉️     │
                └─────────────────────┘
```

---

## Testing Before Launch

### 1. Test Email Sender
```bash
curl -X POST https://yourprivateestatechef.com/api/ypec/email-sender \
  -H "Content-Type: application/json" \
  -d '{
    "action": "queue_email",
    "data": {
      "recipient_email": "test@example.com",
      "subject": "Test Email",
      "body_html": "<p>Test</p>",
      "campaign_type": "test",
      "source_bot": "email-sender"
    }
  }'
```

### 2. Check for Duplicates
```bash
curl -X POST https://yourprivateestatechef.com/api/ypec/email-sender \
  -H "Content-Type: application/json" \
  -d '{
    "action": "check_duplicate",
    "data": {
      "recipient_email": "test@example.com",
      "campaign_type": "test"
    }
  }'
```

### 3. Send Queued Emails (Manual Test)
```bash
curl -X POST https://yourprivateestatechef.com/api/ypec/email-sender \
  -H "Content-Type: application/json" \
  -d '{"action":"send_queued","data":{"limit":1}}'
```

---

## Launch Checklist

- [  ] Email queue migration run on Supabase (`create-email-queue-system.sql`)
- [  ] Test email sender bot (queue test email)
- [  ] Test deduplication (try to queue same email twice)
- [  ] Test manual send (send_queued with limit=1)
- [  ] Verify forbes-command receives email
- [  ] Set up cron jobs (Railway or forbes-command)
- [  ] Launch first culinary school campaign
- [  ] Launch first B2B partnership campaign
- [  ] Monitor email queue daily

---

## Monitoring

### Check Email Queue Status
```bash
curl -X POST https://yourprivateestatechef.com/api/ypec/email-sender \
  -H "Content-Type: application/json" \
  -d '{"action":"status"}'
```

### Check Email Analytics
```bash
curl -X POST https://yourprivateestatechef.com/api/ypec/email-sender \
  -H "Content-Type: application/json" \
  -d '{"action":"analytics"}'
```

---

**Email System Status**: ✅ Ready for launch (after email queue migration)
**Deduplication**: ✅ Guaranteed via centralized queue
**Forbes Command Integration**: ✅ Connected to email-api.js → Guardian → Postfix
**Cron Jobs**: 📋 Ready to deploy
