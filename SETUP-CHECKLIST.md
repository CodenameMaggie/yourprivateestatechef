# YPEC Setup Checklist

Use this checklist to deploy Your Private Estate Chef (YPEC).

---

## ✅ Pre-Deployment (Ready)

- [x] Landing page designed and coded
- [x] Database schema created
- [x] Bot specifications written
- [x] Email templates created
- [x] Workflow documented
- [x] Deployment guide written

---

## 🚀 Deployment Tasks (To Do)

### 1. Landing Page

- [ ] Choose hosting platform (Vercel recommended)
- [ ] Deploy `public/index.html`
- [ ] Configure domain `yourprivateestatechef.com`
- [ ] Test: Visit https://www.yourprivateestatechef.com
- [ ] Verify: "Request an Introduction" button works

**Command:**
```bash
cd ~/yourprivateestatechef
vercel --prod
vercel domains add yourprivateestatechef.com
```

---

### 2. Database (Supabase)

- [ ] Access Supabase dashboard
- [ ] Open SQL Editor
- [ ] Run `database/001_initial_schema.sql`
- [ ] Verify 5 tables created: households, chefs, engagements, events, communications
- [ ] Copy Supabase credentials (URL, anon key, service key)
- [ ] Save credentials securely

**Test Query:**
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'ypec_%';
```

---

### 3. Email Infrastructure

- [ ] Verify domain ownership in AWS SES (or email provider)
- [ ] Set up MX, SPF, DKIM, DMARC records
- [ ] Create email addresses:
  - [ ] private@yourprivateestatechef.com
  - [ ] chefs@yourprivateestatechef.com
  - [ ] client@yourprivateestatechef.com
- [ ] Configure SMTP credentials for sending
- [ ] Test: Send test email from private@yourprivateestatechef.com

---

### 4. Forbes Command Integration

- [ ] Access Forbes Command codebase
- [ ] Create bot files in `api/` directory:
  - [ ] `api/ypec-concierge.js`
  - [ ] `api/ypec-operations.js`
  - [ ] `api/ypec-chefrelations.js`
  - [ ] `api/ypec-client.js`
- [ ] Add Supabase dependency: `npm install @supabase/supabase-js`
- [ ] Update `.env` with YPEC credentials
- [ ] Deploy Forbes Command
- [ ] Verify endpoints accessible

**Environment Variables:**
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=your_service_key
YPEC_INQUIRY_EMAIL=private@yourprivateestatechef.com
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_FROM=private@yourprivateestatechef.com
```

---

### 5. Email Forwarding

- [ ] Configure email forwarding rules:
  - [ ] private@ → `/api/ypec-concierge`
  - [ ] chefs@ → `/api/ypec-chefrelations`
  - [ ] client@ → `/api/ypec-client`
- [ ] Test: Send email to private@yourprivateestatechef.com
- [ ] Verify: Record created in Supabase `ypec_households`
- [ ] Verify: Acknowledgment email received

---

### 6. End-to-End Testing

#### Test 1: New Inquiry Flow
- [ ] Send inquiry email to private@yourprivateestatechef.com
- [ ] Verify: Record created in database (status: 'inquiry')
- [ ] Verify: Acknowledgment email received within 4 hours
- [ ] Manually update status to 'consultation_scheduled'
- [ ] Verify: Consultation invitation email sent
- [ ] Check Forbes Command logs for errors

#### Test 2: Chef Application Flow
- [ ] Send application email to chefs@yourprivateestatechef.com
- [ ] Verify: Record created in `ypec_chefs` (status: 'applicant')
- [ ] Verify: Acknowledgment email received

#### Test 3: Chef Matching Flow
- [ ] Create test household (status: 'consultation_complete')
- [ ] Create test chef (status: 'active', availability: 'available')
- [ ] Trigger YPEC-Operations matching algorithm
- [ ] Verify: Chef assigned to household
- [ ] Verify: Engagement record created
- [ ] Verify: Welcome email sent

#### Test 4: Feedback Flow
- [ ] Create test event (status: 'completed')
- [ ] Wait 24 hours (or trigger manually)
- [ ] Verify: Feedback request email sent
- [ ] Reply with feedback
- [ ] Verify: Feedback logged in database

---

### 7. Forbes Command Dashboard (Optional)

- [ ] Add YPEC section to dashboard
- [ ] Create views:
  - [ ] Households table
  - [ ] Chefs table
  - [ ] Active engagements
  - [ ] Pending inquiries
  - [ ] Recent feedback
- [ ] Test: Access dashboard and verify data displays

---

### 8. Import Email Templates to Email Service

If using template service (SendGrid, Postmark, etc.):

- [ ] Import inquiry acknowledgment template
- [ ] Import consultation invitation template
- [ ] Import welcome household template
- [ ] Import feedback request template
- [ ] Configure template IDs in bot code
- [ ] Test: Send test email via template

---

## 🎯 Go-Live Checklist

Before accepting first real inquiry:

- [ ] All automated tests passing
- [ ] Email templates reviewed and approved by team
- [ ] Forbes Command dashboard accessible to team
- [ ] Team trained on YPEC workflow
- [ ] Sample/test data cleared from database
- [ ] Monitoring and alerting configured
- [ ] Backup strategy in place
- [ ] Domain SSL certificate valid
- [ ] All email addresses working
- [ ] Bot endpoints responding correctly

---

## 📊 Post-Launch (First 30 Days)

### Week 1
- [ ] Monitor daily for new inquiries
- [ ] Check bot logs for errors
- [ ] Verify automated emails sending
- [ ] Test response times
- [ ] Make adjustments as needed

### Week 2-4
- [ ] Review first real household workflow
- [ ] Collect team feedback
- [ ] Refine bot responses
- [ ] Update email templates if needed
- [ ] Monitor key metrics

### Month 1 Metrics Review
- [ ] Inquiries received: ___
- [ ] Inquiries qualified: ___
- [ ] Consultations scheduled: ___
- [ ] Consultations completed: ___
- [ ] Households activated: ___
- [ ] Chefs recruited: ___
- [ ] Average satisfaction rating: ___

---

## 🔧 Maintenance Schedule

**Daily:**
- Check for new inquiries
- Monitor bot logs

**Weekly:**
- Review pending consultations
- Update engagement statuses
- Check chef availability

**Monthly:**
- Generate metrics report
- Review bot performance
- Update email templates
- Database backup

**Quarterly:**
- Review overall system performance
- Plan improvements
- Evaluate bot effectiveness
- Consider new features

---

## 📞 Support Resources

**Documentation:**
- Full deployment guide: `docs/deployment-guide.md`
- Workflow documentation: `docs/inquiry-workflow.md`
- Database setup: `database/README.md`
- Bot specifications: `bots/`

**Troubleshooting:**
- Check Forbes Command logs: `railway logs`
- Check Supabase logs: Dashboard → Logs
- Check email service dashboard for delivery issues
- Review bot specification files for expected behavior

---

## 🎉 Success Criteria

You'll know YPEC is fully operational when:

✅ Inquiry email → Bot response → Database record (automated)
✅ Consultation scheduled → Chef matched → Engagement created
✅ First household onboarded → Chef visit successful → Feedback collected
✅ Dashboard shows accurate real-time data
✅ Team comfortable using system
✅ No manual intervention needed for standard workflow

---

**Ready to Deploy?**

Start with Step 1 (Landing Page) and work through the checklist sequentially.

See `docs/deployment-guide.md` for detailed instructions on each step.

---

*Your Private Estate Chef | Company #7 | MFS Ecosystem*
