// Conversion constant: 1 oz = 28.35g
const GRAMS_PER_OZ = 28.35;

export interface ParsedServing {
  amount: number;
  unit: string;
}

/**
 * Parse a serving size string like "100g" into { amount: 100, unit: 'g' }
 * Returns null if the format isn't recognized
 */
export function parseServingSize(servingSize: string): ParsedServing | null {
  // Match patterns like "100g", "3.5 oz", "30 g"
  const match = servingSize.match(/^(\d+(?:\.\d+)?)\s*(g|oz)$/i);
  if (!match) {
    return null;
  }
  return {
    amount: parseFloat(match[1]),
    unit: match[2].toLowerCase(),
  };
}

/**
 * Convert weight between grams and ounces
 */
export function convertWeight(
  amount: number,
  fromUnit: "g" | "oz",
  toUnit: "g" | "oz"
): number {
  if (fromUnit === toUnit) {
    return amount;
  }
  if (fromUnit === "g" && toUnit === "oz") {
    return amount / GRAMS_PER_OZ;
  }
  // oz to g
  return amount * GRAMS_PER_OZ;
}

/**
 * Check if a serving size can be toggled between g and oz
 * Only works for pure weight-based servings (e.g., "100g", "2 oz")
 * Returns false for servings like "1 large", "2 slices (30g)", etc.
 */
export function canToggleUnit(servingSize: string): boolean {
  return parseServingSize(servingSize) !== null;
}

/**
 * Get the alternate display for a weight-based serving
 * "100g" -> "3.5 oz", "2 oz" -> "57g"
 * Returns null if the serving can't be toggled
 */
export function getAlternateServing(servingSize: string): string | null {
  const parsed = parseServingSize(servingSize);
  if (!parsed) {
    return null;
  }

  const targetUnit = parsed.unit === "g" ? "oz" : "g";
  const convertedAmount = convertWeight(
    parsed.amount,
    parsed.unit as "g" | "oz",
    targetUnit
  );

  // Format with appropriate precision
  const formatted =
    targetUnit === "oz"
      ? convertedAmount.toFixed(1)
      : Math.round(convertedAmount).toString();

  return `${formatted}${targetUnit}`;
}
