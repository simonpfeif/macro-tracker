import { describe, it, expect } from 'vitest';
import { generateCalendarDays } from './calendarUtils';

describe('generateCalendarDays', () => {
  it('always returns exactly 42 items', () => {
    // Test several months
    const months = [
      new Date(2024, 0, 1),  // January 2024
      new Date(2024, 1, 1),  // February 2024 (leap year)
      new Date(2023, 1, 1),  // February 2023 (non-leap)
      new Date(2024, 11, 1), // December 2024
      new Date(2025, 2, 1),  // March 2025
    ];
    for (const month of months) {
      expect(generateCalendarDays(month)).toHaveLength(42);
    }
  });

  it('month starting on Sunday → no leading padding, first item isCurrentMonth and day=1', () => {
    // January 2023 starts on Sunday
    const days = generateCalendarDays(new Date(2023, 0, 1));
    expect(days[0].isCurrentMonth).toBe(true);
    expect(days[0].day).toBe(1);
  });

  it('month starting on Saturday → 6 leading padding items', () => {
    // June 2024 starts on Saturday (day 6)
    const days = generateCalendarDays(new Date(2024, 5, 1));
    const paddingCount = days.filter((d, i) => i < 6 && !d.isCurrentMonth).length;
    expect(paddingCount).toBe(6);
  });

  it('all current-month dates have isCurrentMonth: true', () => {
    const days = generateCalendarDays(new Date(2024, 2, 1)); // March 2024
    const currentMonthDays = days.filter((d) => d.isCurrentMonth);
    expect(currentMonthDays.every((d) => d.isCurrentMonth)).toBe(true);
    expect(currentMonthDays).toHaveLength(31); // March has 31 days
  });

  it('padding dates have isCurrentMonth: false', () => {
    const days = generateCalendarDays(new Date(2024, 2, 1)); // March 2024
    const paddingDays = days.filter((d) => !d.isCurrentMonth);
    expect(paddingDays.every((d) => !d.isCurrentMonth)).toBe(true);
  });

  it('all date strings match YYYY-MM-DD format', () => {
    const days = generateCalendarDays(new Date(2024, 5, 1));
    for (const { date } of days) {
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('December → January padding in next year', () => {
    const days = generateCalendarDays(new Date(2024, 11, 1)); // December 2024
    const nextMonthDays = days.filter((d) => !d.isCurrentMonth && days.indexOf(d) > 30);
    expect(nextMonthDays.some((d) => d.date.startsWith('2025'))).toBe(true);
  });

  it('February leap year 2024 → 29 current-month days', () => {
    const days = generateCalendarDays(new Date(2024, 1, 1));
    const currentMonth = days.filter((d) => d.isCurrentMonth);
    expect(currentMonth).toHaveLength(29);
  });

  it('February non-leap year → 28 current-month days', () => {
    const days = generateCalendarDays(new Date(2023, 1, 1));
    const currentMonth = days.filter((d) => d.isCurrentMonth);
    expect(currentMonth).toHaveLength(28);
  });
});
