// ============================================================================
// JORDAN - AUTONOMOUS GENERAL COUNSEL
// 100% ACCOUNTABLE FOR LEGAL PROTECTION & RISK MITIGATION
// Reports to: Atlas (CEO)
// ============================================================================

const { getSupabase, tenantInsert, tenantUpdate, TENANT_ID, TABLES } = require('./database');
const mfs = require('./mfs-integration');

const JORDAN_PROFILE = {
  name: 'JORDAN',
  title: 'General Counsel - Chief Legal Officer',
  reports_to: 'Atlas (CEO)',
  company: 'Your Private Estate Chef',
  accountability: 'Comprehensive legal protection, risk mitigation, zero lawsuits',
  personality: 'Meticulous, risk-averse, proactive, protective of company assets',
  decision_authority: [
    'Approve standard contracts (under $50K)',
    'Issue legal warnings and compliance notices',
    'Mandate insurance requirements',
    'Enforce background check policies',
    'Require legal disclosures on all platforms',
    'Block high-risk operations',
    'Demand legal budget from Atlas'
  ],
  legal_framework: {
    required_insurance: {
      general_liability: '$2M per occurrence',
      professional_liability: '$1M per occurrence',
      workers_compensation: 'State minimum',
      cyber_liability: '$500K (recommended)'
    },
    required_compliance: [
      'Chef background checks (all active chefs)',
      'Terms of Service on all platforms',
      'Privacy Policy (CCPA/GDPR compliant)',
      'Liability waivers signed before service',
      'Service agreements for all clients',
      'Chef contracts for all placements',
      'Food handler permits (state-specific)',
      'Business licenses (all operating states)',
      'Tax registration (federal + state)'
    ]
  },
  actions: [
    'status',
    'legal_health',
    'generate_disclosures',
    'generate_contracts',
    'compliance_audit',
    'risk_assessment',
    'background_check_status',
    'insurance_status',
    'lawsuit_prevention',
    'monthly_legal_report',
    'quarterly_compliance_review',
    'autonomous_run'
  ]
};

