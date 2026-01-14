import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FoodForm from "./FoodForm";
import type { Food, FoodItem } from "@/types";

export type NewMealInput = {
  name: string;
  foods: Food[];
};

type MealFormProps = {
  onAddMeal: (meal: NewMealInput) => void;
  availableFoods: FoodItem[];
};

export default function MacroForm({ onAddMeal, availableFoods }: MealFormProps) {
  const [mealName, setMealName] = useState("");
  const [foods, setFoods] = useState<Food[]>([]);

  const addFood = (food: Food) => {
    setFoods((prev) => [...prev, food]);
  };

  const handleSaveMeal = () => {
    if (!mealName || foods.length === 0) return;

    const newMeal: NewMealInput = {
      name: mealName,
      foods,
    };

    onAddMeal(newMeal);

    setMealName("");
    setFoods([]);
  };

  const removeFood = (index: number) => {
    setFoods((prev) => prev.filter((_, i) => i !== index));
  };

  const totals = foods.reduce(
    (acc, food) => {
      acc.protein += food.protein;
      acc.carbs += food.carbs;
      acc.fat += food.fat;
      acc.calories += food.calories;
      return acc;
    },
    { protein: 0, carbs: 0, fat: 0, calories: 0 }
  );

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 max-w-md mx-auto mt-6 space-y-4">
      <h2 className="text-xl font-semibold text-gray-700 text-center">Create a Meal</h2>

      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">
          Meal Name
        </label>
        <Input
          type="text"
          placeholder="e.g. Breakfast"
          value={mealName}
          onChange={(e) => setMealName(e.target.value)}
          required
        />
      </div>

      <FoodForm onAddFood={addFood} foods={availableFoods} />

      {foods.length > 0 && (
        <div className="mt-4">
          <h3 className="font-medium text-gray-700 mb-2">Foods in this Meal:</h3>
          <ul className="space-y-2">
            {foods.map((food, index) => (
              <li key={index} className="flex justify-between items-center text-sm text-gray-600 bg-gray-50 p-2 rounded">
                <span>
                  {food.name} – P: {food.protein}g | C: {food.carbs}g | F: {food.fat}g | {food.calories} cal
                </span>
                <button
                  onClick={() => removeFood(index)}
                  className="text-red-500 hover:text-red-700 ml-2"
                  type="button"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="font-semibold text-gray-800">
              Total: {totals.protein}g P / {totals.carbs}g C / {totals.fat}g F — {totals.calories} cal
            </p>
          </div>
        </div>
      )}

      <Button className="w-full mt-4" onClick={handleSaveMeal} disabled={!mealName || foods.length === 0}>
        Save Meal
      </Button>
    </div>
  );
}