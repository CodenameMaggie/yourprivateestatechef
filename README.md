# Your Private Estate Chef (YPEC)

**Company #7 in the Maggie Forbes Strategies Ecosystem**
**Domain:** yourprivateestatechef.com
**Positioning:** Exclusive, by-introduction-only private chef network for discerning families

---

## Overview

Your Private Estate Chef (YPEC) connects exceptional private chefs with discerning families who value culinary excellence in the intimacy of their own homes. We serve a limited number of households each season, and every engagement begins with a private consultation.

**Positioning:**
- "By introduction only"
- "For discerning families"
- "This is not a service. It is an invitation."

---

## Brand Philosophy

### I. Excellence
Culinary craft at the highest level. Every plate intentional. Every meal memorable.

### II. Intimacy
Your home. Your preferences. Your rhythm. We adapt to your life, never the reverse.

### III. Discretion
Your home remains yours. We arrive, we create, we depart. Invisible excellence.

---

## Project Structure

```
yourprivateestatechef/
├── public/
│   └── index.html                    # Landing page (ready to deploy)
├── database/
│   ├── 001_initial_schema.sql        # Supabase migration
│   └── README.md                     # Database setup instructions
├── bots/
│   ├── ypec-concierge.md             # Inquiry handling bot
│   ├── ypec-operations.md            # Chef matching & scheduling bot
│   ├── ypec-chefrelations.md         # Chef recruitment & management bot
│   └── ypec-client.md                # Client relationship management bot
├── email-templates/
│   ├── 01-inquiry-acknowledgment.md  # First response to inquiry
│   ├── 02-consultation-invitation.md # Scheduling consultation
│   ├── 03-welcome-household.md       # Onboarding new household
│   └── 05-feedback-request.md        # Post-event feedback
├── docs/
│   ├── inquiry-workflow.md           # Complete workflow documentation
│   └── deployment-guide.md           # Step-by-step deployment
└── README.md                         # This file
```

---

## Quick Start

### 1. Deploy Landing Page

```bash
cd ~/yourprivateestatechef/public
vercel --prod
```

Configure domain: `yourprivateestatechef.com`

### 2. Set Up Database

1. Open Supabase dashboard
2. Go to SQL Editor
3. Copy contents of `database/001_initial_schema.sql`
4. Run migration
5. Verify tables created: `ypec_households`, `ypec_chefs`, `ypec_engagements`, `ypec_events`, `ypec_communications`

### 3. Deploy Bots to Forbes Command

1. Copy bot specs from `bots/` to Forbes Command codebase
2. Implement bot endpoints: `/api/ypec-concierge`, `/api/ypec-operations`, etc.
3. Configure environment variables (Supabase credentials, SMTP)
4. Deploy Forbes Command

### 4. Configure Email

1. Set up MX records for `yourprivateestatechef.com`
2. Create email addresses:
   - private@yourprivateestatechef.com
   - chefs@yourprivateestatechef.com
   - client@yourprivateestatechef.com
3. Forward emails to Forbes Command bot endpoints

For detailed instructions, see [`docs/deployment-guide.md`](docs/deployment-guide.md)

---

## Services Offered

1. **Private weekly meal preparation** - Chef prepares week's meals in client's kitchen
2. **Intimate dinner gatherings** - Coursed menus for private dinner parties
3. **Estate and second-home residency** - Full-season chef for vacation properties
4. **Seasonal menu curation** - Custom menus based on seasonality and preferences
5. **Special occasion dining** - Celebrations, holidays, milestones
6. **Multi-generational family events** - Large family gatherings

---

## How It Works

### For Households

```
Inquiry → Consultation → Chef Matching → First Visit → Ongoing Service
```

1. **Inquiry:** Family reaches out via website
2. **Consultation:** 30-minute call to understand needs
3. **Chef Matching:** YPEC matches household with ideal chef
4. **First Visit:** Chef arrives, prepares meals, departs
5. **Ongoing:** Weekly/regular service continues

See [`docs/inquiry-workflow.md`](docs/inquiry-workflow.md) for complete workflow.

### For Chefs

```
Application → Interview → Background Check → Onboarding → Active
```

1. **Application:** Chef applies via chefs@yourprivateestatechef.com
2. **Interview:** Skills assessment and philosophy alignment
3. **Background Check:** Required for all chefs
4. **Onboarding:** Training in YPEC method
5. **Active:** Matched with 2-4 households

---

## Technology Stack

- **Landing Page:** Static HTML (Vercel/Railway)
- **Database:** Supabase (PostgreSQL)
- **Bots:** Forbes Command (Node.js)
- **Email:** AWS SES / Port 25
- **Domain:** yourprivateestatechef.com

