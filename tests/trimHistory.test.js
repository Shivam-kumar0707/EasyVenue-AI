/**
 * @file trimHistory.test.js
 * @description Unit tests for pruning/filtering old historical crowd level database readings in trimHistory.js.
 */
import { describe, test, expect } from 'vitest';
import { trimOldHistory } from '../src/utils/trimHistory.js';

describe('trimOldHistory utility tests', () => {
  test('correctly trims history items older than 30 minutes', () => {
    const baseTime = new Date('2026-07-07T10:00:00Z');
    const cutoffTime = new Date(baseTime.getTime() - 30 * 60 * 1000); // 09:30:00Z

    const sampleHistory = [
      { crowdLevel: 10, timestamp: new Date(baseTime.getTime() - 45 * 60 * 1000) }, // 09:15:00 (prune)
      { crowdLevel: 20, timestamp: new Date(baseTime.getTime() - 31 * 60 * 1000) }, // 09:29:00 (prune)
      { crowdLevel: 30, timestamp: new Date(baseTime.getTime() - 30 * 60 * 1000) }, // 09:30:00 (keep)
      { crowdLevel: 45, timestamp: new Date(baseTime.getTime() - 15 * 60 * 1000) }, // 09:45:00 (keep)
      { crowdLevel: 60, timestamp: baseTime }, // 10:00:00 (keep)
    ];

    const trimmed = trimOldHistory(sampleHistory, cutoffTime);

    expect(trimmed).toHaveLength(3);
    expect(trimmed[0].crowdLevel).toBe(30);
    expect(trimmed[1].crowdLevel).toBe(45);
    expect(trimmed[2].crowdLevel).toBe(60);
  });

  test('returns empty array when history list is undefined or empty', () => {
    const cutoff = new Date();
    expect(trimOldHistory(null, cutoff)).toEqual([]);
    expect(trimOldHistory([], cutoff)).toEqual([]);
  });

  test('handles numeric timestamps correctly', () => {
    const baseMs = Date.now();
    const cutoffTime = new Date(baseMs - 30 * 60 * 1000);

    const sampleHistory = [
      { crowdLevel: 15, timestamp: baseMs - 40 * 60 * 1000 }, // prune
      { crowdLevel: 55, timestamp: baseMs - 5 * 60 * 1000 }, // keep
    ];

    const trimmed = trimOldHistory(sampleHistory, cutoffTime);
    expect(trimmed).toHaveLength(1);
    expect(trimmed[0].crowdLevel).toBe(55);
  });
});
