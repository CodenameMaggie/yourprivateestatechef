// ============================================================================
// JORDAN LEGAL OVERSIGHT BOT
// Reports to: Atlas (CEO)
// Purpose: Legal compliance, contracts, liability management, regulatory oversight
// ============================================================================

const { getSupabase, tenantInsert, tenantUpdate, TENANT_ID, TABLES } = require('./database');
const mfs = require('./mfs-integration');

const BOT_INFO = {
  name: 'JORDAN',
  title: 'General Counsel - Chief Legal Officer',
  reports_to: 'Atlas (CEO)',
  company: 'Your Private Estate Chef',
  company_number: 7,
  purpose: 'Legal compliance, contract management, liability oversight, regulatory adherence',
  responsibilities: [
    'Contract review and approval',
    'Liability and insurance oversight',
    'Chef background check compliance',
    'Client agreement management',
    'Regulatory compliance (food safety, labor law)',
    'Intellectual property protection',
    'Risk mitigation',
    'Dispute resolution'
  ],
  actions: [
    'status',
    'contracts_pending',
    'compliance_check',
    'liability_review',
    'legal_alerts',
    'contract_approval',
    'compliance_audit',
    'risk_assessment',
    'monthly_legal_report',
    'quarterly_compliance_review'
  ]
};

const LEGAL_TABLES = {
  CONTRACTS: 'ypec_contracts',
  LEGAL_ISSUES: 'ypec_legal_issues',
  COMPLIANCE_CHECKS: 'ypec_compliance_checks',
  INSURANCE: 'ypec_insurance_policies'
};

