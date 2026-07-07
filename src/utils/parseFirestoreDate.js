/**
 * @file parseFirestoreDate.js
 * @description Utility to parse and safely convert Firestore Timestamps or date objects into JavaScript Date objects.
 */

/**
 * Safely converts a Firestore Timestamp or other date formats to a JavaScript Date object.
 *
 * @param {Object|Date|string|number} value - The raw timestamp or date value to parse.
 * @returns {Date} The parsed JavaScript Date object.
 */
export function parseFirestoreDate(value) {
  if (!value) {
    return new Date();
  }
  return typeof value.toDate === 'function' ? value.toDate() : new Date(value);
}

export default parseFirestoreDate;