---

## Database Schema

### Tables

- **ypec_households** - Client families
- **ypec_chefs** - Private estate chefs
- **ypec_engagements** - Service arrangements
- **ypec_events** - Individual meals/gatherings
- **ypec_communications** - Interaction logs

See [`database/README.md`](database/README.md) for schema details.

---

## Bot Architecture

### YPEC-Concierge
- Handles initial inquiries
- Qualifies households
- Schedules consultations
- **Endpoint:** `/api/ypec-concierge`

### YPEC-Operations
- Matches chefs to households
- Creates engagements
- Manages scheduling and logistics
- **Endpoint:** `/api/ypec-operations`

### YPEC-ChefRelations
- Recruits and onboards chefs
- Manages chef performance
- Handles chef issues
- **Endpoint:** `/api/ypec-chefrelations`

### YPEC-Client
- Ongoing client communication
- Collects feedback
- Manages renewals and referrals
- **Endpoint:** `/api/ypec-client`

See individual bot specs in [`bots/`](bots/) directory.

---

## Email Templates

All email templates follow YPEC brand voice: warm, discreet, sophisticated.

- **Inquiry Acknowledgment** - "Thank you for reaching out..."
- **Consultation Invitation** - "We'd be honored to learn more..."
- **Welcome to YPEC** - "We're honored to welcome your family..."
- **Feedback Request** - "How was this week?"

See [`email-templates/`](email-templates/) for HTML/text versions.

---

## Brand Colors

```css
/* Intimate Palette */
--plum-deep: #2d1f2b;    /* Dark backgrounds */
--plum: #3d2a3a;          /* Mid backgrounds */
--blush: #c9a8a0;         /* Buttons, accents */
--candlelight: #d4a855;   /* Monogram, dividers */
--cream: #fffdf9;         /* Light backgrounds */
```

**Typography:**
- Display: Italiana (serif)
- Body: Cormorant (serif)
- UI: Raleway (sans-serif)

---

## Ecosystem Integration

YPEC is part of the **Homesteading Pillar** in the MFS ecosystem:

- **Steading Home** (steadinghome.com) - Heritage recipes, kitchen, garden
- **Timber Homestead** (timberhomestead.com) - Off-grid building, carpentry
- **Your Private Estate Chef** (yourprivateestatechef.com) - Private chef service

Featured on **Sovereign Design It** podcast (sovereigndesign.it.com)

---

## Phase 2: White Coat Culinary

Future expansion: **White Coat Culinary** - A culinary school to train chefs in the YPEC method.

Pipeline: White Coat → Shadow Program → Active YPEC Chef

---

## Key Metrics

Track these in Forbes Command dashboard:

1. **Inquiries per month**
2. **Inquiry → Consultation rate** (goal: 60%+)
3. **Consultation → Active rate** (goal: 80%+)
4. **Average household satisfaction** (goal: 4.5+)
5. **Retention rate** (goal: 90%+)
6. **Referral rate** (goal: 30%+)

---

## Deployment Status

- [x] Landing page created
- [x] Database schema designed
- [x] Bot specifications written
- [x] Email templates created
- [x] Workflow documented
- [ ] Landing page deployed
- [ ] Database migrated to Supabase
- [ ] Bots deployed to Forbes Command
- [ ] Email infrastructure configured
- [ ] System tested end-to-end
- [ ] First household onboarded

---

## Next Steps

1. **Deploy landing page** to Vercel/Railway
2. **Migrate database** to Supabase production
3. **Implement bots** in Forbes Command
4. **Configure email** forwarding and SMTP
5. **Test workflow** with sample data
6. **Recruit first chefs** via ChefRelations bot
7. **Launch marketing** to drive inquiries
8. **Onboard first households**
9. **Iterate and refine** based on real usage
10. **Scale** to new regions

---

## Documentation

- **[Deployment Guide](docs/deployment-guide.md)** - Step-by-step deployment instructions
- **[Inquiry Workflow](docs/inquiry-workflow.md)** - Complete workflow from inquiry to active household
- **[Database README](database/README.md)** - Database schema and setup
- **[Bot Specifications](bots/)** - Detailed specs for all 4 bots
- **[Email Templates](email-templates/)** - HTML and text versions of all emails

---

## Contact

For questions about YPEC setup:
- Review documentation in `docs/`
- Check bot specifications in `bots/`
- See deployment guide for troubleshooting

---

## License & Usage

**YPEC is Company #7 in the Maggie Forbes Strategies ecosystem.**

This is proprietary software for internal MFS use. All brand assets, code, and documentation are confidential.

---

**Your Private Estate Chef**
*By introduction only.*
*For discerning families.*
*This is not a service. It is an invitation.*