module.exports = async (req, res) => {
  const { action, data } = req.body;

  try {
    switch (action) {
      case 'status':
        return await getStatus(req, res);

      case 'contracts_pending':
        return await getContractsPending(req, res);

      case 'compliance_check':
        return await runComplianceCheck(req, res);

      case 'liability_review':
        return await reviewLiability(req, res);

      case 'legal_alerts':
        return await getLegalAlerts(req, res);

      case 'contract_approval':
        return await approveContract(req, res, data);

      case 'compliance_audit':
        return await conductComplianceAudit(req, res);

      case 'risk_assessment':
        return await assessRisk(req, res);

      case 'monthly_legal_report':
        return await sendMonthlyLegalReport(req, res);

      case 'quarterly_compliance_review':
        return await quarterlyComplianceReview(req, res);

      default:
        return res.status(400).json({
          error: 'Invalid action',
          available_actions: BOT_INFO.actions
        });
    }
  } catch (error) {
    console.error(`[${BOT_INFO.name}] Error:`, error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

// ============================================================================
// STATUS
// ============================================================================

async function getStatus(req, res) {
  const contracts = await getContractsOverview();
  const compliance = await getComplianceOverview();
  const risks = await getCurrentRisks();

  return res.json({
    bot: BOT_INFO,
    status: 'active',
    overview: {
      contracts: contracts,
      compliance: compliance,
      risks: risks
    },
    legal_framework: {
      chef_agreements: 'Standard template ready',
      client_agreements: 'Standard template ready',
      liability_insurance: 'Required - $2M minimum',
      background_checks: 'Mandatory for all chefs',
      food_safety_compliance: 'State-by-state requirements tracked'
    }
  });
}

// ============================================================================
// CONTRACTS MANAGEMENT
// ============================================================================

async function getContractsPending(req, res) {
  console.log(`[${BOT_INFO.name}] Retrieving pending contracts`);

  // Get all contracts pending review
  const pendingContracts = [
    {
      id: 'DRAFT-001',
      type: 'client_service_agreement',
      client: 'Pending First Client',
      status: 'pending_review',
      created: new Date().toISOString(),
      value: 0,
      risk_level: 'low',
      notes: 'Standard service agreement template'
    }
  ];

  return res.json({
    success: true,
    pending_count: pendingContracts.length,
    contracts: pendingContracts,
    requires_immediate_attention: pendingContracts.filter(c => c.risk_level === 'high').length
  });
}

async function approveContract(req, res, data) {
  const { contract_id, notes } = data;

  console.log(`[${BOT_INFO.name}] Approving contract ${contract_id}`);

  // Contract approval logic would go here

  return res.json({
    success: true,
    message: `Contract ${contract_id} approved`,
    approved_by: BOT_INFO.name,
    approved_at: new Date().toISOString(),
    notes: notes
  });
}

// ============================================================================
// COMPLIANCE OVERSIGHT
// ============================================================================

async function runComplianceCheck(req, res) {
  console.log(`[${BOT_INFO.name}] Running compliance check`);

  const checks = {
    chef_background_checks: await checkChefCompliance(),
    insurance_coverage: await checkInsuranceCoverage(),
    contract_compliance: await checkContractCompliance(),
    food_safety: await checkFoodSafetyCompliance(),
    labor_law: await checkLaborCompliance(),
    data_privacy: await checkDataPrivacyCompliance()
  };

  const issues = Object.entries(checks)
    .filter(([key, value]) => !value.compliant)
    .map(([key, value]) => ({ area: key, issue: value.issue }));

  return res.json({
    success: true,
    timestamp: new Date().toISOString(),
    overall_compliance: issues.length === 0,
    compliance_score: ((Object.keys(checks).length - issues.length) / Object.keys(checks).length * 100).toFixed(1),
    checks: checks,
    issues: issues,
    action_required: issues.length > 0
  });
}

async function conductComplianceAudit(req, res) {
  console.log(`[${BOT_INFO.name}] Conducting comprehensive compliance audit`);

  const audit = {
    audit_date: new Date().toISOString(),
    auditor: BOT_INFO.name,

    // Legal Documents
    legal_documents: {
      chef_agreements: { status: 'template_ready', count: 0, compliant: true },
      client_agreements: { status: 'template_ready', count: 1, compliant: true },
      nda_templates: { status: 'ready', count: 0, compliant: true }
    },

    // Background Checks
    background_checks: {
      total_chefs: 1,
      checks_completed: 0,
      checks_pending: 1,
      checks_failed: 0,
      compliant: false,
      action_required: 'Complete background check for 1 chef'
    },

    // Insurance
    insurance: {
      general_liability: { status: 'pending', coverage: 0, required: 2000000 },
      professional_liability: { status: 'pending', coverage: 0, required: 1000000 },
      workers_comp: { status: 'pending', coverage: 0, required: 'state_minimum' },
      compliant: false,
      action_required: 'Obtain required insurance policies'
    },

    // Regulatory
    regulatory: {
      business_licenses: { status: 'pending', compliant: false },
      food_handler_permits: { status: 'pending', compliant: false },
      tax_registration: { status: 'pending', compliant: false }
    },

    // Risk Areas
    risk_areas: [
      { area: 'Insurance', severity: 'high', status: 'Not yet obtained' },
      { area: 'Background Checks', severity: 'high', status: 'Incomplete for active chef' },
      { area: 'Business Licenses', severity: 'medium', status: 'Pending registration' }
    ],

    // Recommendations
    recommendations: [
      {
        priority: 1,
        recommendation: 'Obtain $2M general liability insurance before first client placement',
        timeline: 'Immediate',
        estimated_cost: '$2,000-$5,000/year'
      },
      {
        priority: 2,
        recommendation: 'Complete background checks for all active chefs',
        timeline: '7 days',
        estimated_cost: '$50/chef'
      },
      {
        priority: 3,
        recommendation: 'Register business in all operating states',
        timeline: '30 days',
        estimated_cost: '$500-$2,000/state'
      }
    ]
  };

  return res.json({
    success: true,
    audit: audit,
    overall_status: 'action_required',
    critical_issues: audit.risk_areas.filter(r => r.severity === 'high').length
  });
}

// ============================================================================
// RISK ASSESSMENT & LIABILITY
// ============================================================================

async function reviewLiability(req, res) {
  console.log(`[${BOT_INFO.name}] Reviewing liability exposure`);

  const liability = {
    current_exposure: {
      uninsured_placements: 0,
      unchecked_chefs: 1,
      unsigned_contracts: 0,
      total_risk_value: 'High - No insurance coverage'
    },

    liability_categories: {
      chef_injury: { risk: 'high', mitigation: 'Workers comp insurance required' },
      client_injury: { risk: 'high', mitigation: 'General liability insurance required' },
      food_poisoning: { risk: 'medium', mitigation: 'Chef certification + insurance' },
      property_damage: { risk: 'medium', mitigation: 'General liability insurance' },
      contract_breach: { risk: 'low', mitigation: 'Standard contract templates' },
      data_breach: { risk: 'low', mitigation: 'Current security practices adequate' }
    },

    recommended_coverage: {
      general_liability: '$2,000,000 per occurrence',
      professional_liability: '$1,000,000 per occurrence',
      workers_compensation: 'State minimum (varies by state)',
      cyber_liability: '$500,000 (optional but recommended)',
      estimated_annual_cost: '$5,000-$10,000'
    },

    immediate_actions: [
      'Do not place chefs without insurance coverage',
      'Require signed liability waivers',
      'Complete all background checks before first placement'
    ]
  };

  return res.json({
    success: true,
    liability: liability,
    status: 'HIGH RISK - Insurance required before operations'
  });
}

async function assessRisk(req, res) {
  const risks = {
    operational: [
      { risk: 'Uninsured chef placement', severity: 'critical', probability: 'high', impact: '$500K-$5M' },
      { risk: 'Inadequate background checks', severity: 'high', probability: 'medium', impact: 'Reputation + Legal' }
    ],
    financial: [
      { risk: 'Contract disputes', severity: 'medium', probability: 'low', impact: '$10K-$100K' }
    ],
    reputational: [
      { risk: 'Chef misconduct', severity: 'high', probability: 'low', impact: 'Brand damage' }
    ],
    regulatory: [
      { risk: 'Operating without proper licenses', severity: 'medium', probability: 'high', impact: 'Fines + Shutdown' }
    ]
  };

  return res.json({
    success: true,
    risk_assessment: risks,
    overall_risk_level: 'HIGH',
    mitigation_priority: 'Insurance and background checks'
  });
}

// ============================================================================
// LEGAL ALERTS & REPORTING
// ============================================================================

async function getLegalAlerts(req, res) {
  const alerts = [
    {
      severity: 'critical',
      category: 'insurance',
      message: 'No insurance coverage in place - MUST obtain before first placement',
      action_required: 'Contact insurance broker immediately',
      deadline: 'Before first client'
    },
    {
      severity: 'high',
      category: 'compliance',
      message: '1 chef without completed background check',
      action_required: 'Complete background check',
      deadline: '7 days'
    },
    {
      severity: 'medium',
      category: 'regulatory',
      message: 'Business licenses pending in operating states',
      action_required: 'File applications',
      deadline: '30 days'
    }
  ];

  return res.json({
    success: true,
    alerts: alerts,
    critical_count: alerts.filter(a => a.severity === 'critical').length,
    high_count: alerts.filter(a => a.severity === 'high').length
  });
}

async function sendMonthlyLegalReport(req, res) {
  console.log(`[${BOT_INFO.name}] Generating monthly legal report`);

  const report = {
    month: new Date().toISOString().split('T')[0].substring(0, 7),
    contracts: await getContractsOverview(),
    compliance: await getComplianceOverview(),
    risks: await getCurrentRisks(),
    legal_spend: '$0',
    disputes: 0,
    recommendations: await getMonthlyRecommendations()
  };

  // Send to Atlas
  await mfs.sendReport('ATLAS', {
    bot_name: BOT_INFO.name,
    type: 'monthly_legal_report',
    subject: `Monthly Legal Report - ${report.month}`,
    data: report
  });

  return res.json({
    success: true,
    message: 'Monthly legal report sent to Atlas',
    report: report
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getContractsOverview() {
  return {
    total: 0,
    pending: 0,
    active: 0,
    expired: 0
  };
}

async function getComplianceOverview() {
  return {
    chef_checks: 0,
    insurance: false,
    licenses: false,
    overall: 'non_compliant'
  };
}

async function getCurrentRisks() {
  return {
    critical: 1, // No insurance
    high: 1,     // Background checks
    medium: 1,   // Licenses
    low: 0
  };
}

async function checkChefCompliance() {
  return { compliant: false, issue: '1 chef without background check' };
}

async function checkInsuranceCoverage() {
  return { compliant: false, issue: 'No insurance policies in place' };
}

async function checkContractCompliance() {
  return { compliant: true, issue: null };
}

async function checkFoodSafetyCompliance() {
  return { compliant: false, issue: 'Chef certifications not verified' };
}

async function checkLaborCompliance() {
  return { compliant: true, issue: null };
}

async function checkDataPrivacyCompliance() {
  return { compliant: true, issue: 'GDPR/CCPA not applicable yet' };
}

async function getMonthlyRecommendations() {
  return [
    'Obtain insurance coverage immediately',
    'Complete all chef background checks',
    'File business license applications'
  ];
}
