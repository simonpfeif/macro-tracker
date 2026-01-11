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
import type { Meal, MealTemplate, Food } from "@/types";

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
