import { describe, it, expect } from 'vitest';
import { hashFoods } from './mealHash';
import type { Food } from '@/types';

const makeFood = (overrides: Partial<Food> = {}): Food => ({
  name: 'Apple',
  protein: 0.3,
  carbs: 25,
  fat: 0.2,
  calories: 95,
  ...overrides,
});

describe('hashFoods', () => {
  it('empty array returns ""', () => {
    expect(hashFoods([])).toBe('');
  });

  it('same foods in different order produce the same hash (order independence)', () => {
    const a = makeFood({ name: 'Apple' });
    const b = makeFood({ name: 'Banana', protein: 1.3, carbs: 27, fat: 0.4, calories: 105 });
    expect(hashFoods([a, b])).toBe(hashFoods([b, a]));
  });

  it('identical arrays produce the same hash (determinism)', () => {
    const foods = [makeFood(), makeFood({ name: 'Banana', calories: 105 })];
    expect(hashFoods(foods)).toBe(hashFoods(foods));
  });

  it('changing one macro value produces a different hash', () => {
    const original = [makeFood()];
    const changed = [makeFood({ protein: 99 })];
    expect(hashFoods(original)).not.toBe(hashFoods(changed));
  });

  it('different foods produce different hashes', () => {
    const a = [makeFood({ name: 'Apple' })];
    const b = [makeFood({ name: 'Orange', calories: 80 })];
    expect(hashFoods(a)).not.toBe(hashFoods(b));
  });
});
