# YPEC Chef Compliance & Background Check Policy
## Your Private Estate Chef - Safety First

**Last Updated:** 2026-01-15
**Policy Owner:** Henry (COO)
**Enforcement:** MANDATORY for all chef placements

---

## 🔒 Policy Overview

**SAFETY FIRST: All chefs MUST complete criminal background checks before placement.**

Your Private Estate Chef places culinary professionals in private residences with high-net-worth families. These placements require the highest level of trust and safety. Therefore, **criminal record checks are MANDATORY** for all chef candidates.

---

## 🎯 Strategic Markets & Jurisdictions

### Primary Markets (Tier 1)
1. **Kelowna, BC** - Wine country estates, seasonal demand
2. **Vancouver, BC** - Urban luxury, year-round
3. **Whistler, BC** - Premium ski resort estates
4. **New York, NY** - Ultra-urban luxury, Manhattan/Hamptons
5. **Los Angeles, CA** - Entertainment industry, health-focused
6. **Toronto, ON** - Financial hub, diverse clientele
7. **Miami, FL** - International resort market
8. **Aspen, CO** - Ultra-luxury ski estates
9. **Hamptons, NY** - Seasonal ultra-luxury

### Secondary Markets (Tier 2)
10. **Victoria, BC** - Retirement estates, waterfront properties

**Total Addressable Market:** ~937,000 HNW households

---

## 📋 Background Check Requirements

### Canada (BC, ON, etc.)

**Required Checks:**
1. **Criminal Record Check (CRC)**
   - Provider: Provincial Ministry of Justice
   - Cost: $25-$50 CAD
   - Processing Time: 2-6 weeks
   - Validity: 5 years

2. **Vulnerable Sector Check (VSC)**
   - Required if: Children or elderly in household
   - Includes: Additional screening for vulnerable populations
   - Cost: Included in CRC fee
   - Processing Time: 2-6 weeks

3. **RCMP Enhanced Clearance**
   - National-level screening
   - Required for all placements
   - Cost: Included in provincial CRC
   - Processing Time: 2-6 weeks

**Application Process (British Columbia Example):**
```
1. Visit: https://www2.gov.bc.ca/gov/content/safety/crime-prevention/criminal-record-check
2. Select "Criminal Record Check for Employment"
3. Select "Vulnerable Sector" if applicable
4. Complete online application
5. Submit fingerprints at authorized location
6. Pay $28 CAD processing fee
7. Wait 2-6 weeks for certificate
8. Upload certificate to YPEC portal
```

---

### United States (NY, CA, FL, CO)

**Required Checks:**
1. **FBI Background Check**
   - National criminal history
   - Cost: $18 USD
   - Processing Time: 2-8 weeks
   - Validity: 5 years

2. **State Criminal History**
   - State-specific records
   - Cost: $30-$75 USD (varies by state)
   - Processing Time: 2-4 weeks
   - Validity: 5 years

3. **Live Scan Fingerprinting**
   - Digital fingerprint capture
   - Required for FBI and state checks
   - Cost: $10-$20 USD
   - Immediate processing

4. **Sex Offender Registry Check**
   - National and state-level
   - Cost: Free
   - Processing Time: Immediate
   - Validity: Ongoing

**Application Process (Example):**
```
1. FBI: Visit https://www.fbi.gov/how-we-can-help-you/identity-history-summary-checks
2. Complete online application
3. Schedule Live Scan fingerprinting at authorized location
4. Apply for state-specific check (e.g., NY CHRI)
5. Pay processing fees ($18 FBI + $30-$75 State)
6. Wait 2-8 weeks for results
7. Upload certificates to YPEC portal
```

---

## ❌ Disqualifying Offenses

The following convictions will **disqualify** a chef from placement:

### Automatic Disqualification
- Any violent crime (assault, battery, homicide)
- Sexual offenses (any level)
- Theft or fraud convictions
- Drug trafficking or distribution
- Child abuse or neglect
- Domestic violence
- Elder abuse
- Kidnapping or abduction

### Case-by-Case Review
- Misdemeanor convictions (non-violent, >10 years ago)
- Traffic violations (DUI reviewed individually)
- Expunged or pardoned convictions

**Policy:** Safety over volume. When in doubt, disqualify.

---

## 🔄 Compliance Workflow

### Chef Onboarding Process

