// ============================================================================
// YPEC LEAD UPLOAD ENDPOINT
// Purpose: Manual CSV/JSON upload for leads from LinkedIn, events, etc.
// ============================================================================

const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');


// Configure multer for file uploads
const upload = multer({ dest: '/tmp/ypec-uploads/' });

module.exports = async (req, res) => {
  // Handle file upload
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: 'File upload error', details: err.message });
    }

    try {
      const { source, validate_emails } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      console.log(`[YPEC-LeadUpload] Processing ${file.originalname} from ${source || 'unknown'}`);

      let leads = [];

      // Parse based on file type
      if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
        leads = await parseCSV(file.path);
      } else if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
        leads = await parseJSON(file.path);
      } else {
        // Clean up file
        fs.unlinkSync(file.path);
        return res.status(400).json({ error: 'Unsupported file type. Use CSV or JSON.' });
      }

      // Validate and store leads
      const results = await processLeads(leads, source || 'Manual Upload', validate_emails === 'true');

      // Clean up uploaded file
      fs.unlinkSync(file.path);

      return res.json({
        success: true,
        total_uploaded: leads.length,
        stored: results.stored,
        duplicates: results.duplicates,
        invalid: results.invalid,
        results
      });

    } catch (error) {
      console.error('[YPEC-LeadUpload] Error:', error);

      // Clean up file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(500).json({ error: error.message });
    }
  });
};

// ============================================================================
// PARSE CSV
// ============================================================================

async function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const leads = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // Normalize field names (case-insensitive)
        const normalized = {};
        Object.keys(row).forEach(key => {
          normalized[key.toLowerCase().trim()] = row[key];
        });

        // Map common CSV field names to our schema
        const lead = {
          name: normalized.name || normalized.full_name || normalized['first name'] + ' ' + normalized['last name'] || '',
          email: normalized.email || normalized['email address'] || '',
          phone: normalized.phone || normalized.mobile || normalized['phone number'] || null,
          city: normalized.city || normalized.location?.split(',')[0] || null,
          state: normalized.state || normalized.location?.split(',')[1]?.trim() || null,
          company: normalized.company || normalized.organization || null,
          title: normalized.title || normalized.position || null,
          message: normalized.notes || normalized.message || null,
          service_interest: normalized.service_interest || normalized.interest || 'Personal Chef',
          metadata: {
            linkedin_url: normalized.linkedin || normalized.profile || null,
            source_notes: normalized.source || null
          }
        };

        if (lead.name || lead.email) {
          leads.push(lead);
        }
      })
      .on('end', () => {
        console.log(`[YPEC-LeadUpload] Parsed ${leads.length} leads from CSV`);
        resolve(leads);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

// ============================================================================
// PARSE JSON
// ============================================================================

async function parseJSON(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Handle both array and object with leads array
  const leadsArray = Array.isArray(data) ? data : data.leads || [];

  return leadsArray.map(lead => ({
    name: lead.name || lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim(),
    email: lead.email || lead.email_address || '',
    phone: lead.phone || lead.mobile || lead.phone_number || null,
    city: lead.city || null,
    state: lead.state || null,
    company: lead.company || lead.organization || null,
    title: lead.title || lead.position || null,
    message: lead.notes || lead.message || null,
    service_interest: lead.service_interest || lead.interest || 'Personal Chef',
    metadata: {
      linkedin_url: lead.linkedin_url || lead.profile_url || null,
      source_notes: lead.source || null,
      ...lead.metadata
    }
  }));
}

// ============================================================================
// PROCESS LEADS
// ============================================================================

async function processLeads(leads, source, validateEmails) {
  let stored = 0;
  let duplicates = 0;
  let invalid = 0;

  const details = [];

  for (const lead of leads) {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!lead.email || !emailRegex.test(lead.email)) {
        invalid++;
        details.push({
          email: lead.email || 'missing',
          name: lead.name,
          status: 'invalid',
          reason: 'Invalid email format'
        });
        continue;
      }

      // Check for duplicate
      const { data: existing } = await getSupabase()
        .from('ypec_inquiries')
        .select('id')
        .eq('email', lead.email)
        .maybeSingle();

      if (existing) {
        duplicates++;
        details.push({
          email: lead.email,
          name: lead.name,
          status: 'duplicate',
          reason: 'Email already exists in database'
        });
        continue;
      }

      // Calculate lead quality
      const quality = calculateLeadQuality(lead);

      // Create inquiry
      const { error } = await getSupabase()
        .from('ypec_inquiries')
        .insert({
          email: lead.email,
          name: lead.name || 'Unknown',
          phone: lead.phone,
          city: lead.city,
          state: lead.state,
          message: lead.message || `Lead from ${source}`,
          service_interest: lead.service_interest,
          referral_source: source,
          status: 'new',
          lead_quality: quality,
          notes: JSON.stringify({
            uploaded_at: new Date().toISOString(),
            company: lead.company,
            title: lead.title,
            ...lead.metadata
          })
        });

      if (error) {
        console.error(`[YPEC-LeadUpload] Error storing lead:`, error);
        invalid++;
        details.push({
          email: lead.email,
          name: lead.name,
          status: 'error',
          reason: error.message
        });
      } else {
        stored++;
        details.push({
          email: lead.email,
          name: lead.name,
          status: 'success',
          quality
        });
        console.log(`[YPEC-LeadUpload] Stored lead: ${lead.email} (${quality})`);
      }

    } catch (error) {
      console.error(`[YPEC-LeadUpload] Error processing lead:`, error);
      invalid++;
    }
  }

  return {
    stored,
    duplicates,
    invalid,
    details
  };
}

// ============================================================================
// CALCULATE LEAD QUALITY
// ============================================================================

function calculateLeadQuality(lead) {
  let score = 0;

  // Has name
  if (lead.name && lead.name !== 'Unknown') score += 15;

  // Has phone number
  if (lead.phone) score += 20;

  // Has location data
  if (lead.city && lead.state) score += 25;

  // Has company/title (professional background)
  if (lead.company && lead.title) score += 20;

  // Has message/notes
  if (lead.message && lead.message.length > 20) score += 10;

  // Has specific service interest
  if (lead.service_interest && lead.service_interest !== 'Personal Chef') score += 10;

  // Scoring
  if (score >= 70) return 'hot';
  if (score >= 40) return 'warm';
  return 'cold';
}
