/**
 * @file validateInput.js
 * @description Utility to sanitize and validate raw text inputs to prevent XSS.
 */
/**
 * Safely sanitizes user text to prevent basic XSS by stripping HTML tags and escaping special characters.
 *
 * @param {string} text - The raw input text.
 * @returns {string} - Sanitized/escaped text.
 */
export function sanitizeInput(text) {
  if (!text) return '';
  // Strip HTML/Script tags using regex
  const stripped = text.replace(/<[^>]*>/g, '');
  // Escape key HTML control characters
  return stripped
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validates the raw input description.
 * Trims whitespace, rejects empty input, enforces limits, rejects suspicious XSS vectors,
 * and returns the sanitized/escaped safe text.
 *
 * @param {string} text - The raw text input.
 * @returns {string} - The sanitized and validated text.
 * @throws {Error} - Rejection message.
 */
export function validateInput(text) {
  if (text === undefined || text === null) {
    throw new Error('Incident description cannot be empty.');
  }

  if (typeof text !== 'string') {
    throw new Error('Input must be a string.');
  }

  const trimmed = text.trim();

  if (trimmed === '') {
    throw new Error('Incident description cannot be empty.');
  }

  if (trimmed.length > 500) {
    throw new Error('Incident description cannot exceed 500 characters.');
  }

  // Reject explicitly malicious script contexts
  if (/<script|javascript:|onerror=|onload=/i.test(trimmed)) {
    throw new Error('Suspicious characters or HTML tags are not allowed.');
  }

  return sanitizeInput(trimmed);
}
