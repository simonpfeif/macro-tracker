import type { FoodItem } from "@/types";

export type ExternalFood = Omit<FoodItem, "id" | "createdAt">;

export async function searchOpenFoodFacts(query: string): Promise<ExternalFood[]> {
  const url =
    `https://world.openfoodfacts.org/cgi/search.pl?action=process` +
    `&search_terms=${encodeURIComponent(query)}&json=1&page_size=8` +
    `&fields=product_name,nutriments,serving_size`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();

    return (data.products ?? [])
      .map((p: Record<string, unknown>) => {
        const n = (p.nutriments ?? {}) as Record<string, number>;
        return {
          name: ((p.product_name as string) ?? "").trim(),
          calories: Math.round(n["energy-kcal_100g"] ?? 0),
          protein: Math.round((n["proteins_100g"] ?? 0) * 10) / 10,
          carbs: Math.round((n["carbohydrates_100g"] ?? 0) * 10) / 10,
          fat: Math.round((n["fat_100g"] ?? 0) * 10) / 10,
          fiber: Math.round((n["fiber_100g"] ?? 0) * 10) / 10,
          servingSize: "100g",
          category: "Other",
          source: "custom" as const,
        };
      })
      .filter((f: ExternalFood) => f.name.length > 0 && f.calories > 0);
  } catch {
    return [];
  }
}
