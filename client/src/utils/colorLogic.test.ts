import { describe, it, expect } from 'vitest';
import { getMacroColor, getProgressColor, getLimitColor } from './colorLogic';
import type { GoalType } from '@/types';

// ── getMacroColor boundary table ──────────────────────────────────────────────

type ColorResult = 'red' | 'yellow' | 'green';
type Row = { percent: number; loss: ColorResult; maintenance: ColorResult; gain: ColorResult };

const table: Row[] = [
  { percent: 49,  loss: 'red',   maintenance: 'red',    gain: 'red'   },
  { percent: 50,  loss: 'green', maintenance: 'yellow', gain: 'yellow' },
  { percent: 80,  loss: 'green', maintenance: 'green',  gain: 'green' },
  { percent: 100, loss: 'green', maintenance: 'green',  gain: 'green' },
  { percent: 101, loss: 'red',   maintenance: 'green',  gain: 'green' },
  { percent: 121, loss: 'red',   maintenance: 'yellow', gain: 'green' },
  { percent: 151, loss: 'red',   maintenance: 'red',    gain: 'red'   },
];

const goalTypes: GoalType[] = ['loss', 'maintenance', 'gain'];

describe('getMacroColor', () => {
  for (const row of table) {
    for (const gt of goalTypes) {
      it(`percent=${row.percent}, goalType=${gt} → ${row[gt]}`, () => {
        expect(getMacroColor(row.percent, gt)).toBe(row[gt]);
      });
    }
  }
});

// ── getProgressColor ──────────────────────────────────────────────────────────

describe('getProgressColor', () => {
  it('49 → red', () => expect(getProgressColor(49)).toBe('red'));
  it('50 → yellow', () => expect(getProgressColor(50)).toBe('yellow'));
  it('79 → yellow', () => expect(getProgressColor(79)).toBe('yellow'));
  it('80 → green', () => expect(getProgressColor(80)).toBe('green'));
  it('200 → green', () => expect(getProgressColor(200)).toBe('green'));
});

// ── getLimitColor ─────────────────────────────────────────────────────────────

describe('getLimitColor', () => {
  it('80 → green', () => expect(getLimitColor(80)).toBe('green'));
  it('81 → yellow', () => expect(getLimitColor(81)).toBe('yellow'));
  it('100 → yellow', () => expect(getLimitColor(100)).toBe('yellow'));
  it('101 → red', () => expect(getLimitColor(101)).toBe('red'));
});
