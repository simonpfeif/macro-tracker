import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { Meal, FoodItem, Food, UserProfile, DailyLogStatus } from "@/types";
import { DndContext, closestCenter } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import {
  saveMeal,
  getMealsByDate,
  deleteMeal,
  updateMealOrder,
  getTodayDate,
  getAllFoods,
  saveMealTemplate,
  getMealTemplates,
  getMealTemplateByName,
  updateMealTemplate,
  getUserProfile,
  getDailyLog,
  setDailyLogStatus,
  getDateLimits,
} from "@/services/db";
import { hashFoods } from "@/utils/mealHash";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from "@/components/Header/Header";
import DateNavigation from "@/components/Header/DateNavigation";
import MealSlot from "@/components/MealSlot";
import DailySummary from "@/components/DailySummary";
import SaveTemplateDialog from "@/components/SaveTemplateDialog/SaveTemplateDialog";
import FoodDetailModal from "@/components/FoodDetailModal";
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
  const [templateContentHashes, setTemplateContentHashes] = useState<Map<string, string>>(new Map());
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [saveDialogMealId, setSaveDialogMealId] = useState<string | null>(null);
  const [logStatus, setLogStatus] = useState<DailyLogStatus>("unlogged");
  const [isFoodDetailOpen, setIsFoodDetailOpen] = useState(false);
  const [selectedFoodForDetail, setSelectedFoodForDetail] = useState<FoodItem | null>(null);

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
      const hashes = new Map<string, string>();
      templates.forEach((t) => {
        hashes.set(t.name, hashFoods(t.foods));
      });
      setTemplateContentHashes(hashes);
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
        order: existingMeal.order,
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
          order: existingMeal.order,
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
        order: existingMeal.order,
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

  // Save meal as template - check for conflicts first
  const handleSaveAsTemplate = async (mealId: string) => {
    if (!user) return;

    const meal = getMealById(mealId);
    if (!meal || meal.foods.length === 0) return;

    // Check if template with this name already exists and has different content
    const existingHash = templateContentHashes.get(meal.name);
    const currentHash = hashFoods(meal.foods);

    if (existingHash !== undefined && existingHash !== currentHash) {
      // Show conflict dialog
      setSaveDialogMealId(mealId);
      return;
    }

    // No conflict, save directly
    await saveTemplateDirectly(meal.name, meal.foods);
  };

  // Actually save the template (used after conflict resolution)
  const saveTemplateDirectly = async (name: string, foods: Food[]) => {
    if (!user) return;

    const previousTemplateHashes = templateContentHashes;
    const mealHash = hashFoods(foods);

    // Optimistic: Update UI immediately
    setTemplateContentHashes((prev) => {
      const next = new Map(prev);
      next.set(name, mealHash);
      return next;
    });
    setSavedToast(name);
    setTimeout(() => setSavedToast(null), 2000);

    // Database call in background
    try {
      await saveMealTemplate(user.uid, { name, foods });
    } catch (error) {
      console.error("Failed to save template:", error);
      setTemplateContentHashes(previousTemplateHashes);
    }
  };

  // Replace existing template
  const handleReplaceTemplate = async () => {
    if (!user || !saveDialogMealId) return;

    const meal = getMealById(saveDialogMealId);
    if (!meal) return;

    const previousTemplateHashes = templateContentHashes;
    const mealHash = hashFoods(meal.foods);

    // Optimistic: Update UI immediately
    setTemplateContentHashes((prev) => {
      const next = new Map(prev);
      next.set(meal.name, mealHash);
      return next;
    });
    setSavedToast(meal.name);
    setTimeout(() => setSavedToast(null), 2000);

    // Find and update the existing template
    try {
      const existingTemplate = await getMealTemplateByName(user.uid, meal.name);
      if (existingTemplate) {
        await updateMealTemplate(user.uid, existingTemplate.id, {
          name: meal.name,
          foods: meal.foods,
        });
      } else {
        // Fallback: create new if not found
        await saveMealTemplate(user.uid, {
          name: meal.name,
          foods: meal.foods,
        });
      }
    } catch (error) {
      console.error("Failed to replace template:", error);
      setTemplateContentHashes(previousTemplateHashes);
    }
  };

  // Save with a new name
  const handleSaveWithNewName = async (newName: string) => {
    if (!user || !saveDialogMealId) return;

    const meal = getMealById(saveDialogMealId);
    if (!meal) return;

    await saveTemplateDirectly(newName, meal.foods);
  };

  // Handle clicking on a food to view details
  const handleFoodClick = (food: Food) => {
    if (food.foodId) {
      const fullFood = availableFoods.find((f) => f.id === food.foodId);
      if (fullFood) {
        setSelectedFoodForDetail(fullFood);
        setIsFoodDetailOpen(true);
      }
    }
  };

  // Reorder meals - shared logic for both arrow buttons and drag-and-drop
  const reorderMeals = async (fromIndex: number, toIndex: number) => {
    if (!user) return;
    if (fromIndex === toIndex) return;

    const previousMeals = meals;
    const newMeals = [...meals];

    // Remove meal from old position and insert at new position
    const [movedMeal] = newMeals.splice(fromIndex, 1);
    newMeals.splice(toIndex, 0, movedMeal);

    // Reassign sequential order values
    const updatedMeals = newMeals.map((meal, index) => ({
      ...meal,
      order: index,
    }));

    // Optimistic update
    setMeals(updatedMeals);

    // Persist to database
    try {
      await Promise.all(
        updatedMeals.map((meal, index) =>
          updateMealOrder(user.uid, meal.id, index)
        )
      );
    } catch (error) {
      console.error("Failed to reorder meals:", error);
      setMeals(previousMeals);
    }
  };

  // Handle drag-and-drop reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = meals.findIndex((m) => m.id === active.id);
    const newIndex = meals.findIndex((m) => m.id === over.id);
    reorderMeals(oldIndex, newIndex);
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
              <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={meals.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                  {meals.map((meal) => {
                    const mealHash = hashFoods(meal.foods);
                    const templateHash = templateContentHashes.get(meal.name);
                    const isSavedAsTemplate = templateHash !== undefined && templateHash === mealHash;
                    return (
                      <MealSlot
                        key={meal.id}
                        id={meal.id}
                        name={meal.name}
                        foods={meal.foods}
                        availableFoods={availableFoods}
                        onAddFood={(food) => handleAddFood(meal.id, food)}
                        onRemoveFood={(index) => handleRemoveFood(meal.id, index)}
                        onDelete={() => handleDeleteMeal(meal.id)}
                        onRename={(newName) => handleRenameMeal(meal.id, newName)}
                        onSaveAsTemplate={() => handleSaveAsTemplate(meal.id)}
                        isSavedAsTemplate={isSavedAsTemplate}
                        isCustom
                        onFoodClick={handleFoodClick}
                      />
                    );
                  })}
                </SortableContext>
              </DndContext>

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

      {/* Save Template Dialog */}
      <SaveTemplateDialog
        isOpen={saveDialogMealId !== null}
        mealName={saveDialogMealId ? getMealById(saveDialogMealId)?.name || "" : ""}
        onClose={() => setSaveDialogMealId(null)}
        onReplace={handleReplaceTemplate}
        onSaveWithNewName={handleSaveWithNewName}
        existingTemplateNames={new Set([...templateContentHashes.keys()].map((n) => n.toLowerCase()))}
      />

      {/* Food Detail Modal */}
      <FoodDetailModal
        isOpen={isFoodDetailOpen}
        onClose={() => {
          setIsFoodDetailOpen(false);
          setSelectedFoodForDetail(null);
        }}
        food={selectedFoodForDetail}
      />
    </div>
  );
}
