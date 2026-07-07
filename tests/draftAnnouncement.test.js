import { describe, test, expect, vi, beforeEach } from 'vitest';
import { draftAnnouncement } from '../src/ai/draftAnnouncement.js';
import { validateInput } from '../src/utils/validateInput.js';
import * as groqClient from '../src/ai/groqClient.js';

// Mock the shared Groq client
vi.mock('../src/ai/groqClient.js', () => {
  return {
    getGroqChatCompletion: vi.fn(),
  };
});

describe('draftAnnouncement AI utility tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('successfully returns drafted announcement script on API success', async () => {
    const mockOutput =
      'Attention all spectators: Gate 3 is closed. Please proceed calmly to Gate 1.';
    vi.mocked(groqClient.getGroqChatCompletion).mockResolvedValueOnce(mockOutput);

    const result = await draftAnnouncement('Gate 3 closed, redirect to Gate 1');

    expect(result).toBe(mockOutput);
    expect(groqClient.getGroqChatCompletion).toHaveBeenCalledTimes(1);
  });

  test('returns fallback error message when Groq API call rejects/fails', async () => {
    vi.mocked(groqClient.getGroqChatCompletion).mockRejectedValueOnce(
      new Error('Groq Server Overload')
    );

    const result = await draftAnnouncement('Spill in Concourse Sector 2');

    expect(result).toBe('Could not draft announcement — please try again');
  });

  test('input validator rejects empty or whitespace-only inputs', () => {
    // Assert clean error throwing using validateInput pattern
    expect(() => validateInput('')).toThrow('Incident description cannot be empty.');
    expect(() => validateInput('   ')).toThrow('Incident description cannot be empty.');
  });

  test('draftAnnouncement throws error immediately on empty or whitespace inputs without making Groq calls', async () => {
    await expect(draftAnnouncement('')).rejects.toThrow('Situation description cannot be empty.');
    await expect(draftAnnouncement('    ')).rejects.toThrow(
      'Situation description cannot be empty.'
    );

    expect(groqClient.getGroqChatCompletion).not.toHaveBeenCalled();
  });
});
