import { Groq } from 'groq-sdk';

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
