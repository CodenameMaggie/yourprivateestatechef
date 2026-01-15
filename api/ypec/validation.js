// ============================================================================
// INPUT VALIDATION SCHEMAS
// Purpose: Validate user input using Joi
// ============================================================================

const Joi = require('joi');

// Login validation schema
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required'
  })
});

// Chef application validation schema
const chefApplicationSchema = Joi.object({
  firstName: Joi.string().min(2).max(100).required(),
  lastName: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[\d\s\-\+\(\)]+$/).required(),
  location: Joi.string().required(),
  yearsExperience: Joi.number().integer().min(0).max(50).required(),
  specialties: Joi.array().items(Joi.string()).min(1).required(),
  culinaryEducation: Joi.string().required(),
  previousPositions: Joi.string().allow(''),
  bio: Joi.string().min(50).max(1000).required(),
  backgroundConsent: Joi.boolean().valid(true).required(),
  termsConsent: Joi.boolean().valid(true).required(),
  files: Joi.object()
});

// Booking validation schema
const bookingSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[\d\s\-\+\(\)]+$/).required(),
  city: Joi.string().required(),
  householdSize: Joi.string().required(),
  serviceType: Joi.string().required(),
  frequency: Joi.string().required(),
  dietaryRestrictions: Joi.array().items(Joi.string()),
  additionalInfo: Joi.string().allow('').max(1000),
  preferredDate: Joi.date().iso(),
  locationRequested: Joi.boolean()
});

// Email validation (standalone)
const emailSchema = Joi.string().email().required();

// Phone validation (standalone)
const phoneSchema = Joi.string().pattern(/^[\d\s\-\+\(\)]+$/).required();

// UUID validation
const uuidSchema = Joi.string().guid({ version: 'uuidv4' }).required();

/**
 * Validate data against a schema
 * @param {object} data - Data to validate
 * @param {object} schema - Joi schema
 * @returns {object} - { error, value }
 */
function validate(data, schema) {
  return schema.validate(data, { abortEarly: false });
}

/**
 * Express middleware to validate request body
 * @param {object} schema - Joi schema
 * @returns {function} - Middleware function
 */
function validateRequest(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body.data || req.body, {
      abortEarly: false
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    // Replace request data with validated data
    if (req.body.data) {
      req.body.data = value;
    } else {
      req.body = value;
    }

    next();
  };
}

module.exports = {
  // Schemas
  loginSchema,
  chefApplicationSchema,
  bookingSchema,
  emailSchema,
  phoneSchema,
  uuidSchema,

  // Functions
  validate,
  validateRequest
};
