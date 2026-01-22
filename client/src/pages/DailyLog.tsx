import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { Meal, FoodItem, Food, UserProfile, DailyLogStatus } from "@/types";
import {
  saveMeal,
  getMealsByDate,
  deleteMeal,
  getTodayDate,
  getAllFoods,
  saveMealTemplate,
  getMealTemplates,
  getUserProfile,
  getDailyLog,
  setDailyLogStatus,
  getDateLimits,
} from "@/services/db";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from "@/components/Header/Header";
import DateNavigation from "@/components/Header/DateNavigation";
import MealSlot from "@/components/MealSlot";
import DailySummary from "@/components/DailySummary";
import styles from "./DailyLog.module.css";

export default function DailyLog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [availableFoods, setAvailableFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingMeal, setIsAddingMeal] = useState(false);
  const [newMealName, setNewMealName] = useState("");
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const [savedTemplateNames, setSavedTemplateNames] = useState<Set<string>>(new Set());
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [logStatus, setLogStatus] = useState<DailyLogStatus>("unlogged");

  const selectedDate = searchParams.get("date") || getTodayDate();
  const isToday = selectedDate === getTodayDate();

  // Calculate date limits based on user tier
  const dateLimits = getDateLimits(
    userProfile?.subscriptionTier || "free",
    userProfile?.birthday
  );

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

  const loadMealTemplates = useCallback(async () => {
    if (!user) return;
    try {
      const templates = await getMealTemplates(user.uid);
      const names = new Set(templates.map((t) => t.name));
      setSavedTemplateNames(names);
    } catch (error) {
      console.error("Error loading meal templates:", error);
    }
  }, [user]);

  useEffect(() => {
    loadMeals();
  }, [loadMeals]);

  useEffect(() => {
    loadFoods();
  }, [loadFoods]);

  useEffect(() => {
    loadMealTemplates();
  }, [loadMealTemplates]);

  // Load user profile
  const loadUserProfile = useCallback(async () => {
    if (!user) return;
    try {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  }, [user]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  // Load daily log status
  const loadDailyLogStatus = useCallback(async () => {
    if (!user) return;
    try {
      const log = await getDailyLog(user.uid, selectedDate);
      setLogStatus(log?.status || "unlogged");
    } catch (error) {
      console.error("Error loading daily log status:", error);
    }
  }, [user, selectedDate]);

  useEffect(() => {
    loadDailyLogStatus();
  }, [loadDailyLogStatus]);

  // Sync log status with meals: if meals with foods exist but status is unlogged, mark as started
  useEffect(() => {
    if (meals.length > 0 && logStatus === "unlogged" && user && !loading) {
      const hasFoods = meals.some((m) => m.foods.length > 0);
      if (hasFoods) {
        markAsStartedIfNeeded();
      }
    }
  }, [meals, logStatus, user, loading]);

  // Handler to mark log as complete
  const handleCompleteLog = async () => {
    if (!user) return;
    try {
      await setDailyLogStatus(user.uid, selectedDate, "complete");
      setLogStatus("complete");
    } catch (error) {
      console.error("Error completing log:", error);
    }
  };

  // Helper to set status to "started" if currently unlogged
  const markAsStartedIfNeeded = async () => {
    if (!user || logStatus !== "unlogged") return;
    try {
      await setDailyLogStatus(user.uid, selectedDate, "started");
      setLogStatus("started");
    } catch (error) {
      console.error("Error marking log as started:", error);
    }
  };

  // Get meal by ID or return undefined
  const getMealById = (id: string) => meals.find((m) => m.id === id);

  // Add food to a meal - optimistic update
  const handleAddFood = async (mealId: string, food: Food) => {
    if (!user) return;

    // Mark log as started if this is the first food being added
    const totalFoodsBeforeAdd = meals.reduce((sum, m) => sum + m.foods.length, 0);
    if (totalFoodsBeforeAdd === 0) {
      markAsStartedIfNeeded();
    }

    const existingMeal = getMealById(mealId);
    if (!existingMeal) return;

    const previousMeals = meals; // Save for rollback
    const updatedFoods = [...existingMeal.foods, food];

    // Optimistic: Update foods in UI immediately
    setMeals((prev) =>
      prev.map((m) =>
        m.id === existingMeal.id ? { ...m, foods: updatedFoods } : m
      )
    );

    // Database call in background
    try {
      await deleteMeal(user.uid, existingMeal.id);
      const newId = await saveMeal(user.uid, {
        name: existingMeal.name,
        foods: updatedFoods,
        date: selectedDate,
      });
      setMeals((prev) =>
        prev.map((m) =>
          m.id === existingMeal.id ? { ...m, id: newId } : m
        )
      );
    } catch (error) {
      console.error("Failed to add food:", error);
      setMeals(previousMeals); // Rollback on error
    }
  };

  // Remove food from a meal (optimistic update)
  const handleRemoveFood = async (mealId: string, foodIndex: number) => {
    if (!user) return;

    const existingMeal = getMealById(mealId);
    if (!existingMeal) return;

    const updatedFoods = existingMeal.foods.filter((_, i) => i !== foodIndex);
    const previousMeals = meals; // Save for rollback

    if (updatedFoods.length === 0) {
      // Optimistic: Remove meal from UI immediately
      setMeals((prev) => prev.filter((m) => m.id !== existingMeal.id));

      // Database call in background
      try {
        await deleteMeal(user.uid, existingMeal.id);
      } catch (error) {
        console.error("Failed to delete meal:", error);
        setMeals(previousMeals); // Rollback on error
      }
    } else {
      // Optimistic: Update foods in UI immediately
      setMeals((prev) =>
        prev.map((m) =>
          m.id === existingMeal.id ? { ...m, foods: updatedFoods } : m
        )
      );

      // Database call in background
      try {
        await deleteMeal(user.uid, existingMeal.id);
        const newId = await saveMeal(user.uid, {
          name: existingMeal.name,
          foods: updatedFoods,
          date: selectedDate,
        });
        // Update with real ID (silent, no visual change)
        setMeals((prev) =>
          prev.map((m) =>
            m.id === existingMeal.id ? { ...m, id: newId } : m
          )
        );
      } catch (error) {
        console.error("Failed to update meal:", error);
        setMeals(previousMeals); // Rollback on error
      }
    }
  };

  // Delete entire custom meal (optimistic update)
  const handleDeleteMeal = async (mealId: string) => {
    if (!user) return;

    const existingMeal = getMealById(mealId);
    if (!existingMeal) return;

    const previousMeals = meals; // Save for rollback

    // Optimistic: Remove meal from UI immediately
    setMeals((prev) => prev.filter((m) => m.id !== existingMeal.id));

    // Database call in background
    try {
      await deleteMeal(user.uid, existingMeal.id);
    } catch (error) {
      console.error("Failed to delete meal:", error);
      setMeals(previousMeals); // Rollback on error
    }
  };

  // Add custom meal
  const handleAddCustomMeal = async () => {
    if (!newMealName.trim() || !user) return;

    const tempId = `temp-${Date.now()}`;
    const trimmedName = newMealName.trim();

    // Optimistic: Add meal to UI immediately
    setMeals((prev) => [
      ...prev,
      { id: tempId, name: trimmedName, foods: [], date: selectedDate, createdAt: new Date() },
    ]);
    setIsAddingMeal(false);
    setNewMealName("");

    // Database call in background
    try {
      const realId = await saveMeal(user.uid, {
        name: trimmedName,
        foods: [],
        date: selectedDate,
      });
      setMeals((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, id: realId } : m))
      );
    } catch (error) {
      console.error("Failed to create meal:", error);
      setMeals((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  // Rename a meal
  const handleRenameMeal = async (mealId: string, newName: string) => {
    if (!user) return;

    const existingMeal = getMealById(mealId);
    if (!existingMeal) return;

    const previousMeals = meals;

    // Optimistic: Update name in UI immediately
    setMeals((prev) =>
      prev.map((m) =>
        m.id === existingMeal.id ? { ...m, name: newName } : m
      )
    );

    // Database call in background
    try {
      await deleteMeal(user.uid, existingMeal.id);
      const newId = await saveMeal(user.uid, {
        name: newName,
        foods: existingMeal.foods,
        date: selectedDate,
      });
      setMeals((prev) =>
        prev.map((m) =>
          m.id === existingMeal.id ? { ...m, id: newId } : m
        )
      );
    } catch (error) {
      console.error("Failed to rename meal:", error);
      setMeals(previousMeals);
    }
  };

  // Save meal as template
  const handleSaveAsTemplate = async (mealId: string) => {
    if (!user) return;

    const meal = getMealById(mealId);
    if (!meal || meal.foods.length === 0) return;

    const previousTemplateNames = savedTemplateNames;

    // Optimistic: Update UI immediately
    setSavedTemplateNames((prev) => new Set(prev).add(meal.name));
    setSavedToast(meal.name);
    setTimeout(() => setSavedToast(null), 2000);

    // Database call in background
    try {
      await saveMealTemplate(user.uid, {
        name: meal.name,
        foods: meal.foods,
      });
    } catch (error) {
      console.error("Failed to save template:", error);
      setSavedTemplateNames(previousTemplateNames);
    }
  };

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
    setSelectedDate(nextDate);
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
        centerContent={
          <DateNavigation
            selectedDate={selectedDate}
            isToday={isToday}
            formattedDate={formattedDate}
            onPrevDay={goToPrevDay}
            onNextDay={goToNextDay}
            minDate={dateLimits.minDate}
            maxDate={dateLimits.maxDate}
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
              {/* Meals */}
              {meals.map((meal) => (
                <MealSlot
                  key={meal.id}
                  name={meal.name}
                  foods={meal.foods}
                  availableFoods={availableFoods}
                  onAddFood={(food) => handleAddFood(meal.id, food)}
                  onRemoveFood={(index) => handleRemoveFood(meal.id, index)}
                  onDelete={() => handleDeleteMeal(meal.id)}
                  onRename={(newName) => handleRenameMeal(meal.id, newName)}
                  onSaveAsTemplate={() => handleSaveAsTemplate(meal.id)}
                  isSavedAsTemplate={savedTemplateNames.has(meal.name)}
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
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newMealName.trim()) {
                          handleAddCustomMeal();
                        }
                        if (e.key === "Escape") {
                          setIsAddingMeal(false);
                          setNewMealName("");
                        }
                      }}
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
                logStatus={logStatus}
                onCompleteLog={handleCompleteLog}
              />
            </div>
          </div>
        )}
      </main>

      {/* Toast notification */}
      {savedToast && (
        <div className={styles.toast}>
          Saved "{savedToast}" as template!
        </div>
      )}
    </div>
  );
}
