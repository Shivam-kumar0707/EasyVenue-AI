import { getGroqChatCompletion } from './groqClient.js';

/**
 * Prompts Groq to draft a calm, clear, reassuring PA announcement based on a situation description.
 *
 * @param {string} situation - Brief description of the stadium event situation.
 * @returns {Promise<string>} - The drafted announcement text, or a safe fallback message on failure.
 */
export async function draftAnnouncement(situation) {
  if (!situation || !situation.trim()) {
    throw new Error('Situation description cannot be empty.');
  }

  const systemPrompt = `You are a professional stadium operations PA announcer.
Draft a calm, clear, professional PA announcement for stadium staff or public broadcast based on this situation.

Rules:
1. Keep it strictly under 40 words.
2. Use a reassuring, calm tone. Avoid alarming or panic-inducing words.
3. Suitable to be read aloud verbatim over a PA speaker.
4. Output ONLY the announcement itself. Do not wrap in quotes or add intro/outro greetings.`;

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Situation details: "${situation}"` },
    ];

    const response = await getGroqChatCompletion(messages);
    const cleaned = response.trim().replace(/^["']|["']$/g, '');

    return cleaned || 'Could not draft announcement — please try again';
  } catch (error) {
    console.error('Failed to draft announcement, applying fallback.', error);
    return 'Could not draft announcement — please try again';
  }
}
