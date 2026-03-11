import { describe, it, expect } from 'vitest';
import { getMondayOfWeek, formatDateStr } from './dateUtils';

describe('getMondayOfWeek', () => {
  it('Sunday → preceding Monday', () => {
    const sunday = new Date(2024, 0, 7); // Jan 7 2024 = Sunday
    const monday = getMondayOfWeek(sunday);
    expect(monday.getDay()).toBe(1);
    expect(monday.getDate()).toBe(1); // Jan 1 2024 = Monday
  });

  it('Monday → same day', () => {
    const monday = new Date(2024, 0, 1); // Jan 1 2024 = Monday
    const result = getMondayOfWeek(monday);
    expect(result.getDay()).toBe(1);
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(1);
  });

  it('Friday → same week Monday', () => {
    const friday = new Date(2024, 0, 5); // Jan 5 2024 = Friday
    const result = getMondayOfWeek(friday);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(1); // Jan 1 2024 = Monday
  });

  it('result always has getDay() === 1', () => {
    // Test a range of days
    for (let i = 0; i < 14; i++) {
      const date = new Date(2024, 2, 1 + i);
      expect(getMondayOfWeek(date).getDay()).toBe(1);
    }
  });
});

describe('formatDateStr', () => {
  it('formats a Date to YYYY-MM-DD', () => {
    // Note: toISOString() uses UTC, so we use a UTC date to avoid timezone drift
    const date = new Date('2024-03-15T12:00:00.000Z');
    const result = formatDateStr(date);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('documents UTC behavior: date at midnight UTC gives expected string', () => {
    const date = new Date('2024-06-01T00:00:00.000Z');
    expect(formatDateStr(date)).toBe('2024-06-01');
  });
});
