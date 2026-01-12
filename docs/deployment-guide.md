# YPEC Deployment Guide

**Document:** Step-by-step deployment instructions
**Company:** Your Private Estate Chef (Company #7)
**Last Updated:** January 2026

---

## Pre-Deployment Checklist

- [ ] Domain `yourprivateestatechef.com` registered and accessible
- [ ] Supabase project created and accessible
- [ ] Forbes Command instance running
- [ ] Email infrastructure ready (Port 25 / AWS SES)
- [ ] All files reviewed and customized

---

## Part 1: Deploy Landing Page

### Option A: Deploy to Vercel (Recommended)

**Step 1: Install Vercel CLI**
```bash
npm install -g vercel
```

**Step 2: Deploy**
```bash
cd ~/yourprivateestatechef
vercel --prod
```

**Step 3: Configure Domain**
```bash
vercel domains add yourprivateestatechef.com
```

Follow Vercel's instructions to update DNS records.

**Step 4: Verify**
Visit https://www.yourprivateestatechef.com

---

### Option B: Deploy to Railway (With Forbes Command)

**Step 1: Add to existing Railway project**
```bash
cd ~/yourprivateestatechef
railway link [your-project-id]
railway up
```

**Step 2: Configure custom domain**
In Railway dashboard:
- Settings → Domains
- Add `yourprivateestatechef.com`
- Update DNS to point to Railway

---

### Option C: Deploy to Static Host (Netlify, GitHub Pages, etc.)

Simply upload `public/index.html` to your chosen host and configure domain.

---

## Part 2: Set Up Database

### Step 1: Access Supabase

```bash
cd ~/yourprivateestatechef/database
```

### Step 2: Run Migration

**Via Supabase Dashboard:**
1. Go to https://supabase.com → Your project
2. Click **SQL Editor** in sidebar
3. Open `001_initial_schema.sql`
4. Copy entire contents
5. Paste into SQL Editor
6. Click **Run**

**Via CLI (if configured):**
```bash
npx supabase db push
```

### Step 3: Verify Tables Created

Run this query in SQL Editor:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'ypec_%';
```

Expected output:
- ypec_households
- ypec_chefs
- ypec_engagements
- ypec_events
- ypec_communications

### Step 4: Get Supabase Credentials

In Supabase Dashboard → Settings → API:
- Copy **Project URL** (e.g., https://xxxxx.supabase.co)
- Copy **anon/public key**
- Copy **service_role key** (secret!)

Save these for Forbes Command configuration.

---

## Part 3: Configure Email Infrastructure

### Step 1: Set Up MX Records

In your DNS provider (Namecheap, Cloudflare, etc.), add MX records for `yourprivateestatechef.com`:

```
Type: MX
Name: @
Value: [Your mail server - e.g., mail.yourdomain.com]
Priority: 10
```

If using **AWS SES** (recommended for MFS ecosystem):
- Follow AWS SES verification process for domain
- Set up DKIM, SPF, DMARC records as provided by AWS

### Step 2: Create Email Addresses

Create these addresses:
- private@yourprivateestatechef.com (primary inquiry)
- chefs@yourprivateestatechef.com (chef applications)
- client@yourprivateestatechef.com (client communications)

### Step 3: Forward to Forbes Command

Set up email forwarding rules:

**private@yourprivateestatechef.com** → Forbes Command endpoint `/api/ypec-concierge`
**chefs@yourprivateestatechef.com** → Forbes Command endpoint `/api/ypec-chefrelations`
**client@yourprivateestatechef.com** → Forbes Command endpoint `/api/ypec-client`

(Exact configuration depends on your Forbes Command setup - see Forbes Command email integration docs)

---

## Part 4: Deploy YPEC Bots to Forbes Command

### Step 1: Access Forbes Command Codebase

```bash
cd ~/growthmanagerpro-rebuild
# Or wherever Forbes Command is located
```

### Step 2: Create YPEC Bot Files

Create these files in Forbes Command's `api/` directory (or wherever bots are defined):

**api/ypec-concierge.js**
```javascript
// Implementation based on bots/ypec-concierge.md
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async (req, res) => {
  // Handle incoming emails to private@yourprivateestatechef.com
  // Parse email, create household record, send acknowledgment

  // See ~/yourprivateestatechef/bots/ypec-concierge.md for full logic
};
```

**api/ypec-operations.js**
```javascript
// Implementation based on bots/ypec-operations.md
// Chef matching, engagement creation, scheduling
```

**api/ypec-chefrelations.js**
```javascript
// Implementation based on bots/ypec-chefrelations.md
// Chef recruitment, onboarding, performance management
```

**api/ypec-client.js**
```javascript
// Implementation based on bots/ypec-client.md
// Client communications, feedback, relationship management
```

### Step 3: Update Environment Variables

Add to Forbes Command `.env`:
```env
# YPEC - Your Private Estate Chef
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

YPEC_INQUIRY_EMAIL=private@yourprivateestatechef.com
YPEC_CHEF_EMAIL=chefs@yourprivateestatechef.com
YPEC_CLIENT_EMAIL=client@yourprivateestatechef.com

# Email sending (AWS SES or similar)
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM=private@yourprivateestatechef.com
```

### Step 4: Deploy Forbes Command

```bash
git add .
git commit -m "Add YPEC bots to Forbes Command"
git push

# If using Railway
railway up
```

### Step 5: Test Bot Endpoints

Send test email to private@yourprivateestatechef.com

Expected behavior:
1. Email arrives
2. Forbes Command routes to `/api/ypec-concierge`
3. Bot creates record in `ypec_households`
4. Bot sends acknowledgment email back
5. Record appears in Supabase

Check logs:
```bash
railway logs
```

---

## Part 5: Create Email Templates in Email Service

If using an email service (SendGrid, Postmark, AWS SES templates):

**Import templates from:**
- `email-templates/01-inquiry-acknowledgment.md`
- `email-templates/02-consultation-invitation.md`
- `email-templates/03-welcome-household.md`
- `email-templates/05-feedback-request.md`

Configure template IDs in bot code.

---

## Part 6: Set Up Forbes Command Dashboard

### Add YPEC Section

In Forbes Command dashboard (if custom):
- Add "YPEC" tab/section
- Display:
  - Active households count
  - Active chefs count
  - Pending inquiries
  - Recent feedback
  - Engagement metrics

### Create Views

**Households View:**
- Table of all households
- Filter by status
- Quick actions: view details, update status, assign chef

**Chefs View:**
- Table of all chefs
- Filter by availability
- Quick actions: view profile, update availability, see assigned households

**Engagements View:**
- Active engagements
- Upcoming events
- Performance metrics

---

## Part 7: Testing

### Test Full Workflow

**Test 1: New Inquiry**
1. Send email to private@yourprivateestatechef.com with sample inquiry
2. Verify record created in Supabase `ypec_households`
3. Verify acknowledgment email received
4. Check Forbes Command logs for errors

**Test 2: Chef Application**
1. Send email to chefs@yourprivateestatechef.com
2. Verify record created in `ypec_chefs`
3. Verify acknowledgment email received

**Test 3: Manual Workflow**
1. Create sample household (status: consultation_complete)
2. Create sample chef (status: active, availability: available)
3. Trigger YPEC-Operations chef matching
4. Verify engagement created
5. Verify welcome email sent

**Test 4: Feedback Loop**
1. Create sample event (status: completed)
2. Wait for automated feedback request (or trigger manually)
3. Submit feedback via reply email
4. Verify feedback logged in `ypec_events`

---

## Part 8: Go Live

### Pre-Launch

- [ ] All tests passing
- [ ] Email templates reviewed and approved
- [ ] Forbes Command dashboard accessible
- [ ] Team trained on workflow
- [ ] Sample data cleared from database

### Launch

1. Update website to production URL
2. Enable email forwarding
3. Activate bots
4. Monitor for first real inquiry

### Post-Launch Monitoring

**Week 1:**
- Check daily for inquiries
- Verify all automated emails sending
- Test response times

**Month 1:**
- Review metrics dashboard
- Gather team feedback on workflow
- Identify bottlenecks
- Refine bot logic as needed

---

## Maintenance

### Regular Tasks

**Daily:**
- Check for new inquiries
- Monitor bot logs for errors

**Weekly:**
- Review pending consultations
- Check chef availability
- Update engagement statuses

**Monthly:**
- Generate metrics report
- Review bot performance
- Update email templates if needed

### Backup Database

Set up automated backups in Supabase, or:
```bash
pg_dump YOUR_DATABASE_URL > ypec_backup_$(date +%Y%m%d).sql
```

---

## Troubleshooting

### Issue: Emails not reaching Forbes Command

**Check:**
1. MX records configured correctly
2. Email forwarding rules active
3. Forbes Command endpoint accessible
4. Check Forbes Command logs for incoming requests

### Issue: Bot not creating database records

**Check:**
1. Supabase credentials correct in `.env`
2. Database tables exist
3. Bot has write permissions
4. Check Supabase logs for errors

### Issue: Automated emails not sending

**Check:**
1. SMTP credentials correct
2. Email templates configured
3. Rate limits not exceeded
4. Check email service logs

---

## Support

For issues specific to:
- **Landing page:** Check Vercel/Railway logs
- **Database:** Check Supabase logs and SQL Editor
- **Bots:** Check Forbes Command logs (`railway logs`)
- **Email:** Check AWS SES or email service dashboard

---

## Next Steps After Deployment

1. **Recruit first chefs** - Use YPEC-ChefRelations workflow
2. **Launch marketing** - Drive inquiries to website
3. **Monitor metrics** - Track inquiry → active household conversion
4. **Iterate** - Refine bot responses, email templates based on real data
5. **Scale** - As demand grows, recruit more chefs in new regions
6. **Phase 2: White Coat Culinary** - Launch chef training school

---

**Deployment Complete! 🎉**

Your Private Estate Chef is live and ready to serve discerning families.
