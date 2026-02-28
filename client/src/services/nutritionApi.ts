import type { FoodItem } from "@/types";

export type ExternalFood = Omit<FoodItem, "id" | "createdAt">;

const USDA_KEY = import.meta.env.VITE_USDA_API_KEY ?? "";

function getNutrient(food: Record<string, unknown>, id: number): number {
  const nutrients = (food.foodNutrients ?? []) as Array<Record<string, unknown>>;
  const found = nutrients.find((n) => n.nutrientId === id);
  if (!found) return 0;
  return Math.round(((found.value as number) ?? 0) * 10) / 10;
}

function normalizeUSDA(food: Record<string, unknown>): ExternalFood {
  const isBranded = food.dataType === "Branded";
  const servingSize = isBranded && food.servingSize
    ? `${food.servingSize}${food.servingSizeUnit ?? "g"}`
    : "100g";

  return {
    name: ((food.description as string) ?? "").trim(),
    calories: Math.round(getNutrient(food, 1008)),
    protein: getNutrient(food, 1003),
    carbs: getNutrient(food, 1005),
    fat: getNutrient(food, 1004),
    fiber: getNutrient(food, 1079),
    servingSize,
    category: "Other",
    source: "custom" as const,
  };
}

export async function searchUSDA(query: string): Promise<ExternalFood[]> {
  if (!USDA_KEY) return [];
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search`
    + `?query=${encodeURIComponent(query)}`
    + `&api_key=${USDA_KEY}`
    + `&pageSize=8`
    + `&dataType=Branded,SR%20Legacy,Foundation`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.foods ?? []).map(normalizeUSDA).filter(
      (f: ExternalFood) => f.name.length > 0 && f.calories > 0
    );
  } catch { return []; }
}
