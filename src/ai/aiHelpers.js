/**
 * @file aiHelpers.js
 * @description Shared AI utilities and error handling wrappers for Groq AI calls.
 */

/**
 * Shared wrapper function that wraps an AI function with error logging and a fallback value.
 *
 * @template T
 * @param {function(): Promise<T>} apiCallFn - The function containing the Groq API call logic.
 * @param {T} fallbackValue - The fallback value to return if the call fails.
 * @param {string} errorLogMsg - The message to log to console.error on failure.
 * @returns {Promise<T>} - Resolves with the result of apiCallFn or the fallbackValue.
 */
export async function withAiFallback(apiCallFn, fallbackValue, errorLogMsg) {
  try {
    return await apiCallFn();
  } catch (error) {
    if (errorLogMsg) {
      console.error(errorLogMsg);
    }
    return fallbackValue;
  }
}
