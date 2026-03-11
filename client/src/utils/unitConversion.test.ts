import { describe, it, expect } from 'vitest';
import { parseServingSize, convertWeight, getAlternateServing } from './unitConversion';

// ── parseServingSize ──────────────────────────────────────────────────────────

describe('parseServingSize', () => {
  it('parses "100g"', () => {
    expect(parseServingSize('100g')).toEqual({ amount: 100, unit: 'g' });
  });

  it('parses "3.5 oz" with space', () => {
    expect(parseServingSize('3.5 oz')).toEqual({ amount: 3.5, unit: 'oz' });
  });

  it('parses "30 g" with space', () => {
    expect(parseServingSize('30 g')).toEqual({ amount: 30, unit: 'g' });
  });

  it('parses uppercase "OZ"', () => {
    expect(parseServingSize('2OZ')).toEqual({ amount: 2, unit: 'oz' });
  });

  it('returns null for non-parseable string', () => {
    expect(parseServingSize('1 large')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseServingSize('')).toBeNull();
  });

  it('returns null for "2 slices (30g)"', () => {
    expect(parseServingSize('2 slices (30g)')).toBeNull();
  });
});

// ── convertWeight ─────────────────────────────────────────────────────────────

describe('convertWeight', () => {
  it('g→g identity', () => {
    expect(convertWeight(100, 'g', 'g')).toBe(100);
  });

  it('oz→oz identity', () => {
    expect(convertWeight(2, 'oz', 'oz')).toBe(2);
  });

  it('100g → oz ≈ 3.527', () => {
    expect(convertWeight(100, 'g', 'oz')).toBeCloseTo(3.527, 2);
  });

  it('1 oz → g ≈ 28.35', () => {
    expect(convertWeight(1, 'oz', 'g')).toBeCloseTo(28.35, 2);
  });

  it('round-trip g→oz→g within 0.01', () => {
    const oz = convertWeight(100, 'g', 'oz');
    expect(convertWeight(oz, 'oz', 'g')).toBeCloseTo(100, 2);
  });
});

// ── getAlternateServing ───────────────────────────────────────────────────────

describe('getAlternateServing', () => {
  it('"100g" → oz string', () => {
    const result = getAlternateServing('100g');
    expect(result).not.toBeNull();
    expect(result).toMatch(/oz$/);
  });

  it('"1 oz" → g string', () => {
    const result = getAlternateServing('1 oz');
    expect(result).not.toBeNull();
    expect(result).toMatch(/g$/);
  });

  it('returns null for unparseable serving', () => {
    expect(getAlternateServing('1 cup')).toBeNull();
  });
});
