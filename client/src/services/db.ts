import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  Meal,
  MealTemplate,
  Food,
  FoodItem,
  UserProfile,
  DailyLog,
  DailyLogStatus,
  SubscriptionTier,
} from "@/types";

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
    order: meal.order ?? Date.now(),
    createdAt: Timestamp.now(),
  });

  // Auto-set daily log to "started" when saving meal with foods
  if (meal.foods.length > 0) {
    ensureDailyLogStarted(userId, meal.date);
  }

  return docRef.id;
}

export async function getMealsByDate(
  userId: string,
  date: string
): Promise<Meal[]> {
  const mealsRef = collection(db, "users", userId, "meals");
  const q = query(
    mealsRef,
    where("date", "==", date)
  );
  const snapshot = await getDocs(q);

  const meals = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      foods: data.foods as Food[],
      date: data.date,
      order: data.order,
      createdAt: data.createdAt.toDate(),
    };
  });

  // Sort client-side: by order if exists, otherwise by createdAt
  return meals.sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

export async function deleteMeal(userId: string, mealId: string): Promise<void> {
  const mealRef = doc(db, "users", userId, "meals", mealId);
  await deleteDoc(mealRef);
}

export async function updateMealOrder(
  userId: string,
  mealId: string,
  order: number
): Promise<void> {
  const mealRef = doc(db, "users", userId, "meals", mealId);
  await setDoc(mealRef, { order }, { merge: true });
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

export async function getMealTemplateByName(
  userId: string,
  name: string
): Promise<MealTemplate | null> {
  const templatesRef = collection(db, "users", userId, "mealTemplates");
  const q = query(templatesRef, where("name", "==", name));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    foods: data.foods as Food[],
    createdAt: data.createdAt.toDate(),
  };
}

export async function updateMealTemplate(
  userId: string,
  templateId: string,
  template: Omit<MealTemplate, "id" | "createdAt">
): Promise<void> {
  const templateRef = doc(db, "users", userId, "mealTemplates", templateId);
  await setDoc(
    templateRef,
    {
      name: template.name,
      foods: template.foods,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
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

// ============ USER PROFILE ============

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const profileRef = doc(db, "users", userId, "profile", "main");
  const snapshot = await getDoc(profileRef);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();
  return {
    birthday: data.birthday,
    subscriptionTier: data.subscriptionTier || "free",
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
}

export async function saveUserProfile(
  userId: string,
  data: Partial<Omit<UserProfile, "createdAt" | "updatedAt">>
): Promise<void> {
  const profileRef = doc(db, "users", userId, "profile", "main");
  const existingProfile = await getDoc(profileRef);

  if (existingProfile.exists()) {
    await setDoc(
      profileRef,
      {
        ...data,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
  } else {
    await setDoc(profileRef, {
      subscriptionTier: "free",
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }
}

// ============ DAILY LOGS ============

export async function getDailyLog(
  userId: string,
  date: string
): Promise<DailyLog | null> {
  const logRef = doc(db, "users", userId, "dailyLogs", date);
  const snapshot = await getDoc(logRef);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();
  return {
    date: date,
    status: data.status || "unlogged",
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
}

export async function setDailyLogStatus(
  userId: string,
  date: string,
  status: DailyLogStatus
): Promise<void> {
  const logRef = doc(db, "users", userId, "dailyLogs", date);
  await setDoc(
    logRef,
    {
      date,
      status,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
}

export async function getDailyLogsForRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<DailyLog[]> {
  const logsRef = collection(db, "users", userId, "dailyLogs");
  const q = query(
    logsRef,
    where("date", ">=", startDate),
    where("date", "<=", endDate)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      date: doc.id,
      status: data.status || "unlogged",
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  });
}

async function ensureDailyLogStarted(userId: string, date: string): Promise<void> {
  const log = await getDailyLog(userId, date);
  if (!log || log.status === "unlogged") {
    await setDailyLogStatus(userId, date, "started");
  }
}

// ============ DATE LIMITS ============

function addDays(date: Date, days: number): string {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split("T")[0];
}

function subtractDays(date: Date, days: number): string {
  return addDays(date, -days);
}

function addYears(date: Date, years: number): string {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result.toISOString().split("T")[0];
}

export function getDateLimits(
  tier: SubscriptionTier,
  birthday?: string
): { minDate: string; maxDate: string } {
  const today = new Date();

  if (tier === "free") {
    // Free tier: 30 days past, 30 days future
    return {
      minDate: subtractDays(today, 30),
      maxDate: addDays(today, 30),
    };
  } else {
    // Premium: back to birthday (or 2020-01-01), 1 year future
    return {
      minDate: birthday || "2020-01-01",
      maxDate: addYears(today, 1),
    };
  }
}
