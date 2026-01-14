import {
  collection,
  doc,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Meal, MealTemplate, Food, FoodItem } from "@/types";

// Helper to get today's date in YYYY-MM-DD format
export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

// Helper to format date to YYYY-MM-DD
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// ============ MEALS ============

export async function saveMeal(
  userId: string,
  meal: Omit<Meal, "id" | "createdAt">
): Promise<string> {
  const mealsRef = collection(db, "users", userId, "meals");
  const docRef = await addDoc(mealsRef, {
    name: meal.name,
    foods: meal.foods,
    date: meal.date,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getMealsByDate(
  userId: string,
  date: string
): Promise<Meal[]> {
  const mealsRef = collection(db, "users", userId, "meals");
  const q = query(
    mealsRef,
    where("date", "==", date),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      foods: data.foods as Food[],
      date: data.date,
      createdAt: data.createdAt.toDate(),
    };
  });
}

export async function deleteMeal(userId: string, mealId: string): Promise<void> {
  const mealRef = doc(db, "users", userId, "meals", mealId);
  await deleteDoc(mealRef);
}

// ============ MEAL TEMPLATES ============

export async function saveMealTemplate(
  userId: string,
  template: Omit<MealTemplate, "id" | "createdAt">
): Promise<string> {
  const templatesRef = collection(db, "users", userId, "mealTemplates");
  const docRef = await addDoc(templatesRef, {
    name: template.name,
    foods: template.foods,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getMealTemplates(userId: string): Promise<MealTemplate[]> {
  const templatesRef = collection(db, "users", userId, "mealTemplates");
  const q = query(templatesRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      foods: data.foods as Food[],
      createdAt: data.createdAt.toDate(),
    };
  });
}

export async function deleteMealTemplate(
  userId: string,
  templateId: string
): Promise<void> {
  const templateRef = doc(db, "users", userId, "mealTemplates", templateId);
  await deleteDoc(templateRef);
}

// ============ FOODS ============

// Get all common foods (shared across all users)
export async function getCommonFoods(): Promise<FoodItem[]> {
  const foodsRef = collection(db, "foods");
  const q = query(foodsRef, orderBy("name", "asc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      protein: data.protein,
      carbs: data.carbs,
      fat: data.fat,
      calories: data.calories,
      servingSize: data.servingSize,
      category: data.category,
      source: "common" as const,
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  });
}

// Get user's custom foods
export async function getCustomFoods(userId: string): Promise<FoodItem[]> {
  const foodsRef = collection(db, "users", userId, "customFoods");
  const q = query(foodsRef, orderBy("name", "asc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      protein: data.protein,
      carbs: data.carbs,
      fat: data.fat,
      calories: data.calories,
      servingSize: data.servingSize,
      category: data.category,
      source: "custom" as const,
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  });
}

// Save a custom food for a user
export async function saveCustomFood(
  userId: string,
  food: Omit<FoodItem, "id" | "createdAt" | "source">
): Promise<string> {
  const foodsRef = collection(db, "users", userId, "customFoods");
  const docRef = await addDoc(foodsRef, {
    name: food.name,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
    calories: food.calories,
    servingSize: food.servingSize,
    category: food.category,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

// Delete a custom food
export async function deleteCustomFood(
  userId: string,
  foodId: string
): Promise<void> {
  const foodRef = doc(db, "users", userId, "customFoods", foodId);
  await deleteDoc(foodRef);
}

// Get all foods (common + custom) for a user
export async function getAllFoods(userId: string): Promise<FoodItem[]> {
  const [commonFoods, customFoods] = await Promise.all([
    getCommonFoods(),
    getCustomFoods(userId),
  ]);

  // Combine and sort by name
  return [...commonFoods, ...customFoods].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

// Search foods by name (client-side filtering for now)
export function searchFoods(foods: FoodItem[], query: string): FoodItem[] {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return foods;

  return foods.filter((food) =>
    food.name.toLowerCase().includes(lowerQuery)
  );
}

// Seed common foods (run once as admin)
export async function seedCommonFoods(
  foodsData: Array<{
    name: string;
    protein: number;
    carbs: number;
    fat: number;
    calories: number;
    servingSize: string;
    category: string;
  }>
): Promise<void> {
  const foodsRef = collection(db, "foods");

  for (const food of foodsData) {
    await addDoc(foodsRef, {
      name: food.name,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      calories: food.calories,
      servingSize: food.servingSize,
      category: food.category,
      createdAt: Timestamp.now(),
    });
  }
}
