import { describe, it, expect } from 'vitest';
import {
  lbsToKg,
  kgToLbs,
  ftInToCm,
  cmToFtIn,
  calculateAge,
  calculateBMR,
  calculateTDEE,
  calculateMacros,
} from './macroCalculations';
import type { CalculatorInputs } from '@/types';

// ── Unit conversions ─────────────────────────────────────────────────────────

describe('lbsToKg', () => {
  it('converts 220 lbs to ~99.79 kg', () => {
    expect(lbsToKg(220)).toBeCloseTo(99.79, 1);
  });
  it('converts 0 lbs to 0 kg', () => {
    expect(lbsToKg(0)).toBe(0);
  });
});

describe('kgToLbs', () => {
  it('converts 100 kg to ~220.46 lbs', () => {
    expect(kgToLbs(100)).toBeCloseTo(220.46, 1);
  });
});

describe('lbsToKg / kgToLbs round-trip', () => {
  it('round-trips 180 lbs within 0.01 tolerance', () => {
    expect(kgToLbs(lbsToKg(180))).toBeCloseTo(180, 2);
  });
});

describe('ftInToCm', () => {
  it('converts 5ft 10in to ~177.8 cm', () => {
    expect(ftInToCm(5, 10)).toBeCloseTo(177.8, 1);
  });
  it('converts 6ft 0in to ~182.88 cm', () => {
    expect(ftInToCm(6, 0)).toBeCloseTo(182.88, 1);
  });
});

describe('cmToFtIn', () => {
  it('converts 177.8 cm to 5ft 10in', () => {
    const { feet, inches } = cmToFtIn(177.8);
    expect(feet).toBe(5);
    expect(inches).toBe(10);
  });
});

describe('ftInToCm / cmToFtIn round-trip', () => {
  it('round-trips 5ft 11in', () => {
    const cm = ftInToCm(5, 11);
    const { feet, inches } = cmToFtIn(cm);
    expect(feet).toBe(5);
    expect(inches).toBe(11);
  });
});

// ── calculateAge ─────────────────────────────────────────────────────────────

describe('calculateAge', () => {
  it('calculates age for someone born 30 years ago today', () => {
    const today = new Date();
    const birthday = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate());
    const birthdayStr = birthday.toISOString().split('T')[0];
    expect(calculateAge(birthdayStr)).toBe(30);
  });

  it('returns one year less if birthday has not yet occurred this year', () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth(); // 0-indexed
    const d = now.getDate();
    const pad = (n: number) => String(n).padStart(2, '0');
    // Use Dec 31 as future birthday (works unless today IS Dec 31)
    if (m === 11 && d === 31) {
      // Today is Dec 31: birthday Jan 1 has already occurred → age = 25
      expect(calculateAge(`${y - 25}-01-01`)).toBe(25);
    } else {
      // Dec 31 birthday hasn't occurred yet → age = 24
      const birthdayStr = `${y - 25}-12-31`;
      expect(calculateAge(birthdayStr)).toBe(24);
    }
  });

  it('counts today as birthday (full year)', () => {
    const today = new Date();
    const birthday = new Date(today.getFullYear() - 20, today.getMonth(), today.getDate());
    const birthdayStr = birthday.toISOString().split('T')[0];
    expect(calculateAge(birthdayStr)).toBe(20);
  });
});

// ── calculateBMR ─────────────────────────────────────────────────────────────

describe('calculateBMR', () => {
  it('calculates BMR for a 30yo male, 80kg, 180cm', () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    expect(calculateBMR(80, 180, 30, 'male')).toBe(1780);
  });

  it('calculates BMR for a 25yo female, 60kg, 165cm', () => {
    // 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25 -> 1345
    expect(calculateBMR(60, 165, 25, 'female')).toBe(1345);
  });
});

// ── calculateTDEE ─────────────────────────────────────────────────────────────

describe('calculateTDEE', () => {
  const bmr = 1780;
  const activityLevels = ['sedentary', 'light', 'moderate', 'active', 'very_active'] as const;

  it.each(activityLevels)('TDEE for %s is greater than BMR', (level) => {
    expect(calculateTDEE(bmr, level)).toBeGreaterThan(bmr);
  });
});

// ── calculateMacros (integration) ────────────────────────────────────────────

const BASE_INPUTS: CalculatorInputs = {
  weight: 180,
  weightUnit: 'lbs',
  heightUnit: 'ft_in',
  heightFeet: 5,
  heightInches: 10,
  age: 30,
  biologicalSex: 'male',
  activityLevel: 'moderate',
  goalType: 'maintenance',
  trainingFocus: 'health',
};

describe('calculateMacros', () => {
  it('loss goal produces calories < TDEE', () => {
    const result = calculateMacros({ ...BASE_INPUTS, goalType: 'loss' });
    expect(result.calories).toBeLessThan(result.tdee);
  });

  it('gain goal produces calories > TDEE', () => {
    const result = calculateMacros({ ...BASE_INPUTS, goalType: 'gain' });
    expect(result.calories).toBeGreaterThan(result.tdee);
  });

  it('maintenance goal produces calories === TDEE', () => {
    const result = calculateMacros({ ...BASE_INPUTS, goalType: 'maintenance' });
    expect(result.calories).toBe(result.tdee);
  });

  it('enforces minimum fat floor (0.3g per lb)', () => {
    // Use high protein scenario with low calories
    const result = calculateMacros({
      ...BASE_INPUTS,
      goalType: 'loss',
      trainingFocus: 'performance', // higher carb ratio → might squeeze fat
    });
    const minFat = Math.round(180 * 0.3);
    expect(result.fat).toBeGreaterThanOrEqual(minFat);
  });

  it('calculates fiber as 14g per 1000 cal for 2000 cal target', () => {
    // Find inputs that produce ~2000 cal
    const result = calculateMacros({
      ...BASE_INPUTS,
      weight: 130,
      weightUnit: 'lbs',
      activityLevel: 'sedentary',
      goalType: 'maintenance',
    });
    expect(result.fiber).toBe(Math.round((result.calories / 1000) * 14));
  });

  it('fiber scales with calories (spot check ~3000 cal)', () => {
    const result = calculateMacros({
      ...BASE_INPUTS,
      weight: 220,
      activityLevel: 'very_active',
      goalType: 'gain',
    });
    expect(result.fiber).toBe(Math.round((result.calories / 1000) * 14));
  });

  it('with body fat % uses LBM-based protein (differs from without)', () => {
    const withoutBF = calculateMacros({ ...BASE_INPUTS });
    const withBF = calculateMacros({ ...BASE_INPUTS, bodyFatPercent: 20 });
    // LBM at 20% BF: 180 * 0.8 = 144 lbs; maintenance multiplier 1.0 → 144g
    // Without BF: 180 * 0.85 = 153g
    expect(withBF.protein).not.toBe(withoutBF.protein);
  });
});
