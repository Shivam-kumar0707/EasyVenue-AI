/**
 * @file groqClient.js
 * @description Configures and instantiates the shared Groq API client instance.
 */
import { Groq } from 'groq-sdk';

// This key is exposed client-side because this is a static frontend demo without a backend proxy. In production, this call should be routed through a backend/serverless function to keep the API key server-side and never exposed to the browser.
const apiKey = import.meta.env.VITE_GROQ_API_KEY;

if (!apiKey) {
  console.warn('Warning: VITE_GROQ_API_KEY is not defined in the environment.');
}

// dangerouslyAllowBrowser is required because this client-side demo runs in the browser.
export const groq = new Groq({
  apiKey: apiKey || '',
  dangerouslyAllowBrowser: true,
});

/**
 * Shared Groq API calling helper.
 * @param {Array} messages - Array of chat messages.
 * @param {Object} options - Custom configuration overrides (e.g., response_format).
 * @returns {Promise<string>}
 */
export async function getGroqChatCompletion(messages, options = {}) {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages,
    temperature: 0.1, // low temperature for consistent classification/reasoning
    ...options,
  });
  return response.choices[0]?.message?.content || '';
}
