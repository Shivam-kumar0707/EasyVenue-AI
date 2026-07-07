/**
 * @file detectAnomaly.js
 * @description AI agent utility to generate safety recommendations for crowd level anomalies via the Groq API.
 */
import { getGroqChatCompletion } from './groqClient.js';

/**
 * Generates a short, actionable recommendation for a zone experiencing a crowd level spike.
 * @param {string} zoneName - Name of the zone (e.g. Gate 1).
 * @param {number} beforeValue - The crowd percentage before the spike.
 * @param {number} afterValue - The crowd percentage after the spike.
 * @returns {Promise<string>} - Actionable recommendation (max 15 words).
 */
export async function detectAnomaly(zoneName, beforeValue, afterValue) {
  const systemPrompt = `You are a stadium crowd safety officer. A sudden crowd level spike was detected.
Zone: ${zoneName}
Crowd Level jumped from ${beforeValue}% to ${afterValue}%.

Provide exactly ONE highly actionable recommendation for stadium operations staff.
Rules:
1. Must be maximum 15 words.
2. Must be actionable (e.g., "Deploy additional stewards to Gate 1 immediately" or "Open secondary exit doors to ease flow").
3. Do not use quotes or prefix text. Output only the recommendation.`;

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Analyze surge from ${beforeValue}% to ${afterValue}% at ${zoneName}.`,
      },
    ];

    const recommendation = await getGroqChatCompletion(messages);
    let cleaned = recommendation.trim().replace(/^["']|["']$/g, ''); // Remove outer quotes if returned

    // Check word count and ensure strict compliance
    const words = cleaned.split(/\s+/);
    if (words.length > 15) {
      cleaned = words.slice(0, 15).join(' ');
    }

    return cleaned || 'Deploy staff to monitor the zone and manage crowd flow.';
  } catch {
    console.error('Failed to get anomaly recommendation, applying fallback.');
    return 'Deploy staff to monitor the zone and manage crowd flow.';
  }
}
