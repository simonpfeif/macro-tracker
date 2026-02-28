import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FoodForm from "./FoodForm";
import type { Food, FoodItem } from "@/types";
import styles from "./MacroForm.module.css";

export type NewMealInput = {
  name: string;
  foods: Food[];
};

type MealFormProps = {
  onAddMeal: (meal: NewMealInput) => void;
  availableFoods: FoodItem[];
  userId?: string;
};

export default function MacroForm({ onAddMeal, availableFoods, userId }: MealFormProps) {
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
    <div className={styles.card}>
      <h2 className={styles.title}>Create a Meal</h2>

      <div>
        <label className={styles.label}>
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

      <FoodForm onAddFood={addFood} foods={availableFoods} userId={userId} />

      {foods.length > 0 && (
        <div className={styles.foodsSection}>
          <h3 className={styles.foodsTitle}>Foods in this Meal:</h3>
          <ul className={styles.foodsList}>
            {foods.map((food, index) => (
              <li key={index} className={styles.foodItem}>
                <span>
                  {food.name} – P: {food.protein}g | C: {food.carbs}g | F: {food.fat}g | {food.calories} cal
                </span>
                <button
                  onClick={() => removeFood(index)}
                  className={styles.removeButton}
                  type="button"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>

          <div className={styles.totals}>
            <p className={styles.totalsText}>
              Total: {totals.protein}g P / {totals.carbs}g C / {totals.fat}g F — {totals.calories} cal
            </p>
          </div>
        </div>
      )}

      <Button className={styles.saveButton} onClick={handleSaveMeal} disabled={!mealName || foods.length === 0}>
        Save Meal
      </Button>
    </div>
  );
}