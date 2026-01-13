# Forbes Command Structure - YPEC

## Executive Team

### DAN - Chief Marketing Officer (CMO)
**Role:** Marketing, lead generation, bot oversight
- **ALL BOTS REPORT TO DAN**
- Oversees all automated systems
- Lead generation (FREE until revenue, then budget-based)
- Marketing strategy and growth
- Bot performance monitoring

### HENRY - Chief Executive Officer (CEO)
**Role:** Customer relationships and operations management
- **ALL customer relationships**
- Operations management
- Strategic direction
- Client satisfaction and retention
- Supported by Operations and ChefRelations bots

### ANNIE - Customer Service Representative
**Role:** Customer support and service delivery
- Supports ALL customers
- Handles private events and bookings
- Customer service inquiries
- Event coordination support
- Booking confirmations and scheduling
- Supported by Concierge and Operations bots

### DAVE - Chief Financial Officer (CFO) / Accountant
**Role:** Financial tracking and reporting
- Accounting and bookkeeping
- Invoice management
- Revenue tracking
- Financial reports
- Supported by Revenue bot

### ALEX - Chief Technology Officer (CTO) / Engineer
**Role:** Technical infrastructure
- System architecture
- Bot development and maintenance
- API integrations
- Database management
- Technical troubleshooting

---

## Bot Hierarchy

**ALL 5 YPEC bots report to DAN (CMO)**

### 1. YPEC-Concierge Bot
- **Reports to:** DAN (CMO)
- **Supports:** ANNIE (Customer Service) & HENRY (Customer Relationships)
- **Purpose:** Inquiry processing, consultation scheduling, client communication
- **Actions:** Process inquiries, schedule consultations, send reminders, onboard clients
- **Cron Jobs:**
  - 7:00 AM daily - Process new inquiries
  - 9:00 AM daily - Send consultation reminders

### 2. YPEC-ChefRelations Bot
- **Reports to:** DAN (CMO)
- **Supports:** HENRY (Operations Management)
- **Purpose:** Chef recruitment, onboarding, availability, matching
- **Actions:** Recruit chefs, onboard new chefs, sync availability, match chefs to households
- **Cron Jobs:**
  - 8:00 AM daily - Sync chef availability
  - Monday 9:00 AM - Weekly chef recruitment outreach

### 3. YPEC-Operations Bot
- **Reports to:** DAN (CMO)
- **Supports:** HENRY (Operations) & ANNIE (Events/Bookings)
- **Purpose:** Engagement management, event scheduling, logistics
- **Actions:** Schedule events, track engagements, manage logistics, daily summaries
- **Cron Jobs:**
  - 10:00 AM daily - Check upcoming events (next 7 days)
  - 6:00 PM daily - Send daily summary to HENRY

### 4. YPEC-Revenue Bot
- **Reports to:** DAN (CMO)
- **Supports:** DAVE (Accountant/CFO)
- **Purpose:** Invoicing, payment tracking, revenue reporting
- **Actions:** Generate invoices, track payments, revenue reports, overdue alerts
- **Cron Jobs:**
  - Midnight daily - Check overdue invoices
  - 1st of month 8:00 AM - Generate monthly invoices
  - Friday 4:00 PM - Weekly revenue report to DAVE

### 5. YPEC-Marketing Bot
- **Reports to:** DAN (CMO)
- **Purpose:** Lead generation (FREE mode), referral tracking, waitlist, growth
- **Actions:** Analyze lead sources, manage waitlist, track referrals, MFS lead sync
- **Cron Jobs:**
  - 11:00 PM daily - Marketing insights and lead analysis
  - Daily - Sync leads to MFS Central Database

---

## Reporting Flow

```
DAN (CMO)
├── YPEC-Marketing Bot → Lead generation insights
├── YPEC-Concierge Bot → Inquiry metrics → ANNIE (Customer Service)
├── YPEC-ChefRelations Bot → Chef capacity → HENRY (Operations)
├── YPEC-Operations Bot → Event summaries → HENRY (CEO) & ANNIE (Events)
└── YPEC-Revenue Bot → Financial reports → DAVE (CFO)

HENRY (CEO)
├── Customer relationship management
├── Operations oversight
└── Receives summaries from Operations & ChefRelations bots

ANNIE (Customer Service)
├── Customer support for all clients
├── Event and booking coordination
└── Receives support from Concierge & Operations bots

DAVE (CFO)
├── Financial tracking and accounting
└── Receives reports from Revenue bot

ALEX (CTO)
├── System maintenance
└── Bot infrastructure management
```

---

## Communication Protocol

