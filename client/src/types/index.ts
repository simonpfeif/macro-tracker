// Inline food data used in meals
export type Food = {
  name: string;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  foodId?: string; // Reference to original FoodItem for detail lookup
  // Optional micronutrients
  fiber?: number; // g
  saturatedFat?: number; // g
  transFat?: number; // g
  cholesterol?: number; // mg
  sodium?: number; // mg
  sugar?: number; // g
  addedSugar?: number; // g
  vitaminD?: number; // mcg
  calcium?: number; // mg
  iron?: number; // mg
  potassium?: number; // mg
};

// Stored food item in database (shared or custom)
export type FoodItem = {
  id: string;
  name: string;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  fiber?: number; // Optional for backwards compatibility
  servingSize: string;
  category: string;
  source: "common" | "custom";
  createdAt: Date;

  // Fat breakdown (optional micronutrients)
  saturatedFat?: number; // g
  transFat?: number; // g

  // Other
  cholesterol?: number; // mg
  sodium?: number; // mg

  // Carb breakdown
  sugar?: number; // g
  addedSugar?: number; // g

  // Vitamins & Minerals
  vitaminD?: number; // mcg
  calcium?: number; // mg
  iron?: number; // mg
  potassium?: number; // mg
};

export type Meal = {
  id: string;
  name: string;
  foods: Food[];
  date: string; // YYYY-MM-DD format
  order?: number;
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

// Serving size override for user customization
export type ServingSizeOverride = {
  foodId: string;
  foodName: string;
  customServingSize: string;
  updatedAt: Date;
};

// Goal types for progress bar coloring
export type GoalType = 'loss' | 'maintenance' | 'gain';

// Macro calculator types
export type BiologicalSex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type TrainingFocus = 'tone' | 'performance' | 'health';
export type WeightUnit = 'lbs' | 'kg';
export type HeightUnit = 'ft_in' | 'cm';

export type CalculatorInputs = {
  weight: number;
  weightUnit: WeightUnit;
  heightFeet?: number;
  heightInches?: number;
  heightCm?: number;
  heightUnit: HeightUnit;
  age: number;
  biologicalSex: BiologicalSex;
  activityLevel: ActivityLevel;
  goalType: GoalType;
  trainingFocus: TrainingFocus;
  bodyFatPercent?: number;
};

export type CalculatedMacros = {
  bmr: number;
  tdee: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};

export type UserGoals = {
  goalType: GoalType;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  // Micronutrient goals (optional, use defaults if not set)
  fiber?: number;
  saturatedFat?: number;
  transFat?: number;
  cholesterol?: number;
  sodium?: number;
  sugar?: number;
  addedSugar?: number;
  vitaminD?: number;
  calcium?: number;
  iron?: number;
  potassium?: number;
};
