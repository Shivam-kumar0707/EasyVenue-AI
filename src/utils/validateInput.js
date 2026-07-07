/**
 * Validates the raw incident description input.
 * Trims whitespace, rejects empty input, and enforces a 500-character limit.
 * @param {string} text - The raw text input to validate.
 * @returns {string} - The trimmed and validated text.
 * @throws {Error} - Standard error with descriptive message.
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

  return trimmed;
}
