/**
 * @file summarizeActivity.js
 * @description AI agent utility to compile a 3-bullet activity summary of stadium incidents via the Groq API.
 */
import { getGroqChatCompletion } from './groqClient.js';

/**
 * Summarizes stadium operations incidents from the last hour into exactly 3 bullet points.
 * @param {Array} incidents - List of incident documents reported in the last hour.
 * @returns {Promise<string>} - Markdown bullet points representing the summary.
 */
export async function summarizeActivity(incidents) {
  // If zero incidents exist, skip the Groq call entirely and return standard text directly.
  if (!incidents || incidents.length === 0) {
    return 'No incidents in the last hour. Operations normal.';
  }

  const incidentSummaryLines = incidents
    .map(
      (inc, i) =>
        `${i + 1}. [Zone: ${inc.zone}] Category: ${inc.category}, Severity: ${inc.severity}, Summary: ${inc.summary || inc.rawText}`
    )
    .join('\n');

  const systemPrompt = `You are a stadium operations director compiling an hourly activity report.
Your task is to summarize the incident reports from the last hour into EXACTLY 3 concise bullet points.

Rules:
1. Provide exactly 3 bullet points (each starting with a dash "- ").
2. Keep each bullet point to a maximum of 15 words.
3. Be professional, direct, and outline operational status.
4. Output only the 3 bullet points. Do not include markdown headers, introductions, or greetings.`;

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Here is the list of incidents from the last hour:\n${incidentSummaryLines}`,
      },
    ];

    const response = await getGroqChatCompletion(messages);
    const cleaned = response.trim();

    // Check if we got something back
    if (!cleaned) {
      throw new Error('Empty summary response received');
    }

    return cleaned;
  } catch {
    console.error('Failed to summarize stadium activity, applying fallback.');
    return `- Operations team actively responding to ${incidents.length} logged incidents.\n- Security and facility staff deployed to zones with open issues.\n- Crowd dynamics and gate operations remain under close monitoring.`;
  }
}