module.exports = async (req, res) => {
  const { action, data } = req.body;

  try {
    switch (action) {
      case 'status':
        return await getStatus(req, res);

      case 'legal_health':
        return await assessLegalHealth(req, res);

      case 'generate_disclosures':
        return await generateLegalDisclosures(req, res, data);

      case 'generate_contracts':
        return await generateContractTemplates(req, res, data);

      case 'compliance_audit':
        return await runComplianceAudit(req, res);

      case 'risk_assessment':
        return await assessRisk(req, res);

      case 'background_check_status':
        return await checkBackgroundCheckStatus(req, res);

      case 'insurance_status':
        return await checkInsuranceStatus(req, res);

      case 'lawsuit_prevention':
        return await implementLawsuitPrevention(req, res);

      case 'monthly_legal_report':
        return await sendMonthlyLegalReport(req, res);

      case 'quarterly_compliance_review':
        return await quarterlyComplianceReview(req, res);

      case 'autonomous_run':
        return await autonomousRun(req, res);

      default:
        return res.status(400).json({
          error: 'Invalid action',
          available_actions: JORDAN_PROFILE.actions
        });
    }
  } catch (error) {
    console.error(`[${JORDAN_PROFILE.name}] ERROR:`, error);
    return res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// STATUS
// ============================================================================

async function getStatus(req, res) {
  console.log(`[${JORDAN_PROFILE.name}] Checking legal status...`);

  const health = await assessLegalHealth();
  const risks = await assessRisk();

  return res.json({
    general_counsel: JORDAN_PROFILE.name,
    accountability: JORDAN_PROFILE.accountability,
    legal_health: health,
    risk_assessment: risks,
    decision_authority: JORDAN_PROFILE.decision_authority,
    autonomous: true,
    message: health.critical_issues > 0 ?
      `CRITICAL: ${health.critical_issues} legal issues require immediate action` :
      'Legal framework operational'
  });
}

// ============================================================================
// LEGAL HEALTH ASSESSMENT
// ============================================================================

async function assessLegalHealth() {
  console.log(`[${JORDAN_PROFILE.name}] Assessing legal health...`);

  // Check insurance
  const insurance = await checkInsuranceStatus();

  // Check background checks
  const background_checks = await checkBackgroundCheckStatus();

  // Check contracts
  const { data: households } = await getSupabase()
    .from(TABLES.HOUSEHOLDS)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'active');

  const active_clients = households?.length || 0;
  const clients_with_contracts = households?.filter(h => h.contract_signed).length || 0;
  const contract_coverage = active_clients > 0 ? (clients_with_contracts / active_clients) * 100 : 0;

  // Calculate legal health score
  const issues = [];

  if (!insurance.compliant) {
    issues.push({ severity: 'critical', issue: 'No insurance coverage', impact: 'Cannot operate legally' });
  }

  if (!background_checks.compliant) {
    issues.push({ severity: 'critical', issue: `${background_checks.chefs_without_checks} chefs without background checks`, impact: 'Liability exposure' });
  }

  if (contract_coverage < 100) {
    issues.push({ severity: 'high', issue: `${active_clients - clients_with_contracts} clients without signed contracts`, impact: 'Legal disputes possible' });
  }

  const critical_issues = issues.filter(i => i.severity === 'critical').length;
  const high_issues = issues.filter(i => i.severity === 'high').length;

  return {
    overall_status: critical_issues > 0 ? 'CRITICAL' : high_issues > 0 ? 'AT RISK' : 'HEALTHY',
    legal_health_score: calculateLegalHealthScore(insurance, background_checks, contract_coverage),
    insurance: insurance,
    background_checks: background_checks,
    contract_coverage: contract_coverage.toFixed(1),
    critical_issues: critical_issues,
    high_issues: high_issues,
    all_issues: issues,
    can_operate: critical_issues === 0,
    recommendations: generateLegalRecommendations(issues)
  };
}

function calculateLegalHealthScore(insurance, backgroundChecks, contractCoverage) {
  let score = 0;

  // Insurance (40 points)
  if (insurance.compliant) score += 40;

  // Background checks (30 points)
  if (backgroundChecks.compliant) score += 30;
  else if (backgroundChecks.coverage >= 80) score += 20;
  else if (backgroundChecks.coverage >= 50) score += 10;

  // Contracts (30 points)
  if (contractCoverage >= 100) score += 30;
  else if (contractCoverage >= 80) score += 20;
  else if (contractCoverage >= 50) score += 10;

  return score;
}

function generateLegalRecommendations(issues) {
  const recommendations = [];

  issues.forEach(issue => {
    if (issue.issue.includes('insurance')) {
      recommendations.push({
        priority: 1,
        action: 'OBTAIN INSURANCE IMMEDIATELY',
        reasoning: 'Cannot operate without $2M general liability coverage',
        timeline: 'Before any client placement',
        estimated_cost: '$5,000-$10,000/year',
        blocker: true
      });
    }

    if (issue.issue.includes('background checks')) {
      recommendations.push({
        priority: 1,
        action: 'COMPLETE ALL BACKGROUND CHECKS',
        reasoning: 'High liability risk with unchecked chefs',
        timeline: '7 days',
        estimated_cost: '$50/chef',
        blocker: true
      });
    }

    if (issue.issue.includes('contracts')) {
      recommendations.push({
        priority: 2,
        action: 'SIGN ALL CLIENT CONTRACTS',
        reasoning: 'No legal protection without signed agreements',
        timeline: '14 days',
        estimated_cost: '$0 (templates ready)',
        blocker: false
      });
    }
  });

  return recommendations;
}

// ============================================================================
// GENERATE LEGAL DISCLOSURES
// ============================================================================

async function generateLegalDisclosures(req, res, data) {
  console.log(`[${JORDAN_PROFILE.name}] Generating legal disclosures...`);

  const disclosure_type = data?.type || 'all';

  const disclosures = {};

  if (disclosure_type === 'all' || disclosure_type === 'terms_of_service') {
    disclosures.terms_of_service = generateTermsOfService();
  }

  if (disclosure_type === 'all' || disclosure_type === 'privacy_policy') {
    disclosures.privacy_policy = generatePrivacyPolicy();
  }

  if (disclosure_type === 'all' || disclosure_type === 'liability_waiver') {
    disclosures.liability_waiver = generateLiabilityWaiver();
  }

  if (disclosure_type === 'all' || disclosure_type === 'chef_agreement') {
    disclosures.chef_agreement = generateChefAgreement();
  }

  if (res) {
    return res.json({
      success: true,
      generated_by: JORDAN_PROFILE.name,
      timestamp: new Date().toISOString(),
      disclosures: disclosures,
      message: 'Legal disclosures generated - review and deploy to all platforms'
    });
  } else {
    return disclosures;
  }
}

function generateTermsOfService() {
  return {
    title: 'Terms of Service - Your Private Estate Chef',
    last_updated: new Date().toISOString().split('T')[0],
    content: `
TERMS OF SERVICE

Last Updated: ${new Date().toISOString().split('T')[0]}

1. ACCEPTANCE OF TERMS
By accessing or using Your Private Estate Chef ("YPEC", "we", "our") services, you agree to be bound by these Terms of Service.

2. SERVICE DESCRIPTION
YPEC is a marketplace platform that connects clients with professional private chefs. We facilitate placements but do not directly employ chefs.

3. CLIENT OBLIGATIONS
- Provide safe working environment for chefs
- Make timely payments as agreed
- Respect chef's professional boundaries
- Maintain confidentiality of chef information

4. LIABILITY LIMITATIONS
YPEC acts as a marketplace facilitator. We:
- Perform background checks on all chefs
- Verify professional certifications
- Maintain $2M general liability insurance
- Are NOT liable for chef actions beyond our control

5. INSURANCE & BACKGROUND CHECKS
All chefs undergo:
- Criminal background checks
- Professional reference verification
- Food safety certification verification
- Continuous monitoring

6. PAYMENT TERMS
- Payment due within 30 days of invoice
- Late payments subject to 1.5% monthly interest
- Non-payment may result in service suspension

7. CANCELLATION POLICY
- 48-hour cancellation notice required
- Cancellations within 48 hours: 50% charge
- No-show cancellations: 100% charge

8. DISPUTE RESOLUTION
- Disputes resolved through binding arbitration
- Venue: State of Delaware
- No class action lawsuits permitted

9. LIMITATION OF LIABILITY
YPEC's liability limited to amounts paid in previous 12 months. Not liable for:
- Indirect or consequential damages
- Food allergies or dietary restrictions
- Chef misconduct beyond reasonable screening

10. INDEMNIFICATION
Client agrees to indemnify YPEC against claims arising from:
- Client's breach of these terms
- Unsafe working conditions provided to chef
- Failure to disclose allergies or dietary restrictions

BY USING OUR SERVICES, YOU ACKNOWLEDGE READING AND ACCEPTING THESE TERMS.

Contact: legal@yourprivateestatechef.com
    `.trim(),
    deployment_required: true,
    platforms: ['website', 'client_portal', 'mobile_app']
  };
}

function generatePrivacyPolicy() {
  return {
    title: 'Privacy Policy - Your Private Estate Chef',
    last_updated: new Date().toISOString().split('T')[0],
    content: `
PRIVACY POLICY

Last Updated: ${new Date().toISOString().split('T')[0]}

1. INFORMATION WE COLLECT
- Personal: Name, email, phone, address
- Payment: Credit card information (via Stripe)
- Dietary: Preferences, allergies, restrictions
- Usage: Website activity, service preferences

2. HOW WE USE YOUR INFORMATION
- Match you with appropriate chefs
- Process payments and invoicing
- Communicate about services
- Improve our platform

3. INFORMATION SHARING
We NEVER sell your data. We share only with:
- Matched chefs (necessary information only)
- Payment processors (Stripe)
- Legal authorities (if required by law)

4. DATA SECURITY
- Encrypted data transmission (SSL/TLS)
- Secure database storage
- Limited employee access
- Regular security audits

5. YOUR RIGHTS (CCPA/GDPR)
You have the right to:
- Access your personal data
- Request data deletion
- Opt-out of marketing communications
- Data portability

6. COOKIES
We use essential cookies only. No third-party tracking.

7. CHEF BACKGROUND CHECKS
Chef data includes criminal background checks stored securely for 7 years per legal requirements.

8. DATA RETENTION
- Active clients: Data retained during service
- Inactive clients: Data deleted after 3 years
- Legal records: 7 years

9. CHILDREN'S PRIVACY
We do not knowingly collect data from children under 13.

10. CONTACT
Privacy questions: privacy@yourprivateestatechef.com

BY USING OUR SERVICES, YOU CONSENT TO THIS PRIVACY POLICY.
    `.trim(),
    compliance: ['CCPA', 'GDPR', 'PIPEDA'],
    deployment_required: true,
    platforms: ['website', 'client_portal', 'mobile_app']
  };
}

function generateLiabilityWaiver() {
  return {
    title: 'Liability Waiver and Release - Client',
    last_updated: new Date().toISOString().split('T')[0],
    content: `
LIABILITY WAIVER AND RELEASE

Client Name: _________________________________
Date: ________________________________________

ASSUMPTION OF RISK
I understand that hiring a private chef involves certain risks including but not limited to:
- Food allergies and dietary restrictions
- Food preparation in my home
- Chef access to my property
- Kitchen equipment usage

RELEASE OF LIABILITY
I hereby RELEASE, WAIVE, and DISCHARGE Your Private Estate Chef (YPEC) from any and all liability for:
- Personal injury or property damage
- Food allergies or adverse reactions (if not properly disclosed)
- Chef actions beyond YPEC's reasonable control
- Equipment malfunction or damage

INDEMNIFICATION
I agree to INDEMNIFY and HOLD HARMLESS YPEC from claims arising from:
- My failure to disclose allergies or dietary restrictions
- Unsafe kitchen conditions
- Failure to provide appropriate working environment
- My breach of service agreement

ACKNOWLEDGMENTS
I acknowledge that:
✓ YPEC has performed background checks on all chefs
✓ YPEC maintains $2M general liability insurance
✓ I have disclosed all dietary restrictions and allergies
✓ I will provide safe working conditions for the chef
✓ I understand YPEC is a marketplace facilitator, not chef employer

INSURANCE NOTICE
YPEC maintains the following insurance:
- General Liability: $2,000,000 per occurrence
- Professional Liability: $1,000,000 per occurrence

SIGNATURE REQUIRED
This waiver must be signed before first service.

Client Signature: _________________________ Date: __________

Print Name: _______________________________

YPEC maintains copies for 7 years per legal requirements.
    `.trim(),
    signature_required: true,
    required_before: 'first_service',
    retention_period: '7 years'
  };
}

function generateChefAgreement() {
  return {
    title: 'Independent Chef Service Agreement',
    last_updated: new Date().toISOString().split('T')[0],
    content: `
INDEPENDENT CHEF SERVICE AGREEMENT

This Agreement entered into on __________ between:

Your Private Estate Chef ("YPEC", "Company")
AND
Chef: _________________________________ ("Chef", "Contractor")

1. INDEPENDENT CONTRACTOR STATUS
Chef is an independent contractor, NOT an employee. Chef is responsible for:
- Own taxes (1099 contractor)
- Own liability insurance (minimum $1M)
- Own workers' compensation (if applicable)
- Own equipment and tools

2. SERVICES
Chef agrees to provide private chef services to YPEC clients including:
- Menu planning and preparation
- Grocery shopping (reimbursed or billed to client)
- Meal preparation in client homes
- Kitchen cleanup

3. COMPENSATION
- Chef receives 70% of client billing
- YPEC receives 30% placement/platform fee
- Payments processed within 7 days of invoice
- Direct deposit preferred

4. REQUIREMENTS
Chef must maintain:
✓ Current food handler certification
✓ Professional liability insurance ($1M minimum)
✓ Clean criminal background (re-verified annually)
✓ Professional references
✓ COVID-19 health protocols compliance

5. CONFIDENTIALITY
Chef agrees to:
- Maintain strict client confidentiality
- Not disclose client personal information
- Not photograph client homes/families
- Not solicit YPEC clients directly (2-year non-compete)

6. LIABILITY
Chef agrees to:
- Follow all food safety protocols
- Disclose any health issues affecting food handling
- Maintain sanitary practices
- Carry own liability insurance

7. TERMINATION
Either party may terminate with 14 days notice.
Immediate termination for:
- Criminal activity
- Client safety violations
- Breach of confidentiality
- Failed background check

8. INDEMNIFICATION
Chef indemnifies YPEC against claims arising from:
- Chef's negligence or misconduct
- Food safety violations
- Breach of client confidentiality
- Unlicensed or uninsured operations

9. BACKGROUND CHECKS
Chef authorizes YPEC to:
- Conduct initial criminal background check
- Verify professional references
- Re-verify annually
- Suspend services if issues arise

10. DISPUTE RESOLUTION
Binding arbitration in Delaware.
No class action permitted.

CHEF SIGNATURE: _________________________ Date: __________

Print Name: _______________________________

YPEC AUTHORIZED SIGNATURE: _________________________ Date: __________
    `.trim(),
    signature_required: true,
    required_before: 'first_placement',
    retention_period: '7 years',
    key_terms: {
      revenue_split: '70/30 (Chef/YPEC)',
      insurance_required: '$1M professional liability',
      background_checks: 'Annual re-verification',
      non_compete: '2 years',
      independent_contractor: 'Yes (1099)'
    }
  };
}

// ============================================================================
// CONTRACT TEMPLATE GENERATION
// ============================================================================

async function generateContractTemplates(req, res, data) {
  console.log(`[${JORDAN_PROFILE.name}] Generating contract templates...`);

  const contract_type = data?.type || 'all';
  const contracts = {};

  if (contract_type === 'all' || contract_type === 'client_service_agreement') {
    contracts.client_service_agreement = generateClientServiceAgreement(data?.client_name);
  }

  if (contract_type === 'all' || contract_type === 'chef_agreement') {
    contracts.chef_agreement = generateChefAgreement();
  }

  if (contract_type === 'all' || contract_type === 'nda') {
    contracts.nda = generateNDA(data?.party_name);
  }

  if (res) {
    return res.json({
      success: true,
      generated_by: JORDAN_PROFILE.name,
      contracts: contracts,
      message: 'Contract templates generated - customize and deploy'
    });
  } else {
    return contracts;
  }
}

function generateClientServiceAgreement(clientName = '[CLIENT NAME]') {
  return {
    title: 'Client Service Agreement',
    client_name: clientName,
    content: `
CLIENT SERVICE AGREEMENT

This Service Agreement ("Agreement") entered into on __________ between:

${clientName} ("Client")
AND
Your Private Estate Chef, LLC ("YPEC", "Service Provider")

1. SERVICES
YPEC will provide private chef placement and matching services including:
- Chef screening and background checks
- Service coordination and scheduling
- Quality assurance and monitoring
- Payment processing

2. FEES AND PAYMENT
Monthly Service Fee: $_______ per month
Payment Terms: Net 30 days
Late Payment: 1.5% monthly interest after 30 days

3. TERM
Initial Term: _____ months
Renewal: Automatic monthly renewal
Cancellation: 30 days written notice

4. CLIENT RESPONSIBILITIES
✓ Provide safe working environment
✓ Disclose all allergies and dietary restrictions
✓ Allow chef reasonable access to kitchen
✓ Make timely payments
✓ Sign liability waiver before service

5. YPEC GUARANTEES
✓ All chefs background checked
✓ $2M general liability insurance
✓ Professional reference verification
✓ Satisfaction guarantee (see Section 8)

6. LIABILITY LIMITATIONS
YPEC's liability limited to fees paid in previous 12 months.
Not liable for:
- Chef actions beyond our control
- Undisclosed allergies/restrictions
- Client property conditions

7. INSURANCE
YPEC maintains:
- General Liability: $2M per occurrence
- Professional Liability: $1M per occurrence

8. SATISFACTION GUARANTEE
Unsatisfied with chef match? We'll provide replacement at no additional cost within 48 hours.

9. TERMINATION
Either party: 30 days written notice
YPEC may terminate immediately if:
- Client fails to pay after 60 days
- Unsafe working conditions
- Chef harassment or misconduct

10. GOVERNING LAW
State of Delaware, USA

CLIENT SIGNATURE: _________________________ Date: __________

Print Name: _______________________________

YPEC AUTHORIZED SIGNATURE: _________________________ Date: __________

FOR YPEC: Jordan (General Counsel)
    `.trim(),
    signature_required: true,
    retention_period: '7 years'
  };
}

function generateNDA(partyName = '[PARTY NAME]') {
  return {
    title: 'Non-Disclosure Agreement',
    party_name: partyName,
    content: `
MUTUAL NON-DISCLOSURE AGREEMENT

Between: ${partyName} ("Party")
And: Your Private Estate Chef, LLC ("YPEC")

1. CONFIDENTIAL INFORMATION
Includes but not limited to:
- Client personal information
- Chef background information
- Business strategies and pricing
- Proprietary systems and processes

2. OBLIGATIONS
Both parties agree to:
- Not disclose confidential information
- Use information only for agreed purposes
- Return/destroy information upon request

3. TERM
This NDA remains in effect for 5 years from signing date.

4. EXCEPTIONS
Does not apply to information that:
- Is publicly available
- Was known before disclosure
- Is independently developed
- Must be disclosed by law

SIGNATURES:

Party: _________________________ Date: __________

YPEC: _________________________ Date: __________
    `.trim(),
    signature_required: true
  };
}

// ============================================================================
// BACKGROUND CHECKS & INSURANCE STATUS
// ============================================================================

async function checkBackgroundCheckStatus() {
  const { data: chefs } = await getSupabase()
    .from(TABLES.USERS)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('role', 'chef');

  const total_chefs = chefs?.length || 0;
  const chefs_with_checks = chefs?.filter(c => c.background_check_status === 'cleared').length || 0;
  const chefs_without_checks = total_chefs - chefs_with_checks;
  const coverage = total_chefs > 0 ? (chefs_with_checks / total_chefs) * 100 : 0;

  return {
    total_chefs: total_chefs,
    chefs_with_checks: chefs_with_checks,
    chefs_without_checks: chefs_without_checks,
    coverage: coverage.toFixed(1),
    compliant: chefs_without_checks === 0,
    status: chefs_without_checks === 0 ? 'COMPLIANT' : 'NON-COMPLIANT',
    action_required: chefs_without_checks > 0 ? `Complete ${chefs_without_checks} background checks` : 'None'
  };
}

async function checkInsuranceStatus() {
  // TODO: Integrate with actual insurance provider API
  // For now, return placeholder status
  return {
    general_liability: {
      coverage: 0, // $0 - NOT OBTAINED YET
      required: 2000000, // $2M
      status: 'NOT OBTAINED',
      provider: 'TBD',
      expires: null
    },
    professional_liability: {
      coverage: 0,
      required: 1000000,
      status: 'NOT OBTAINED',
      provider: 'TBD',
      expires: null
    },
    workers_comp: {
      status: 'NOT OBTAINED',
      provider: 'TBD',
      expires: null
    },
    compliant: false,
    total_gap: 3000000, // $3M in missing coverage
    action_required: 'CRITICAL: Obtain all required insurance before operations'
  };
}

// ============================================================================
// RISK ASSESSMENT
// ============================================================================

async function assessRisk() {
  const insurance = await checkInsuranceStatus();
  const background_checks = await checkBackgroundCheckStatus();

  const risks = {
    critical: [],
    high: [],
    medium: [],
    low: []
  };

  // Critical risks
  if (!insurance.compliant) {
    risks.critical.push({
      risk: 'Uninsured Operations',
      impact: '$5M+ lawsuit exposure',
      probability: 'High',
      mitigation: 'Obtain $2M general liability + $1M professional liability',
      blocker: true
    });
  }

  if (!background_checks.compliant) {
    risks.critical.push({
      risk: `${background_checks.chefs_without_checks} Chefs Without Background Checks`,
      impact: 'Criminal liability + reputation damage',
      probability: 'Medium',
      mitigation: 'Complete all background checks immediately',
      blocker: true
    });
  }

  // High risks
  const { data: active_clients } = await getSupabase()
    .from(TABLES.HOUSEHOLDS)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'active');

  const clients_without_waivers = active_clients?.filter(c => !c.liability_waiver_signed).length || 0;

  if (clients_without_waivers > 0) {
    risks.high.push({
      risk: `${clients_without_waivers} Clients Without Signed Liability Waivers`,
      impact: 'Cannot defend against claims',
      probability: 'Medium',
      mitigation: 'Obtain signed waivers before next service'
    });
  }

  // Calculate overall risk score
  const risk_score = (risks.critical.length * 40) + (risks.high.length * 20) + (risks.medium.length * 10) + (risks.low.length * 5);

  return {
    overall_risk_level: risks.critical.length > 0 ? 'CRITICAL' : risks.high.length > 0 ? 'HIGH' : 'MODERATE',
    risk_score: risk_score,
    can_operate: risks.critical.length === 0,
    risks: risks,
    blockers: [...risks.critical.filter(r => r.blocker), ...risks.high.filter(r => r.blocker)],
    immediate_actions: generateRiskMitigationPlan(risks)
  };
}

