# YPEC Inquiry Workflow

**Document:** Complete inquiry-to-active-household workflow
**Company:** Your Private Estate Chef (Company #7)
**Last Updated:** January 2026

---

## Overview

This document describes the complete journey from initial inquiry to active YPEC household, including bot automation, human touchpoints, and database state changes.

---

## Workflow Diagram

```
[Website Inquiry]
       ↓
[YPEC-Concierge: Acknowledge & Qualify]
       ↓
    ┌──────┴──────┐
    ↓             ↓
[Qualified]   [Not Qualified]
    ↓             ↓
[Schedule     [Polite
Consultation]  Decline]
    ↓
[Human: Conduct Consultation]
    ↓
[YPEC-Operations: Chef Matching]
    ↓
[Create Engagement]
    ↓
[YPEC-Client: Welcome & Onboard]
    ↓
[First Chef Visit]
    ↓
[YPEC-Client: Collect Feedback]
    ↓
[Ongoing Relationship Management]
```

---

## Stage 1: Initial Inquiry

### Trigger
Visitor clicks "Request an Introduction" on website
→ Opens mailto:private@yourprivateestatechef.com

### What Happens
1. **Email arrives** at private@yourprivateestatechef.com
2. **Forbes Command** receives email → routes to `/api/ypec-concierge`
3. **YPEC-Concierge bot** processes:
   - Extracts: name, email, phone, location, service need
   - Creates record in `ypec_households` (status: `'inquiry'`)
   - Logs in `ypec_communications`

### Database State
```sql
INSERT INTO ypec_households (
    primary_contact_name,
    email,
    phone,
    primary_address,
    status,
    inquiry_date,
    notes
) VALUES (
    'Jane Smith',
    'jane@example.com',
    '555-1234',
    'Greenwich, CT',
    'inquiry',
    NOW(),
    'Initial inquiry from website. Interested in weekly meal prep for family of 4.'
);
```

### Automated Action
**Within 4 hours:** YPEC-Concierge sends acknowledgment email
- Template: `01-inquiry-acknowledgment.md`
- Promises response within 48 hours

---

## Stage 2: Qualification

### Human Review (Within 48 hours)
YPEC team (or Concierge bot with rules) reviews:

**Qualification Criteria:**
- ✅ **Location:** Within service area (e.g., Northeast corridor, major metros)
- ✅ **Service type:** Aligns with YPEC offerings (weekly, events, residency)
- ✅ **Tone/fit:** Inquiry reflects understanding of YPEC positioning
- ✅ **Capacity:** YPEC has chef availability in that region

**Disqualification Reasons:**
- ❌ Location outside service area
- ❌ Service type not offered (e.g., corporate catering, one-off meal delivery)
- ❌ Tone suggests price-shopping or misalignment with brand
- ❌ No chef capacity in region

### Decision: Qualified

Update database:
```sql
UPDATE ypec_households
SET status = 'consultation_scheduled',
    notes = CONCAT(notes, '\n\nQualified: Location in service area, weekly meal prep aligns.')
WHERE household_id = '[ID]';
```

Send email:
- Template: `02-consultation-invitation.md`
- Offer 2-3 consultation time slots

### Decision: Not Qualified

Update database:
```sql
UPDATE ypec_households
SET status = 'declined',
    admin_notes = 'Location outside service area (rural Montana). Politely declined.'
WHERE household_id = '[ID]';
```

Send email:
- Template: `02b-polite-decline.md` (create this)
- Warm but clear that YPEC may not be the right fit

---

## Stage 3: Consultation

### Scheduling
Household replies with preferred time → YPEC schedules consultation call

### Pre-Consultation
Update database:
```sql
UPDATE ypec_households
SET consultation_date = '2026-01-20 14:00:00',
    status = 'consultation_scheduled'
WHERE household_id = '[ID]';
```

### Consultation Call (Human-Conducted, 30 minutes)

**Topics Covered:**
1. **Family & Household**
   - Family size, ages
   - Dietary requirements, allergies, preferences
   - Typical eating schedule, routines

2. **Service Needs**
   - Weekly meal prep? Dinner events? Residency?
   - Frequency (weekly, bi-weekly, monthly)
   - Preferred day/time for chef visits

3. **Cuisine Preferences**
   - Favorite cuisines
   - Ingredients to avoid/prioritize
   - Organic, local, seasonal preferences

4. **Logistics**
   - Kitchen setup
   - Grocery sourcing (chef shops or household provides?)
   - Storage, equipment

5. **Expectations & Philosophy**
   - Explain YPEC approach (Excellence, Intimacy, Discretion)
   - Set expectations for communication, scheduling
   - Answer questions

### Post-Consultation
Update database with detailed notes:
```sql
UPDATE ypec_households
SET consultation_completed = TRUE,
    status = 'consultation_complete',
    service_type = 'weekly',
    family_size = 4,
    dietary_requirements = 'Gluten-free for 1 child; prefer organic',
    cuisine_preferences = 'French, Mediterranean, seasonal',
    notes = 'Consultation 1/20: Family of 4 (2 adults, 2 children ages 8 and 10). Prefer chef visits on Mondays. Mom (Jane) is primary contact. Very aligned with YPEC philosophy.',
    updated_at = NOW()
WHERE household_id = '[ID]';
```

---

## Stage 4: Chef Matching

### Trigger
Household status = `'consultation_complete'`

### YPEC-Operations Bot Action

**Step 1: Query Available Chefs**
```sql
SELECT * FROM ypec_chefs
WHERE status = 'active'
  AND availability IN ('available', 'limited')
  AND current_household_count < max_households
  AND primary_location LIKE '%CT%' -- or within 50 miles
  AND 'French' = ANY(cuisine_expertise)
ORDER BY current_household_count ASC;
```

**Step 2: Rank Matches**
Score each chef based on:
- Location proximity (closer = higher score)
- Cuisine expertise match (French + Mediterranean = perfect)
- Availability (more capacity = higher score)
- Years of experience
- Past household ratings

**Step 3: Present Top 3 to YPEC Team**
Generate report:
```
TOP CHEF MATCHES FOR HOUSEHOLD: Smith Family (Greenwich, CT)

1. Chef Marie Laurent
   - Location: Stamford, CT (15 miles)
   - Expertise: French, Mediterranean
   - Experience: 8 years
   - Current households: 2/3
   - Avg rating: 4.9
   - Match score: 95/100

2. Chef Antonio Rossi
   - Location: New Haven, CT (35 miles)
   - Expertise: Italian, Mediterranean
   - Experience: 12 years
   - Current households: 1/3
   - Avg rating: 4.8
   - Match score: 88/100

3. Chef Sophie Chen
   - Location: White Plains, NY (40 miles)
   - Expertise: French, Asian Fusion
   - Experience: 6 years
   - Current households: 2/4
   - Avg rating: 4.7
   - Match score: 82/100

RECOMMENDATION: Chef Marie Laurent (best match, closest proximity, French specialty)
```

**Step 4: Human Approval**
YPEC team reviews and approves Chef Marie

**Step 5: Update Database**
```sql
-- Assign chef to household
UPDATE ypec_households
SET chef_assigned = '[marie_chef_id]',
    season_started = 'Winter 2026',
    status = 'active'
WHERE household_id = '[smith_household_id]';

-- Update chef household count
UPDATE ypec_chefs
SET current_household_count = 3,
    availability = 'full' -- If now at max
WHERE chef_id = '[marie_chef_id]';
```

---

## Stage 5: Create Engagement

### YPEC-Operations Creates Engagement Record

```sql
INSERT INTO ypec_engagements (
    household_id,
    chef_id,
    service_type,
    start_date,
    frequency,
    weekly_day,
    weekly_time,
    status,
    rate,
    rate_period,
    notes
) VALUES (
    '[smith_household_id]',
    '[marie_chef_id]',
    'weekly',
    '2026-01-27', -- First Monday
    'weekly',
    'Monday',
    '09:00:00',
    'active',
    450.00, -- Example rate
    'per week',
    'Weekly meal prep for family of 4. Gluten-free accommodation for one child.'
);
```

### Create First Event

```sql
INSERT INTO ypec_events (
    household_id,
    chef_id,
    engagement_id,
    event_name,
    event_type,
    event_date,
    event_time,
    status,
    notes
) VALUES (
    '[smith_household_id]',
    '[marie_chef_id]',
    '[engagement_id]',
    'First Weekly Meal Prep',
    'weekly meal prep',
    '2026-01-27',
    '09:00:00',
    'scheduled',
    'First session. Chef will confirm menu preferences beforehand.'
);
```

---

## Stage 6: Welcome & Onboarding

### YPEC-Client Bot Action

**3-5 days before first chef visit:**

Send welcome email:
- Template: `03-welcome-household.md`
- Introduces chef
- Sets expectations
- Provides contact info

Log communication:
```sql
INSERT INTO ypec_communications (
    household_id,
    communication_type,
    direction,
    subject,
    message,
    sent_by,
    sent_at
) VALUES (
    '[smith_household_id]',
    'email',
    'outbound',
    'Welcome to Your Private Estate Chef',
    '[Full email content]',
    'YPEC-Client Bot',
    NOW()
);
```

### Chef Reaches Out

Chef Marie contacts Smith family directly:
- Confirms menu preferences
- Discusses grocery sourcing
- Answers any questions
- Confirms Monday 9am arrival

---

## Stage 7: First Chef Visit

### Day of First Visit

**Chef Marie arrives:**
- 9:00 AM Monday
- Prepares meals for the week
- Leaves kitchen pristine
- Meals labeled and stored
- Departs

**Chef logs completion:**
```sql
UPDATE ypec_events
SET status = 'completed',
    chef_notes = 'First session went well. Family very welcoming. Prepared 5 dinners + 2 lunch options. All gluten-free items clearly labeled.',
    updated_at = NOW()
WHERE event_id = '[first_event_id]';

-- Increment engagement metrics
UPDATE ypec_engagements
SET meals_delivered = meals_delivered + 1
WHERE engagement_id = '[engagement_id]';
```

---

## Stage 8: Feedback Collection

### 24 Hours After First Visit

**YPEC-Client bot sends feedback request:**
- Template: `05-feedback-request.md`
- Link to survey or reply to email

**Household responds:**
> "Chef Marie was wonderful! The food is delicious, and she left our kitchen spotless. The kids loved the gluten-free pasta. 5 stars!"

**Bot logs feedback:**
```sql
UPDATE ypec_events
SET feedback = 'Chef Marie was wonderful! The food is delicious, and she left our kitchen spotless. The kids loved the gluten-free pasta. 5 stars!',
    household_rating = 5.0
WHERE event_id = '[first_event_id]';

-- Update engagement satisfaction
UPDATE ypec_engagements
SET household_satisfaction_rating = 5.0
WHERE engagement_id = '[engagement_id]';
```

---

## Stage 9: Ongoing Relationship

### Weekly Cycle

**Every Monday:**
1. Chef Marie arrives
2. Prepares weekly meals
3. Event status updated to 'completed'
4. Feedback requested (automated every 4th week or after special requests)

### Monthly Check-In

**YPEC-Client bot:**
- "How has the first month been?"
- Collects overall satisfaction
- Addresses any issues
- Logs in communications table

### Quarterly Review

**YPEC-Operations:**
- Reviews engagement metrics
- Chef performance
- Household satisfaction
- Prepares for renewal discussion

### Renewal (Before Season Ends)

**2 weeks before engagement end_date:**

YPEC-Client sends renewal invitation:
- "We'd love to continue serving your family"
- Discuss any changes
- Update engagement dates if renewed

---

## Summary: Database Status Progression

```
inquiry
  ↓
consultation_scheduled
  ↓
consultation_complete
  ↓
active (chef assigned, engagement created)
  ↓
[Ongoing] OR paused OR inactive (if not renewed)
```

---

## Key Metrics to Track

1. **Inquiry → Consultation Rate** (goal: 60%+)
2. **Consultation → Active Rate** (goal: 80%+)
3. **Time to First Chef Visit** (goal: <14 days from inquiry)
4. **First Month Satisfaction** (goal: 4.5+ avg rating)
5. **Retention Rate** (goal: 90%+ renew for next season)
6. **Referral Rate** (goal: 30%+ refer another household)

---

## Human Touchpoints

Even with bot automation, key human moments:
1. **Qualification review** (can be human or rule-based bot)
2. **Consultation call** (always human)
3. **Chef matching approval** (human reviews bot recommendations)
4. **Issue resolution** (escalated to human)
5. **Renewal conversations** (high-touch, human)

---

## Next Steps

- Set up email forwarding: private@yourprivateestatechef.com → Forbes Command
- Deploy YPEC bots to production
- Test full workflow with sample household
- Train team on Forbes Command dashboard
- Launch YPEC to first households
