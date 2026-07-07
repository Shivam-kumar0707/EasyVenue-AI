import { describe, test, expect, vi, beforeEach } from 'vitest';
import { classifyIncident } from '../src/ai/classifyIncident.js';
import * as groqClient from '../src/ai/groqClient.js';

// Mock the shared Groq client module
vi.mock('../src/ai/groqClient.js', () => {
  return {
    getGroqChatCompletion: vi.fn(),
  };
});

describe('classifyIncident AI utility tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('correctly parses and returns classified incident on successful Groq call', async () => {
    const mockJson = JSON.stringify({
      category: 'security',
      severity: 'high',
      summary: 'Unauthorized entry near Sector 5.',
    });

    vi.mocked(groqClient.getGroqChatCompletion).mockResolvedValueOnce(mockJson);

    const result = await classifyIncident('A person hopped the fence at block 5.');

    expect(groqClient.getGroqChatCompletion).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      category: 'security',
      severity: 'high',
      summary: 'Unauthorized entry near Sector 5.',
    });
  });

  test('returns fallback object when Groq API call rejects/fails', async () => {
    vi.mocked(groqClient.getGroqChatCompletion).mockRejectedValueOnce(new Error('API failure'));

    const result = await classifyIncident('Water leak near Block C.');

    expect(result).toEqual({
      category: 'unclassified',
      severity: 'medium',
      summary: 'Needs manual review',
    });
  });

  test('returns fallback object when Groq API returns malformed JSON', async () => {
    vi.mocked(groqClient.getGroqChatCompletion).mockResolvedValueOnce(
      '{"category": "facility", severity: undefined}'
    );

    const result = await classifyIncident('Water leak near Block C.');

    expect(result).toEqual({
      category: 'unclassified',
      severity: 'medium',
      summary: 'Needs manual review',
    });
  });
});