function generateRiskMitigationPlan(risks) {
  const actions = [];

  risks.critical.forEach(risk => {
    actions.push({
      priority: 1,
      action: risk.mitigation,
      deadline: 'Immediate',
      blocker: risk.blocker || false
    });
  });

  risks.high.forEach(risk => {
    actions.push({
      priority: 2,
      action: risk.mitigation,
      deadline: '7 days'
    });
  });

  return actions;
}

// ============================================================================
// LAWSUIT PREVENTION PROTOCOLS
// ============================================================================

async function implementLawsuitPrevention(req, res) {
  console.log(`[${JORDAN_PROFILE.name}] Implementing lawsuit prevention protocols...`);

  const protocols = {
    pre_service: [
      '✓ Background check completed',
      '✓ Liability waiver signed',
      '✓ Service agreement signed',
      '✓ Dietary restrictions documented',
      '✓ Insurance verified'
    ],
    during_service: [
      '✓ Chef follows food safety protocols',
      '✓ Client satisfaction monitored',
      '✓ Incident reporting system active',
      '✓ Photo/video consent obtained'
    ],
    post_service: [
      '✓ Satisfaction survey sent',
      '✓ Complaints logged and resolved',
      '✓ Records retained for 7 years',
      '✓ Contract renewals tracked'
    ],
    dispute_resolution: [
      '✓ Mandatory arbitration clause',
      '✓ No class action permitted',
      '✓ Delaware venue',
      '✓ Mediation required before arbitration'
    ]
  };

  const enforcement = {
    automated_checks: [
      'Block service without signed waiver',
      'Alert if background check expired',
      'Require dietary restrictions confirmation',
      'Flag complaints for immediate review'
    ],
    jordan_oversight: [
      'Daily compliance monitoring',
      'Weekly risk assessment',
      'Monthly legal audit',
      'Quarterly executive briefing to Atlas'
    ]
  };

  return res.json({
    success: true,
    lawsuit_prevention: protocols,
    enforcement: enforcement,
    message: 'Lawsuit prevention protocols active'
  });
}

