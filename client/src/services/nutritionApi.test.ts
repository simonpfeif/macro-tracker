import { describe, it, expect } from 'vitest';
import { normalizeUSDA } from './nutritionApi';

function makeUSDAFood(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    dataType: 'SR Legacy',
    description: 'Test Food',
    foodNutrients: [],
    ...overrides,
  };
}

function makeNutrient(nutrientId: number, value: number) {
  return { nutrientId, value };
}

describe('normalizeUSDA', () => {
  it('branded food with servingSize/servingSizeUnit → correct serving string', () => {
    const food = makeUSDAFood({
      dataType: 'Branded',
      servingSize: 30,
      servingSizeUnit: 'g',
    });
    const result = normalizeUSDA(food);
    expect(result.servingSize).toBe('30g');
  });

  it('branded food with no servingSize → "100g" fallback', () => {
    const food = makeUSDAFood({ dataType: 'Branded' });
    const result = normalizeUSDA(food);
    expect(result.servingSize).toBe('100g');
  });

  it('SR Legacy food → always "100g"', () => {
    const food = makeUSDAFood({ dataType: 'SR Legacy', servingSize: 50, servingSizeUnit: 'g' });
    const result = normalizeUSDA(food);
    expect(result.servingSize).toBe('100g');
  });

  it('nutrient ID 1008 maps to calories', () => {
    const food = makeUSDAFood({
      foodNutrients: [makeNutrient(1008, 200)],
    });
    expect(normalizeUSDA(food).calories).toBe(200);
  });

  it('nutrient ID 1003 maps to protein', () => {
    const food = makeUSDAFood({
      foodNutrients: [makeNutrient(1003, 25.5)],
    });
    expect(normalizeUSDA(food).protein).toBe(25.5);
  });

  it('nutrient ID 1005 maps to carbs', () => {
    const food = makeUSDAFood({
      foodNutrients: [makeNutrient(1005, 30)],
    });
    expect(normalizeUSDA(food).carbs).toBe(30);
  });

  it('nutrient ID 1004 maps to fat', () => {
    const food = makeUSDAFood({
      foodNutrients: [makeNutrient(1004, 10)],
    });
    expect(normalizeUSDA(food).fat).toBe(10);
  });

  it('nutrient ID 1079 maps to fiber', () => {
    const food = makeUSDAFood({
      foodNutrients: [makeNutrient(1079, 5)],
    });
    expect(normalizeUSDA(food).fiber).toBe(5);
  });

  it('missing nutrient → 0 (not undefined/NaN)', () => {
    const food = makeUSDAFood({ foodNutrients: [] });
    const result = normalizeUSDA(food);
    expect(result.calories).toBe(0);
    expect(result.protein).toBe(0);
    expect(result.carbs).toBe(0);
    expect(result.fat).toBe(0);
    expect(result.fiber).toBe(0);
  });
});