### Daily Reports to DAN (CMO)
- **6:00 PM** - Operations bot sends daily summary
- **11:00 PM** - Marketing bot sends lead insights
- **As needed** - All bots report issues or opportunities

### Daily Reports to HENRY (CEO)
- **6:00 PM** - Daily operations summary
- **As needed** - Customer relationship updates
- **Weekly** - Chef capacity reports

### Reports to DAVE (CFO)
- **Friday 4:00 PM** - Weekly revenue report
- **1st of month** - Monthly financial summary
- **As needed** - Overdue payment alerts

### Support for ANNIE (Customer Service)
- **9:00 AM daily** - Consultation reminder list
- **Real-time** - New inquiry notifications
- **As needed** - Event coordination support

---

## Cost Structure

### Current Phase: FREE MODE
- ✅ All lead generation FREE until revenue
- ✅ All bots operational at no cost
- ✅ Website and booking system FREE
- ✅ Database and API hosting covered

### After First Revenue:
- Budget established for DAN's marketing initiatives
- Paid lead generation tools enabled
- Premium features activated
- Expanded bot capabilities

---

## Bot Objectives

### Customer Acquisition (DAN's Focus)
1. **Marketing Bot** - Generate qualified leads (FREE sources)
2. **Concierge Bot** - Convert inquiries to consultations
3. **Operations Bot** - Schedule and confirm bookings

### Customer Relationships (HENRY's Focus)
1. **ChefRelations Bot** - Match perfect chef to each household
2. **Operations Bot** - Ensure flawless event execution
3. **Concierge Bot** - Maintain ongoing communication

### Customer Service (ANNIE's Focus)
1. **Concierge Bot** - Quick response to inquiries
2. **Operations Bot** - Event coordination support
3. **All Bots** - Route urgent issues to ANNIE

### Financial Management (DAVE's Focus)
1. **Revenue Bot** - Accurate invoicing and tracking
2. **Revenue Bot** - Timely payment collection
3. **Revenue Bot** - Financial reporting and insights

---

## Integration Points

### MFS Central Database
- All bots sync leads to central Forbes database
- Source tag: `YPEC_osm`
- Cross-portfolio lead discovery
- Unified reporting across all 5+ Forbes companies

### Website Integration
- Booking form → Concierge bot → ANNIE notification
- Admin dashboard → Real-time bot metrics → DAN oversight
- Payment processing → Revenue bot → DAVE tracking

### Email/Communication
- All bots can send emails via configured service
- Templated messages for consistency
- Urgent issues escalate to ANNIE or HENRY

---

## Success Metrics (Reported to DAN)

### Lead Generation (Marketing Bot)
- New inquiries per day
- Lead source performance
- Conversion rate (inquiry → consultation)
- Cross-portfolio opportunities

### Customer Satisfaction (Concierge + Operations)
- Response time to inquiries
- Consultation booking rate
- Event completion success rate
- Client feedback scores

### Operational Efficiency (ChefRelations + Operations)
- Chef utilization rate
- Event scheduling efficiency
- Waitlist management
- Chef-household match quality

### Financial Performance (Revenue Bot)
- Monthly recurring revenue (MRR)
- Average order value (AOV)
- Payment collection rate
- Outstanding invoice aging

---

## Emergency Protocols

### Customer Issues → ANNIE
- Booking conflicts
- Event day problems
- Service complaints
- Chef availability issues

### Operations Issues → HENRY
- Chef capacity critical
- Major event coordination
- Client relationship escalations
- Strategic decisions

### Financial Issues → DAVE
- Payment disputes
- Invoice errors
- Overdue accounts
- Budget concerns

### Technical Issues → ALEX
- Bot failures
- API errors
- Database problems
- System downtime

---

## Free Marketing Strategy (Until Revenue)

### Current FREE Lead Sources (DAN's Focus)
1. **Pinterest** - Luxury lifestyle content
2. **MFS Cross-Portfolio** - Steading Home & Timber Homestead leads
3. **Referrals** - Word-of-mouth from initial clients
4. **Organic Social** - Instagram, Facebook groups
5. **Content Marketing** - Blog posts, recipes, chef spotlights
6. **Lead Scraper Bot** - Automated web research (FREE)

### After Revenue - Paid Marketing
- Google Ads (luxury searches)
- Facebook/Instagram ads (targeting high-net-worth)
- LinkedIn ads (executive networking)
- Premium lead databases
- Influencer partnerships
- PR and media outreach

---

This structure ensures DAN has oversight of all automation while HENRY, ANNIE, DAVE, and ALEX focus on their specialized areas with bot support.
