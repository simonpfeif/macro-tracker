import type { Food } from "@/types";

/**
 * Fast djb2 hash algorithm for generating content hashes
 */
function djb2Hash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

/**
 * Generate a hash from an array of foods for comparison purposes.
 * Sorts foods by name to ensure consistent hashing regardless of order.
 */
export function hashFoods(foods: Food[]): string {
  if (foods.length === 0) return "";

  // Sort foods by name for consistency, then stringify
  const sortedFoods = [...foods].sort((a, b) => a.name.localeCompare(b.name));
  const foodString = sortedFoods
    .map((f) => `${f.name}:${f.protein}:${f.carbs}:${f.fat}:${f.calories}`)
    .join("|");

  return djb2Hash(foodString);
}
