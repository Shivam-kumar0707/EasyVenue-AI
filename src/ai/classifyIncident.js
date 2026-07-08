/**
 * @file classifyIncident.js
 * @description AI agent utility to classify operations incidents via the Groq API.
 */
import { getGroqChatCompletion } from './groqClient.js';
import { withAiFallback } from './aiHelpers.js';

const classificationCache = new Map();
const CACHE_TTL_MS = 120000; // 2 minutes

function normalizeText(text) {
  return text ? text.trim().toLowerCase().replace(/\s+/g, ' ') : '';
}

/**
 * Classifies raw incident text into category, severity, and summary using Groq.
 * @param {string} rawText - Raw text describing the incident.
 * @returns {Promise<{category: string, severity: string, summary: string}>}
 */
export async function classifyIncident(rawText) {
  if (!rawText || !rawText.trim()) {
    throw new Error('Incident description cannot be empty.');
  }

  const normalized = normalizeText(rawText);
  const now = Date.now();

  if (classificationCache.has(normalized)) {
    const entry = classificationCache.get(normalized);
    if (now - entry.timestamp < CACHE_TTL_MS) {
      return entry.result;
    }
  }

  const systemPrompt = `You are a stadium operations incident classifier for "EasyVenue AI".
Analyze the raw text description of an incident and classify it.
You MUST return a JSON object with exactly the following keys:
{
  "category": "crowd_control" | "medical" | "security" | "facility" | "lost_person",
  "severity": "low" | "medium" | "high",
  "summary": "one short sentence (max 10 words)"
}

Rules:
1. "category" must match one of the 5 options exactly.
2. "severity" must match one of the 3 options exactly.
3. Return ONLY the raw JSON object. Do not include markdown code blocks or conversational text.`;

  const result = await withAiFallback(
    async () => {
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Incident raw text: "${rawText}"` },
      ];

      // Request json_object from Groq API to ensure strict JSON output.
      const responseText = await getGroqChatCompletion(messages, {
        response_format: { type: 'json_object' },
      });

      const parsed = JSON.parse(responseText.trim());

      // Defensively check keys and validate values
      const categories = ['crowd_control', 'medical', 'security', 'facility', 'lost_person'];
      const severities = ['low', 'medium', 'high'];

      const category = categories.includes(parsed.category) ? parsed.category : 'unclassified';
      const severity = severities.includes(parsed.severity) ? parsed.severity : 'medium';
      const summary =
        typeof parsed.summary === 'string' && parsed.summary.trim().length > 0
          ? parsed.summary.trim()
          : 'Needs manual review';

      return { category, severity, summary };
    },
    {
      category: 'unclassified',
      severity: 'medium',
      summary: 'Needs manual review',
    },
    'Failed to classify incident, applying fallback.'
  );

  classificationCache.set(normalized, { result, timestamp: now });
  return result;
}