// ============================================================================
// COMPLIANCE AUDIT
// ============================================================================

async function runComplianceAudit() {
  const insurance = await checkInsuranceStatus();
  const background_checks = await checkBackgroundCheckStatus();
  const legal_health = await assessLegalHealth();

  const audit = {
    audit_date: new Date().toISOString(),
    auditor: JORDAN_PROFILE.name,
    compliance_areas: {
      insurance: insurance,
      background_checks: background_checks,
      contracts: {
        client_agreements: 'Templates ready',
        chef_agreements: 'Templates ready',
        liability_waivers: 'Templates ready'
      },
      disclosures: {
        terms_of_service: 'Generated - needs deployment',
        privacy_policy: 'Generated - needs deployment',
        liability_waiver: 'Generated - needs signatures'
      }
    },
    overall_compliance: legal_health.can_operate ? 'OPERATIONAL' : 'BLOCKED',
    critical_issues: legal_health.critical_issues,
    recommendations: legal_health.recommendations
  };

  return audit;
}

async function quarterlyComplianceReview(req, res) {
  console.log(`[${JORDAN_PROFILE.name}] Conducting quarterly compliance review...`);

  const audit = await runComplianceAudit();

  // Send to Atlas
  await mfs.sendReport('ATLAS', {
    bot_name: JORDAN_PROFILE.name,
    type: 'quarterly_compliance_review',
    priority: audit.critical_issues > 0 ? 'critical' : 'normal',
    subject: `Quarterly Legal Compliance Review - ${audit.overall_compliance}`,
    data: audit
  });

  if (res) {
    return res.json({
      success: true,
      audit: audit
    });
  } else {
    return audit;
  }
}

