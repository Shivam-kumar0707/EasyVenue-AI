import { describe, test, expect } from 'vitest';
import { validateInput } from '../src/utils/validateInput.js';

describe('validateInput utility tests', () => {
  test('rejects null and undefined inputs', () => {
    expect(() => validateInput(null)).toThrow('Incident description cannot be empty.');
    expect(() => validateInput(undefined)).toThrow('Incident description cannot be empty.');
  });

  test('rejects empty and whitespace-only strings', () => {
    expect(() => validateInput('')).toThrow('Incident description cannot be empty.');
    expect(() => validateInput('   ')).toThrow('Incident description cannot be empty.');
    expect(() => validateInput('\n \t')).toThrow('Incident description cannot be empty.');
  });

  test('rejects descriptions exceeding 500 characters', () => {
    const overlyLongText = 'A'.repeat(501);
    expect(() => validateInput(overlyLongText)).toThrow(
      'Incident description cannot exceed 500 characters.'
    );
  });

  test('accepts valid input and returns trimmed description', () => {
    const rawInput = '   Minor gate congestion at entry 2.   ';
    const result = validateInput(rawInput);
    expect(result).toBe('Minor gate congestion at entry 2.');
  });

  test('accepts exactly 500 characters', () => {
    const maxLengthText = 'A'.repeat(500);
    expect(validateInput(maxLengthText)).toBe(maxLengthText);
  });
});
