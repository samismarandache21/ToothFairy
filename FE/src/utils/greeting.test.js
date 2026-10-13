import { describe, it, expect } from 'vitest';
import { getGreeting, getDoctorGreeting } from './greeting';

const hour = (h) => new Date(2026, 5, 8, h, 0, 0);

describe('getGreeting', () => {
  it('returns morning between 05:00 and 11:59', () => {
    for (const h of [5, 8, 11]) {
      const r = getGreeting(hour(h));
      expect(r.period).toBe('morning');
      expect(r.greeting).toBe('Bună dimineața');
      expect(r.emoji).toBe('☀️');
    }
  });

  it('returns afternoon between 12:00 and 17:59', () => {
    for (const h of [12, 14, 17]) {
      const r = getGreeting(hour(h));
      expect(r.period).toBe('afternoon');
      expect(r.greeting).toBe('Bună ziua');
      expect(r.emoji).toBe('🌤️');
    }
  });

  it('returns evening between 18:00 and 21:59', () => {
    for (const h of [18, 20, 21]) {
      const r = getGreeting(hour(h));
      expect(r.period).toBe('evening');
      expect(r.greeting).toBe('Bună seara');
      expect(r.emoji).toBe('🌙');
    }
  });

  it('returns night between 22:00 and 04:59', () => {
    for (const h of [22, 23, 0, 3, 4]) {
      const r = getGreeting(hour(h));
      expect(r.period).toBe('night');
      expect(r.greeting).toBe('Noapte bună');
      expect(r.emoji).toBe('🌟');
    }
  });

  it('uses current date when called without argument', () => {
    // Should not throw
    expect(() => getGreeting()).not.toThrow();
    const r = getGreeting();
    expect(r).toHaveProperty('greeting');
    expect(r).toHaveProperty('emoji');
    expect(r).toHaveProperty('period');
  });
});

describe('getDoctorGreeting', () => {
  it('includes doctor name in result', () => {
    const result = getDoctorGreeting('Popescu', hour(9));
    expect(result).toContain('Dr. Popescu');
  });

  it('includes appropriate greeting for morning', () => {
    const result = getDoctorGreeting('Ionescu', hour(8));
    expect(result).toContain('Bună dimineața');
  });

  it('includes appropriate greeting for afternoon', () => {
    const result = getDoctorGreeting('Marin', hour(14));
    expect(result).toContain('Bună ziua');
  });

  it('ends with exclamation mark', () => {
    const result = getDoctorGreeting('Test', hour(10));
    expect(result).toMatch(/!$/);
  });
});