```
1. Application Received
   └─> Review resume and culinary credentials

2. Initial Interview
   └─> Assess skills, experience, cultural fit

3. Background Check Request
   └─> Send jurisdiction-specific instructions
   └─> Chef completes application and fingerprinting

4. Background Check Submitted (2-8 weeks)
   └─> Chef uploads certificate to YPEC portal

5. Document Verification
   └─> Henry (COO) or authorized staff verifies authenticity
   └─> Check expiry date, jurisdiction, completeness

6. Compliance Status: VERIFIED ✅
   └─> Chef is now eligible for placement

7. Placement
   └─> Match chef with appropriate household

8. Renewal Reminders
   └─> Email alerts 90 days before expiry
   └─> Email alerts 30 days before expiry
   └─> Chef becomes NON-COMPLIANT if expired
```

### Compliance Statuses

| Status | Meaning | Placement Eligible |
|--------|---------|-------------------|
| `not_started` | Chef has not begun background check | ❌ No |
| `pending_background_check` | Instructions sent, awaiting completion | ❌ No |
| `under_review` | Documents submitted, pending verification | ❌ No |
| `verified` | All checks complete and verified | ✅ YES |
| `rejected` | Background check failed | ❌ No |
| `non_compliant` | Background check expired or incomplete | ❌ No |

---

## 📊 Bot Actions & API Usage

### Chef Compliance Bot
**Endpoint:** `/api/ypec/chef-compliance`

**Actions:**
1. `status` - Get compliance overview and statistics
2. `chef_compliance` - Get compliance details for specific chef(s)
3. `request_background_check` - Send background check instructions to chef
4. `update_compliance` - Update background check status/documents
5. `verify_documents` - Verify and approve/reject background check
6. `analytics` - Compliance analytics by status, jurisdiction
7. `expiry_alerts` - Get list of expiring/expired background checks

### Example: Request Background Check

```bash
curl -X POST https://yourprivateestatechef.com/api/ypec/chef-compliance \
  -H "Content-Type: application/json" \
  -d '{
    "action": "request_background_check",
    "data": {
      "chef_id": "chef-123",
      "jurisdiction": "BC"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "chef_id": "chef-123",
  "check_request": {
    "jurisdiction": "BC",
    "location": "Kelowna, British Columbia, Canada",
    "required_checks": [
      "Criminal Record Check (BC Ministry of Justice)",
      "Vulnerable Sector Check (recommended)",
      "RCMP Enhanced Clearance"
    ],
    "processing_time": "2-6 weeks",
    "instructions": { ... }
  },
  "next_steps": [
    "1. Chef completes background check application",
    "2. Submits fingerprints/documents as required",
    "3. Uploads certificate to YPEC portal",
    "4. YPEC verifies and approves"
  ]
}
```

### Example: Verify Documents

```bash
curl -X POST https://yourprivateestatechef.com/api/ypec/chef-compliance \
  -H "Content-Type: application/json" \
  -d '{
    "action": "verify_documents",
    "data": {
      "chef_id": "chef-123",
      "verification_result": "approved",
      "verified_by": "henry@ypec.com",
      "notes": "BC Criminal Record Check verified, valid until 2031-01-15"
    }
  }'
```

### Example: Get Expiry Alerts

```bash
curl -X POST https://yourprivateestatechef.com/api/ypec/chef-compliance \
  -H "Content-Type: application/json" \
  -d '{"action": "expiry_alerts"}'
```

**Response:**
```json
{
  "success": true,
  "alerts": {
    "expired": [
      {
        "chef_id": "chef-456",
        "name": "John Smith",
        "email": "john@example.com",
        "expiry_date": "2025-12-01",
        "days_remaining": -45,
        "jurisdiction": "BC",
        "placement_eligible": false
      }
    ],
    "expiring_30_days": [ ... ],
    "expiring_90_days": [ ... ]
  },
  "action_required": 3,
  "message": "URGENT: Some chefs have expired background checks and are not eligible for placement"
}
```

---

## 🗂️ Database Schema

### Chef Compliance Fields (users table)

