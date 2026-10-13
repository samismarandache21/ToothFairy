import { describe, it, expect } from 'vitest';
import { formatFullDate, formatTime } from './dateFormatter';

describe('formatFullDate', () => {
  it('formats a known Monday correctly', () => {
    // June 8 2026 is a Monday
    const d = new Date(2026, 5, 8);
    expect(formatFullDate(d)).toBe('Luni, 8 Iunie 2026');
  });

  it('formats Sunday correctly', () => {
    const d = new Date(2026, 5, 7); // Sunday
    expect(formatFullDate(d)).toBe('Duminică, 7 Iunie 2026');
  });

  it('formats Saturday correctly', () => {
    const d = new Date(2026, 5, 6); // Saturday
    expect(formatFullDate(d)).toBe('Sâmbătă, 6 Iunie 2026');
  });

  it('includes all months correctly', () => {
    const months = [
      'Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie',
      'Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie',
    ];
    months.forEach((month, i) => {
      const d = new Date(2026, i, 1);
      expect(formatFullDate(d)).toContain(month);
    });
  });

  it('uses current date when called without argument', () => {
    expect(() => formatFullDate()).not.toThrow();
    const result = formatFullDate();
    expect(typeof result).toBe('string');
    expect(result).toMatch(/^\w+, \d+ \w+ \d{4}$/);
  });

  it('includes the year', () => {
    const d = new Date(2026, 0, 1);
    expect(formatFullDate(d)).toContain('2026');
  });
});

describe('formatTime', () => {
  it('uses current time when called without argument', () => {
    expect(() => formatTime()).not.toThrow();
    const result = formatTime();
    expect(typeof result).toBe('string');
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });
});
