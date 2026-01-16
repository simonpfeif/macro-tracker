import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { Meal, FoodItem, Food } from "@/types";
import {
  saveMeal,
  getMealsByDate,
  deleteMeal,
  getTodayDate,
  getAllFoods,
} from "@/services/db";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from "@/components/Header/Header";
import DateNavigation from "@/components/Header/DateNavigation";
import MealSlot from "@/components/MealSlot";
import DailySummary from "@/components/DailySummary";
import styles from "./DailyLog.module.css";

const DEFAULT_MEALS = ["Breakfast", "Lunch", "Dinner"];

export default function DailyLog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [availableFoods, setAvailableFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingMeal, setIsAddingMeal] = useState(false);
  const [newMealName, setNewMealName] = useState("");

  const selectedDate = searchParams.get("date") || getTodayDate();
  const isToday = selectedDate === getTodayDate();

  const setSelectedDate = (date: string) => {
    if (date === getTodayDate()) {
      setSearchParams({});
    } else {
      setSearchParams({ date });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const loadMeals = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const fetchedMeals = await getMealsByDate(user.uid, selectedDate);
      setMeals(fetchedMeals);
    } catch (error) {
      console.error("Error loading meals:", error);
    } finally {
      setLoading(false);
    }
  }, [user, selectedDate]);

  const loadFoods = useCallback(async () => {
    if (!user) return;
    try {
      const foods = await getAllFoods(user.uid);
      setAvailableFoods(foods);
    } catch (error) {
      console.error("Error loading foods:", error);
    }
  }, [user]);

  useEffect(() => {
    loadMeals();
  }, [loadMeals]);

  useEffect(() => {
    loadFoods();
  }, [loadFoods]);

  // Get meal by name or return undefined
  const getMealByName = (name: string) => meals.find((m) => m.name === name);

  // Add food to a meal (create meal if doesn't exist)
  const handleAddFood = async (mealName: string, food: Food) => {
    if (!user) return;

    const existingMeal = getMealByName(mealName);

    if (existingMeal) {
      // Update existing meal
      const updatedFoods = [...existingMeal.foods, food];
      await deleteMeal(user.uid, existingMeal.id);
      const newId = await saveMeal(user.uid, {
        name: mealName,
        foods: updatedFoods,
        date: selectedDate,
      });
      setMeals((prev) =>
        prev.map((m) =>
          m.id === existingMeal.id
            ? { ...m, id: newId, foods: updatedFoods }
            : m
        )
      );
    } else {
      // Create new meal
      const newId = await saveMeal(user.uid, {
        name: mealName,
        foods: [food],
        date: selectedDate,
      });
      const newMeal: Meal = {
        id: newId,
        name: mealName,
        foods: [food],
        date: selectedDate,
        createdAt: new Date(),
      };
      setMeals((prev) => [...prev, newMeal]);
    }
  };

  // Remove food from a meal
  const handleRemoveFood = async (mealName: string, foodIndex: number) => {
    if (!user) return;

    const existingMeal = getMealByName(mealName);
    if (!existingMeal) return;

    const updatedFoods = existingMeal.foods.filter((_, i) => i !== foodIndex);

    if (updatedFoods.length === 0) {
      // Delete meal if no foods left
      await deleteMeal(user.uid, existingMeal.id);
      setMeals((prev) => prev.filter((m) => m.id !== existingMeal.id));
    } else {
      // Update meal
      await deleteMeal(user.uid, existingMeal.id);
      const newId = await saveMeal(user.uid, {
        name: mealName,
        foods: updatedFoods,
        date: selectedDate,
      });
      setMeals((prev) =>
        prev.map((m) =>
          m.id === existingMeal.id
            ? { ...m, id: newId, foods: updatedFoods }
            : m
        )
      );
    }
  };

  // Delete entire custom meal
  const handleDeleteMeal = async (mealName: string) => {
    if (!user) return;

    const existingMeal = getMealByName(mealName);
    if (!existingMeal) return;

    await deleteMeal(user.uid, existingMeal.id);
    setMeals((prev) => prev.filter((m) => m.id !== existingMeal.id));
  };

  // Add custom meal
  const handleAddCustomMeal = () => {
    if (!newMealName.trim()) return;
    // The meal will be created when user adds first food
    // For now, just close the input
    setIsAddingMeal(false);
    setNewMealName("");
  };

  // Get custom meals (meals that aren't Breakfast, Lunch, Dinner)
  const customMeals = meals.filter((m) => !DEFAULT_MEALS.includes(m.name));

  // Calculate daily totals
  const dailyTotals = meals.reduce(
    (acc, meal) => {
      meal.foods.forEach((food) => {
        acc.calories += food.calories;
        acc.protein += food.protein;
        acc.carbs += food.carbs;
        acc.fat += food.fat;
      });
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const goToPrevDay = () => {
    const date = new Date(selectedDate + "T12:00:00");
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const goToNextDay = () => {
    const date = new Date(selectedDate + "T12:00:00");
    date.setDate(date.getDate() + 1);
    const nextDate = date.toISOString().split("T")[0];
    if (nextDate <= getTodayDate()) {
      setSelectedDate(nextDate);
    }
  };

  const formattedDate = new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className={styles.page}>
      <Header
        currentPage="log"
        leftContent={
          <DateNavigation
            selectedDate={selectedDate}
            isToday={isToday}
            formattedDate={formattedDate}
            onPrevDay={goToPrevDay}
            onNextDay={goToNextDay}
          />
        }
      />

      {/* Main Content */}
      <main className={styles.main}>
        {loading ? (
          <div className={styles.loading}>Loading...</div>
        ) : (
          <div className={styles.content}>
            {/* Left Column - Meals (2/3) */}
            <div className={styles.mealsColumn}>
              {/* Default Meals */}
              {DEFAULT_MEALS.map((mealName) => {
                const meal = getMealByName(mealName);
                return (
                  <MealSlot
                    key={mealName}
                    name={mealName}
                    foods={meal?.foods || []}
                    availableFoods={availableFoods}
                    onAddFood={(food) => handleAddFood(mealName, food)}
                    onRemoveFood={(index) => handleRemoveFood(mealName, index)}
                  />
                );
              })}

              {/* Custom Meals */}
              {customMeals.map((meal) => (
                <MealSlot
                  key={meal.id}
                  name={meal.name}
                  foods={meal.foods}
                  availableFoods={availableFoods}
                  onAddFood={(food) => handleAddFood(meal.name, food)}
                  onRemoveFood={(index) => handleRemoveFood(meal.name, index)}
                  onDelete={() => handleDeleteMeal(meal.name)}
                  isCustom
                />
              ))}

              {/* Add Custom Meal */}
              {isAddingMeal ? (
                <div className={styles.addMealCard}>
                  <div className={styles.addMealForm}>
                    <Input
                      type="text"
                      placeholder="Meal name (e.g., Snack)"
                      value={newMealName}
                      onChange={(e) => setNewMealName(e.target.value)}
                      autoFocus
                    />
                    <Button onClick={handleAddCustomMeal} disabled={!newMealName.trim()}>
                      Add
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddingMeal(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingMeal(true)}
                  className={styles.addMealButton}
                >
                  <Plus className={styles.icon} />
                  Add Meal
                </button>
              )}
            </div>

            {/* Right Column - Daily Summary (1/3) */}
            <div className={styles.summaryColumn}>
              <DailySummary
                calories={dailyTotals.calories}
                protein={dailyTotals.protein}
                carbs={dailyTotals.carbs}
                fat={dailyTotals.fat}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
