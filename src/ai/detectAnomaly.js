/**
 * @file detectAnomaly.js
 * @description AI agent utility to generate safety recommendations for crowd level anomalies via the Groq API.
 */
import { getGroqChatCompletion } from './groqClient.js';

const anomalyCache = new Map();
const CACHE_TTL_MS = 120000; // 2 minutes
const FALLBACK_RECOMMENDATION = 'Deploy staff to monitor the zone and manage crowd flow.';

/**
 * Generates a short, actionable recommendation for a zone experiencing a crowd level spike.
 * @param {string} zoneName - Name of the zone (e.g. Gate 1).
 * @param {number} beforeValue - The crowd percentage before the spike.
 * @param {number} afterValue - The crowd percentage after the spike.
 * @returns {Promise<string>} - Actionable recommendation (max 15 words).
 */
export async function detectAnomaly(zoneName, beforeValue, afterValue) {
  if (!zoneName || typeof beforeValue !== 'number' || typeof afterValue !== 'number') {
    throw new Error('Invalid parameters for anomaly detection.');
  }

  const cacheKey = `${zoneName}_${beforeValue}_${afterValue}`;
  const now = Date.now();

  if (anomalyCache.has(cacheKey)) {
    const entry = anomalyCache.get(cacheKey);
    if (now - entry.timestamp < CACHE_TTL_MS) {
      return entry.result;
    }
  }

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

    const result = cleaned || FALLBACK_RECOMMENDATION;
    anomalyCache.set(cacheKey, { result, timestamp: now });
    return result;
  } catch {
    console.error('Failed to get anomaly recommendation, applying fallback.');
    anomalyCache.set(cacheKey, { result: FALLBACK_RECOMMENDATION, timestamp: now });
    return FALLBACK_RECOMMENDATION;
  }
}
