import { describe, test, expect, vi, beforeEach } from 'vitest';
import { checkAnomaly } from '../src/utils/checkAnomaly.js';
import { detectAnomaly } from '../src/ai/detectAnomaly.js';
import * as groqClient from '../src/ai/groqClient.js';

// Mock the shared Groq client
vi.mock('../src/ai/groqClient.js', () => {
  return {
    getGroqChatCompletion: vi.fn(),
  };
});

describe('Anomaly threshold checking tests', () => {
  test('returns isAnomaly: false when crowd level increase is exactly 30%', () => {
    const history = [40, 42, 45, 50];
    const current = 70; // min 40, spike = 30
    const result = checkAnomaly(history, current);

    expect(result.isAnomaly).toBe(false);
    expect(result.beforeValue).toBe(40);
    expect(result.spikeDiff).toBe(30);
  });

  test('returns isAnomaly: true when crowd level increase is greater than 30%', () => {
    const history = [30, 32, 35];
    const current = 61; // min 30, spike = 31 (>30)
    const result = checkAnomaly(history, current);

    expect(result.isAnomaly).toBe(true);
    expect(result.beforeValue).toBe(30);
    expect(result.spikeDiff).toBe(31);
  });

  test('handles empty history gracefully without flagging anomaly', () => {
    const result = checkAnomaly([], 50);
    expect(result.isAnomaly).toBe(false);
  });

  test('handles null history gracefully', () => {
    const result = checkAnomaly(null, 45);
    expect(result.isAnomaly).toBe(false);
  });
});

describe('Anomaly recommendation generation tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('successfully retrieves recommendation and enforces 15-word maximum limit', async () => {
    // 19 words recommendation (exceeding limit)
    const mockOutput =
      'Open all emergency exit pathways and dispatch 5 stewards to Gate 3 immediately to release severe crowd congestion pressure';
    vi.mocked(groqClient.getGroqChatCompletion).mockResolvedValueOnce(mockOutput);

    const result = await detectAnomaly('Gate 3', 40, 75);

    const wordCount = result.split(/\s+/).length;
    expect(wordCount).toBeLessThanOrEqual(15);
    expect(groqClient.getGroqChatCompletion).toHaveBeenCalledTimes(1);
  });

  test('returns default fallback recommendation on Groq API call failure', async () => {
    vi.mocked(groqClient.getGroqChatCompletion).mockRejectedValueOnce(
      new Error('Rate limit exceeded')
    );

    const result = await detectAnomaly('Food Court', 35, 70);

    expect(result).toBe('Deploy staff to monitor the zone and manage crowd flow.');
  });
});
