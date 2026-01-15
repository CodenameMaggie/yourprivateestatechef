// ============================================================================
// SECURITY UTILITIES
// Purpose: Password hashing, token generation, and security helpers
// ============================================================================

const bcrypt = require('bcrypt');
const crypto = require('crypto');

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
async function hashPassword(password) {
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    return hash;
  } catch (error) {
    console.error('[Security] Password hashing error:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} - True if password matches
 */
async function verifyPassword(password, hash) {
  try {
    const isValid = await bcrypt.compare(password, hash);
    return isValid;
  } catch (error) {
    console.error('[Security] Password verification error:', error);
    return false;
  }
}

/**
 * Generate a cryptographically secure session token
 * @param {string} prefix - Token prefix (e.g., 'ypec_admin')
 * @returns {string} - Secure session token
 */
function generateSecureToken(prefix = 'ypec') {
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const timestamp = Date.now();
  return `${prefix}_${timestamp}_${randomBytes}`;
}

/**
 * Generate a password reset token
 * @returns {string} - Secure reset token
 */
function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a secure random string
 * @param {number} length - Length of random string
 * @returns {string} - Random string
 */
function generateRandomString(length = 32) {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
}

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - User input
 * @returns {string} - Sanitized input
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;

  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim();
}

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} - True if valid
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone format (flexible for international)
 * @param {string} phone - Phone number
 * @returns {boolean} - True if valid
 */
function isValidPhone(phone) {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  generateResetToken,
  generateRandomString,
  sanitizeInput,
  isValidEmail,
  isValidPhone
};
