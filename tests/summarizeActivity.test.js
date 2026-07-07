import { describe, test, expect, vi, beforeEach } from 'vitest';
import { summarizeActivity } from '../src/ai/summarizeActivity.js';
import * as groqClient from '../src/ai/groqClient.js';

// Mock the shared Groq client
vi.mock('../src/ai/groqClient.js', () => {
  return {
    getGroqChatCompletion: vi.fn(),
  };
});

describe('summarizeActivity AI utility tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('short-circuits and returns correct empty message when incidents list is empty or null', async () => {
    const resultNull = await summarizeActivity(null);
    const resultEmpty = await summarizeActivity([]);

    expect(resultNull).toBe('No incidents in the last hour. Operations normal.');
    expect(resultEmpty).toBe('No incidents in the last hour. Operations normal.');
    expect(groqClient.getGroqChatCompletion).not.toHaveBeenCalled();
  });

  test('successfully returns AI summary bullet points on API success', async () => {
    const mockOutput = `- Liquid spill in concourse B resolved.\n- Gate 2 congestion mitigated by redirecting fans.\n- Operations normal across all other gates.`;
    vi.mocked(groqClient.getGroqChatCompletion).mockResolvedValueOnce(mockOutput);

    const mockIncidents = [
      { zone: 'Gate 2', category: 'Crowd Size', severity: 'High', summary: 'Congestion' },
      { zone: 'Concourse B', category: 'Infrastructure', severity: 'Medium', summary: 'Liquid spill' }
    ];

    const result = await summarizeActivity(mockIncidents);

    expect(result).toBe(mockOutput);
    expect(groqClient.getGroqChatCompletion).toHaveBeenCalledTimes(1);
  });

  test('returns fallback bulletin board message when Groq API call fails', async () => {
    vi.mocked(groqClient.getGroqChatCompletion).mockRejectedValueOnce(new Error('Rate limit exceeded'));

    const mockIncidents = [
      { zone: 'Gate 2', category: 'Crowd Size', severity: 'High', summary: 'Congestion' }
    ];

    const result = await summarizeActivity(mockIncidents);

    // Verify it yields the fallback string containing the count of incidents (1)
    expect(result).toContain('- Operations team actively responding to 1 logged incidents.');
    expect(result).toContain('- Security and facility staff deployed to zones with open issues.');
    expect(result).toContain('- Crowd dynamics and gate operations remain under close monitoring.');
  });
});
