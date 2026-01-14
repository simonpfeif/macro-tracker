import { Button } from "@/components/ui/button";
import type { Meal } from "@/types";
import { getTodayDate } from "@/services/db";
import styles from "./MealList.module.css";

type MealListProps = {
  meals: Meal[];
  onDeleteMeal: (mealId: string) => void;
  onSaveAsTemplate: (meal: Meal) => void;
  selectedDate: string;
};

export default function MealList({
  meals,
  onDeleteMeal,
  onSaveAsTemplate,
  selectedDate,
}: MealListProps) {
  const isToday = selectedDate === getTodayDate();
  const dateLabel = isToday
    ? "Today's Meals"
    : `Meals for ${new Date(selectedDate + "T12:00:00").toLocaleDateString()}`;

  if (meals.length === 0) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>{dateLabel}</h2>
        <p className={styles.emptyState}>
          No meals logged{isToday ? " yet" : " for this day"}.
          {isToday && " Create your first meal!"}
        </p>
      </div>
    );
  }

  const dailyTotals = meals.reduce(
    (acc, meal) => {
      meal.foods.forEach((food) => {
        acc.protein += food.protein;
        acc.carbs += food.carbs;
        acc.fat += food.fat;
        acc.calories += food.calories;
      });
      return acc;
    },
    { protein: 0, carbs: 0, fat: 0, calories: 0 }
  );

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{dateLabel}</h2>

      <div className={styles.mealsList}>
        {meals.map((meal) => {
          const mealTotals = meal.foods.reduce(
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
            <div key={meal.id} className={styles.mealCard}>
              <div className={styles.mealHeader}>
                <h3 className={styles.mealName}>{meal.name}</h3>
                <div className={styles.mealActions}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSaveAsTemplate(meal)}
                    className={styles.saveButton}
                  >
                    Save
                  </Button>
                  <button
                    onClick={() => onDeleteMeal(meal.id)}
                    className={styles.deleteButton}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <ul className={styles.foodsList}>
                {meal.foods.map((food, foodIndex) => (
                  <li key={foodIndex} className={styles.foodItem}>
                    • {food.name} – P: {food.protein}g | C: {food.carbs}g | F:{" "}
                    {food.fat}g | {food.calories} cal
                  </li>
                ))}
              </ul>

              <div className={styles.mealTotal}>
                <p className={styles.mealTotalText}>
                  Meal Total: {mealTotals.protein}g P / {mealTotals.carbs}g C /{" "}
                  {mealTotals.fat}g F — {mealTotals.calories} cal
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.dailyTotals}>
        <h3 className={styles.dailyTotalsTitle}>Daily Totals</h3>
        <p className={styles.dailyTotalsValue}>
          {dailyTotals.protein}g P / {dailyTotals.carbs}g C / {dailyTotals.fat}g
          F — {dailyTotals.calories} cal
        </p>
      </div>
    </div>
  );
}