```sql
-- Compliance Status
compliance_status VARCHAR(50) DEFAULT 'not_started'
  -- not_started, pending_background_check, under_review, verified, rejected, non_compliant

-- Background Check Details
background_check_status VARCHAR(50) DEFAULT 'not_requested'
  -- not_requested, requested, submitted, verified
background_check_date TIMESTAMP WITH TIME ZONE
background_check_expiry_date TIMESTAMP WITH TIME ZONE
background_check_jurisdiction VARCHAR(50)
background_check_document_url TEXT
background_check_requested_date TIMESTAMP WITH TIME ZONE
background_check_instructions JSONB

-- Canadian-Specific Checks
vulnerable_sector_check BOOLEAN DEFAULT FALSE
vulnerable_sector_check_date TIMESTAMP WITH TIME ZONE
rcmp_clearance BOOLEAN DEFAULT FALSE
rcmp_clearance_date TIMESTAMP WITH TIME ZONE

-- Document Verification
documents_verified BOOLEAN DEFAULT FALSE
verified_by VARCHAR(255)
verified_at TIMESTAMP WITH TIME ZONE
verification_notes TEXT

-- Geographic Preferences
preferred_location VARCHAR(255)
current_location VARCHAR(255)
location_preferences JSONB
willing_to_relocate BOOLEAN DEFAULT FALSE
```

---

## 💰 Cost Responsibility

**Policy Options:**

### Option A: Chef Pays (Recommended)
- Chef pays background check fees upfront
- Demonstrates commitment to placement
- Industry standard practice
- Cost: $25-$100 depending on jurisdiction

### Option B: YPEC Pays
- YPEC covers background check costs
- Chef reimburses from first paycheck
- Shows commitment to chef success

### Option C: Split Cost
- YPEC pays for FBI/national check ($18-$28)
- Chef pays for state/provincial check ($25-$50)

**Current Policy:** Chef pays, reimbursed from first placement fee (optional)

---

## 📅 Renewal Schedule

Background checks are valid for **5 years** from issue date.

### Renewal Process
- **90 days before expiry:** Email reminder sent to chef
- **60 days before expiry:** Second email reminder
- **30 days before expiry:** URGENT email reminder
- **On expiry date:** Chef status changes to `non_compliant`
- **Post-expiry:** Chef cannot accept new placements until renewed

### Automated Monitoring
The Chef Compliance Bot automatically:
- Tracks expiry dates
- Sends renewal reminders
- Updates compliance status
- Generates weekly reports for Henry (COO)

---

## 📊 Success Metrics

### Compliance Rate Target: 95%+

**Monthly KPIs:**
- % of chefs with valid background checks
- Average processing time (target: <4 weeks)
- % of chefs with expiring checks (90-day window)
- Number of disqualifications
- Background check rejection rate

### Reporting
- **Weekly:** Expiry alerts sent to Henry (COO)
- **Monthly:** Compliance analytics report
- **Quarterly:** Policy review and adjustment

---

## 🚨 Emergency Protocol

### What if a chef's background check expires during active placement?

1. **Immediate Action:**
   - Notify client of expiry
   - Offer replacement chef
   - Chef completes emergency renewal (rush processing)

2. **Rush Processing:**
   - Some jurisdictions offer expedited processing ($50-$100 extra)
   - Processing time: 1-2 weeks

3. **Client Options:**
   - Accept temporary risk (with written waiver)
   - Use replacement chef during renewal period
   - Pause service until renewal complete

**Policy:** Safety first - recommend replacement chef.

---

## 📞 Support & Resources

### For Chefs
- **Background Check Help:** compliance@yourprivateestatechef.com
- **Status Inquiries:** Check YPEC chef portal
- **Cost Reimbursement:** Submit receipt via portal

### For Staff
- **Document Verification:** Henry (COO)
- **Expiry Alerts:** Automated weekly email
- **Policy Questions:** Henry (COO) or Operations Team

### External Resources
- **BC Criminal Record Check:** https://www2.gov.bc.ca/gov/content/safety/crime-prevention/criminal-record-check
- **FBI Background Check:** https://www.fbi.gov/how-we-can-help-you/identity-history-summary-checks
- **RCMP Checks:** https://www.rcmp-grc.gc.ca/en/criminal-record-checks

---

## 📝 Legal Considerations

### Privacy & Data Protection
- Background check documents stored securely
- Access restricted to Henry (COO) and authorized staff
- Data encrypted at rest and in transit
- Retention policy: 7 years post-employment

### Compliance with Laws
- Fair Credit Reporting Act (FCRA) - USA
- Personal Information Protection and Electronic Documents Act (PIPEDA) - Canada
- Background checks conducted per jurisdiction requirements

### Disclosure Requirements
- Chefs must consent to background checks
- Adverse action notices sent if disqualified
- Right to dispute incorrect information

---

**Questions? Contact Henry (COO) at henry@yourprivateestatechef.com**

**Policy Version:** 1.0
**Effective Date:** 2026-01-15
**Next Review:** 2026-07-15
