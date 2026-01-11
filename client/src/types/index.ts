export type Food = {
  name: string;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
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
