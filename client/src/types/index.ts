// Inline food data used in meals
export type Food = {
  name: string;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
};

// Stored food item in database (shared or custom)
export type FoodItem = {
  id: string;
  name: string;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  servingSize: string;
  category: string;
  source: "common" | "custom";
  createdAt: Date;
};

export type Meal = {
  id: string;
  name: string;
  foods: Food[];
  date: string; // YYYY-MM-DD format
  createdAt: Date;
};

export type MealTemplate = {
  id: string;
  name: string;
  foods: Food[];
  createdAt: Date;
};

// User profile types
export type SubscriptionTier = "free" | "premium";

export type UserProfile = {
  birthday?: string; // YYYY-MM-DD format
  subscriptionTier: SubscriptionTier;
  createdAt: Date;
  updatedAt: Date;
};

// Daily log status types
export type DailyLogStatus = "unlogged" | "started" | "complete";

export type DailyLog = {
  date: string; // YYYY-MM-DD (document ID)
  status: DailyLogStatus;
  updatedAt: Date;
};