// ============================================================================
// MONTHLY LEGAL REPORT
// ============================================================================

async function sendMonthlyLegalReport(req, res) {
  console.log(`[${JORDAN_PROFILE.name}] Generating monthly legal report...`);

  const health = await assessLegalHealth();
  const risks = await assessRisk();

  const report = {
    month: new Date().toISOString().split('T')[0].substring(0, 7),
    legal_health: health,
    risk_assessment: risks,
    insurance_status: await checkInsuranceStatus(),
    background_check_status: await checkBackgroundCheckStatus(),
    executive_summary: health.can_operate ?
      'Legal framework operational. Minor compliance items require attention.' :
      `CRITICAL: ${health.critical_issues} blocking issues prevent legal operations`,
    actions_required: health.recommendations
  };

  // Send to Atlas
  await mfs.sendReport('ATLAS', {
    bot_name: JORDAN_PROFILE.name,
    type: 'monthly_legal_report',
    priority: health.critical_issues > 0 ? 'critical' : 'normal',
    subject: `Monthly Legal Report - ${health.overall_status}`,
    data: report
  });

  if (res) {
    return res.json({
      success: true,
      report: report
    });
  } else {
    return report;
  }
}

// ============================================================================
// AUTONOMOUS RUN
// ============================================================================

async function autonomousRun(req, res) {
  console.log(`[${JORDAN_PROFILE.name}] Running autonomous legal operations...`);

  const results = {
    timestamp: new Date().toISOString(),
    legal_health: await assessLegalHealth(),
    risk_assessment: await assessRisk(),
    actions_taken: []
  };

  // ACTION 1: Alert Atlas if critical legal issues
  if (results.legal_health.critical_issues > 0) {
    await mfs.sendReport('ATLAS', {
      bot_name: JORDAN_PROFILE.name,
      type: 'legal_alert',
      priority: 'critical',
      subject: `LEGAL ALERT: ${results.legal_health.critical_issues} Critical Issues - Operations Blocked`,
      data: {
        legal_health: results.legal_health,
        can_operate: results.legal_health.can_operate,
        blockers: results.risk_assessment.blockers
      }
    });

    results.actions_taken.push({
      action: 'CRITICAL_LEGAL_ALERT',
      reasoning: `${results.legal_health.critical_issues} critical legal issues blocking operations`
    });
  }

  // ACTION 2: Monitor background check expirations
  const background_checks = await checkBackgroundCheckStatus();
  if (!background_checks.compliant) {
    await mfs.sendReport('HENRY', {
      bot_name: JORDAN_PROFILE.name,
      type: 'background_check_alert',
      priority: 'high',
      subject: `Background Check Alert: ${background_checks.chefs_without_checks} Chefs Non-Compliant`,
      data: background_checks
    });

    results.actions_taken.push({
      action: 'BACKGROUND_CHECK_ALERT',
      target: 'HENRY (COO)',
      chefs_affected: background_checks.chefs_without_checks
    });
  }

  // ACTION 3: Insurance renewal monitoring
  const insurance = await checkInsuranceStatus();
  if (!insurance.compliant) {
    results.actions_taken.push({
      action: 'INSURANCE_ALERT',
      status: 'CRITICAL - No insurance coverage',
      blocker: true
    });
  }

  if (res) {
    return res.json(results);
  } else {
    return results;
  }
}

module.exports.JORDAN_PROFILE = JORDAN_PROFILE;
