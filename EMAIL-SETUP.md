# YPEC Email Configuration Guide

## Overview

This guide covers setting up email routing for Your Private Estate Chef on the Forbes Command infrastructure.

**Server:** 5.78.139.9 (Forbes Command)
**Email Port:** 25
**Company:** YPEC (#7)

---

## Email Addresses

### Primary Contact
- **concierge@yourprivateestatechef.com** → YPEC-Concierge (High Priority)
- **info@yourprivateestatechef.com** → YPEC-Concierge
- **hello@yourprivateestatechef.com** → YPEC-Concierge

### Department-Specific
- **chef-relations@yourprivateestatechef.com** → YPEC-ChefRelations
- **operations@yourprivateestatechef.com** → YPEC-Operations
- **billing@yourprivateestatechef.com** → YPEC-Revenue (High Priority)
- **revenue@yourprivateestatechef.com** → YPEC-Revenue (High Priority)
- **marketing@yourprivateestatechef.com** → YPEC-Marketing

### Support Aliases
- **support@yourprivateestatechef.com** → YPEC-Concierge (High Priority)
- **help@yourprivateestatechef.com** → YPEC-Concierge (High Priority)

---

## DNS Configuration

### MX Records

Add to your DNS provider (Cloudflare, GoDaddy, etc.):

```
Type: MX
Name: @
Value: mail.yourprivateestatechef.com
Priority: 10
TTL: 3600
```

```
Type: A
Name: mail
Value: 5.78.139.9
TTL: 3600
```

### SPF Record

```
Type: TXT
Name: @
Value: v=spf1 ip4:5.78.139.9 ~all
TTL: 3600
```

### DKIM Record

Generate DKIM key on Forbes Command server:

```bash
cd /etc/opendkim/keys
opendkim-genkey -s ypec -d yourprivateestatechef.com
```

Add the public key to DNS:

```
Type: TXT
Name: ypec._domainkey
Value: [Content from ypec.txt file]
TTL: 3600
```

### DMARC Record

```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@yourprivateestatechef.com
TTL: 3600
```

---

## Forbes Command Email Integration

### 1. Update Email Listener

Edit `/root/mfs/email-listener.js`:

```javascript
// Add YPEC email routing
const ypecRouter = require('./api/ypec/email-router');

// In email handler function:
if (email.to.endsWith('@yourprivateestatechef.com')) {
  const result = await ypecRouter.routeEmail({
    to: email.to,
    from: email.from,
    subject: email.subject,
    body: email.body,
    headers: email.headers
  });

  console.log('[EmailListener] YPEC routing result:', result);
  return result;
}
```

### 2. Test Email Routing

```bash
# On Forbes Command server
cd /root/mfs/api/ypec

# Test concierge routing
node -e "
const router = require('./email-router');
router.testRoute('concierge@yourprivateestatechef.com', {
  from: 'John Doe <john@example.com>',
  subject: 'Interested in personal chef services',
  body: 'I live in Austin and would like to learn more about your services. My phone is 512-555-1234.'
}).then(console.log);
"
```

Expected output:
```json
{
  "success": true,
  "bot": "concierge",
  "action": "acknowledge",
  "response": {
    "success": true,
    "inquiry_id": "...",
    "message": "Inquiry acknowledged and email sent"
  }
}
```

---

## Email Flow

### Incoming Email → Bot Response

```
1. Email arrives at Port 25 (5.78.139.9)
   ↓
2. Forbes Command email listener receives
   ↓
3. Checks domain: @yourprivateestatechef.com
   ↓
4. Routes to YPEC email-router.js
   ↓
5. Parses email content (name, phone, service interest)
   ↓
6. Routes to appropriate bot endpoint
   ↓
7. Bot processes and stores in Supabase
   ↓
8. Bot sends acknowledgment email
   ↓
9. Bot notifies C-suite (ANNIE, HENRY, etc.)
```

### Example Flow: New Inquiry

```
Email to: concierge@yourprivateestatechef.com
From: Jane Smith <jane@example.com>
Subject: Personal chef services in Dallas
Body: "I'm interested in weekly chef services for my family of 4..."

→ Routed to: YPEC-Concierge bot
→ Action: acknowledge
→ Creates: ypec_inquiries record
→ Sends: Acknowledgment email to jane@example.com
→ Notifies: ANNIE (CSO) via MFS integration
→ Logs: ypec_communications record
```

---

## Email Templates

### Acknowledgment Email (sent by YPEC-Concierge)

**Subject:** We've received your introduction request

**Body:**
```
Dear [Name],

Thank you for your interest in Your Private Estate Chef.

We've received your inquiry and are delighted to learn more about how we can serve your household. A member of our concierge team will be in touch within 24 hours to discuss your culinary needs and preferences.

In the meantime, you may visit our website to explore our services:
https://yourprivateestatechef.com

We look forward to welcoming you to the table.

Warmly,
The YPEC Concierge Team

---
Your Private Estate Chef
concierge@yourprivateestatechef.com
https://yourprivateestatechef.com
```

### Consultation Confirmation (sent by YPEC-Concierge)

**Subject:** Your YPEC Consultation - [Date] at [Time]

**Body:**
```
Dear [Name],

We're pleased to confirm your consultation with Your Private Estate Chef.

CONSULTATION DETAILS:
Date: [Date]
Time: [Time] Central
Duration: 30-45 minutes
Format: Phone/Video call

During our conversation, we'll discuss:
- Your household's culinary needs and preferences
- Dietary requirements and cuisine preferences
- Service frequency and scheduling
- Chef matching process
- Pricing and next steps

We'll call you at [Phone Number] at the scheduled time.

If you need to reschedule, please reply to this email or call us at [Phone].

We're looking forward to our conversation.

Warmly,
The YPEC Concierge Team
```

---

## Monitoring & Logs

### View Email Routing Logs

```bash
# On Forbes Command server
tail -f /var/log/email-listener.log | grep YPEC
```

### Check Bot Response Logs

```bash
tail -f /root/mfs/api/ypec/logs/concierge.log
tail -f /root/mfs/api/ypec/logs/chef-relations.log
tail -f /root/mfs/api/ypec/logs/operations.log
tail -f /root/mfs/api/ypec/logs/revenue.log
tail -f /root/mfs/api/ypec/logs/marketing.log
```

### Monitor Email Deliverability

```bash
# Check email queue
mailq

# Check if emails are being delivered
tail -f /var/log/mail.log | grep yourprivateestatechef
```

---

## Troubleshooting

### Emails Not Arriving

**Check:**
1. DNS MX record is correct: `dig MX yourprivateestatechef.com`
2. Port 25 is open: `telnet 5.78.139.9 25`
3. Email listener is running: `pm2 list | grep email-listener`
4. Firewall allows Port 25: `sudo ufw status | grep 25`

**Fix:**
```bash
# Restart email listener
pm2 restart email-listener

# Check email listener logs
pm2 logs email-listener
```

### Emails Arriving But Not Routing

**Check:**
1. YPEC email-router.js exists: `ls /root/mfs/api/ypec/email-router.js`
2. Bot endpoints are running: `curl http://localhost:3000/api/ypec/concierge -d '{"action":"status"}'`
3. Email routing logs: `tail -f /var/log/email-listener.log`

**Fix:**
```bash
# Test email routing manually
cd /root/mfs/api/ypec
node email-router.js
```

### Bot Not Responding

**Check:**
1. Supabase credentials: `cat /root/mfs/api/ypec/.env | grep SUPABASE`
2. Bot logs: `tail -f /root/mfs/api/ypec/logs/*.log`
3. Database connectivity: `curl [SUPABASE_URL]/rest/v1/ypec_inquiries -H "apikey: [KEY]"`

**Fix:**
```bash
# Restart all YPEC bots
pm2 restart ypec-concierge
pm2 restart ypec-chef-relations
pm2 restart ypec-operations
pm2 restart ypec-revenue
pm2 restart ypec-marketing
```

### Acknowledgment Emails Not Sending

**Check:**
1. SMTP configuration in .env
2. Email sending function logs
3. Supabase communications table

**Fix:**
```bash
# Check SMTP settings
cat /root/mfs/api/ypec/.env | grep SMTP

# Test email sending
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 25
});
transporter.sendMail({
  from: 'concierge@yourprivateestatechef.com',
  to: 'test@example.com',
  subject: 'Test',
  text: 'Test email'
}).then(console.log).catch(console.error);
"
```

---

## Spam Prevention

### Block Common Spam Patterns

Add to email listener:

```javascript
const spamPatterns = [
  /viagra/i,
  /lottery/i,
  /nigerian prince/i,
  /click here to claim/i,
  /congratulations you won/i
];

if (spamPatterns.some(pattern => pattern.test(email.subject) || pattern.test(email.body))) {
  console.log('[EmailListener] Spam detected, ignoring');
  return { success: false, reason: 'spam' };
}
```

### Rate Limiting

```javascript
const emailRateLimiter = {};

function checkRateLimit(from) {
  const now = Date.now();
  if (!emailRateLimiter[from]) {
    emailRateLimiter[from] = { count: 1, firstSeen: now };
    return true;
  }

  const timeDiff = now - emailRateLimiter[from].firstSeen;
  if (timeDiff < 60000) { // 1 minute
    emailRateLimiter[from].count++;
    if (emailRateLimiter[from].count > 5) {
      console.log(`[EmailListener] Rate limit exceeded for ${from}`);
      return false;
    }
  } else {
    // Reset counter
    emailRateLimiter[from] = { count: 1, firstSeen: now };
  }

  return true;
}
```

---

## Testing Checklist

- [ ] DNS MX record configured
- [ ] SPF record added
- [ ] DKIM key generated and added
- [ ] DMARC policy configured
- [ ] Email listener running
- [ ] Test email to concierge@yourprivateestatechef.com
- [ ] Verify inquiry created in Supabase
- [ ] Verify acknowledgment email sent
- [ ] Verify ANNIE notified
- [ ] Test all email addresses
- [ ] Monitor logs for 24 hours

---

## Production Checklist

- [ ] All DNS records propagated (wait 24-48 hours)
- [ ] Email deliverability tested with mail-tester.com (score >8/10)
- [ ] Acknowledgment email templates reviewed
- [ ] Bot endpoints tested under load
- [ ] Supabase connection pooling configured
- [ ] Email logs rotation configured
- [ ] Spam filters configured
- [ ] Rate limiting enabled
- [ ] Monitoring alerts configured

---

**Last Updated:** 2026-01-12
**Version:** 1.0
**Maintained by:** Forbes Command / YPEC Team
