import type { Meal } from "./MacroForm";

type MealListProps = {
  meals: Meal[];
  onDeleteMeal: (index: number) => void;
};

export default function MealList({ meals, onDeleteMeal }: MealListProps) {
  if (meals.length === 0) {
    return (
      <div className="w-full max-w-2xl p-6 bg-white rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Today's Meals</h2>
        <p className="text-gray-500 text-center py-8">No meals logged yet. Create your first meal above!</p>
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
    <div className="w-full max-w-2xl p-6 bg-white rounded-2xl shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Today's Meals</h2>
      
      <div className="space-y-4">
        {meals.map((meal, mealIndex) => {
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
            <div key={mealIndex} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-800">{meal.name}</h3>
                <button
                  onClick={() => onDeleteMeal(mealIndex)}
                  className="text-red-500 hover:text-red-700 text-sm"
                  type="button"
                >
                  Delete
                </button>
              </div>
              
              <ul className="space-y-1 mb-3">
                {meal.foods.map((food, foodIndex) => (
                  <li key={foodIndex} className="text-sm text-gray-600 ml-4">
                    • {food.name} – P: {food.protein}g | C: {food.carbs}g | F: {food.fat}g | {food.calories} cal
                  </li>
                ))}
              </ul>
              
              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700">
                  Meal Total: {mealTotals.protein}g P / {mealTotals.carbs}g C / {mealTotals.fat}g F — {mealTotals.calories} cal
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
        <h3 className="font-semibold text-gray-800 mb-2">Daily Totals</h3>
        <p className="text-lg font-bold text-gray-900">
          {dailyTotals.protein}g P / {dailyTotals.carbs}g C / {dailyTotals.fat}g F — {dailyTotals.calories} cal
        </p>
      </div>
    </div>
  );
}

