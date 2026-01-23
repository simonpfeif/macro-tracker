import { useState, useEffect } from "react";
import { X, ChevronLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DatePickerCalendar from "@/components/DatePickerCalendar/DatePickerCalendar";
import type { FoodItem, Meal, Food } from "@/types";
import { getMealsByDate, saveMeal, deleteMeal } from "@/services/db";
import styles from "./AddFoodToLogModal.module.css";

type AddFoodToLogModalProps = {
  isOpen: boolean;
  onClose: () => void;
  food: FoodItem | null;
  userId: string;
};

export default function AddFoodToLogModal({
  isOpen,
  onClose,
  food,
  userId,
}: AddFoodToLogModalProps) {
  const [step, setStep] = useState<"date" | "meal">("date");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [mealsForDate, setMealsForDate] = useState<Meal[]>([]);
  const [servings, setServings] = useState("1");
  const [newMealName, setNewMealName] = useState("");
  const [showNewMealInput, setShowNewMealInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep("date");
      setSelectedDate(null);
      setMealsForDate([]);
      setServings("1");
      setNewMealName("");
      setShowNewMealInput(false);
    }
  }, [isOpen]);

  // Fetch meals when date is selected
  useEffect(() => {
    if (selectedDate && step === "meal" && userId) {
      setLoading(true);
      getMealsByDate(userId, selectedDate)
        .then((meals) => {
          setMealsForDate(meals);
        })
        .catch((error) => {
          console.error("Error fetching meals:", error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [selectedDate, step, userId]);

  if (!isOpen || !food) return null;

  const multiplier = parseFloat(servings) || 1;
  const scaledFood: Food = {
    name: multiplier !== 1 ? `${food.name} (${servings}x)` : food.name,
    protein: Math.round(food.protein * multiplier * 10) / 10,
    carbs: Math.round(food.carbs * multiplier * 10) / 10,
    fat: Math.round(food.fat * multiplier * 10) / 10,
    calories: Math.round(food.calories * multiplier),
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setStep("meal");
  };

  const handleBackToDate = () => {
    setStep("date");
    setSelectedDate(null);
    setMealsForDate([]);
    setShowNewMealInput(false);
    setNewMealName("");
  };

  const handleAddToExistingMeal = async (meal: Meal) => {
    // Optimistic: Close modal immediately
    handleClose();

    // Database call in background
    try {
      const updatedFoods = [...meal.foods, scaledFood];
      await deleteMeal(userId, meal.id);
      await saveMeal(userId, {
        name: meal.name,
        foods: updatedFoods,
        date: meal.date,
      });
    } catch (error) {
      console.error("Error adding food to meal:", error);
    }
  };

  const handleCreateNewMeal = async () => {
    if (!newMealName.trim() || !selectedDate) return;

    const mealName = newMealName.trim();

    // Optimistic: Close modal immediately
    handleClose();

    // Database call in background
    try {
      await saveMeal(userId, {
        name: mealName,
        foods: [scaledFood],
        date: selectedDate,
      });
    } catch (error) {
      console.error("Error creating new meal:", error);
    }
  };

  const handleClose = () => {
    setStep("date");
    setSelectedDate(null);
    setMealsForDate([]);
    setServings("1");
    setNewMealName("");
    setShowNewMealInput(false);
    onClose();
  };

  const selectedDatesSet = selectedDate ? new Set([selectedDate]) : new Set<string>();

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          {step === "meal" && (
            <button onClick={handleBackToDate} className={styles.backButton}>
              <ChevronLeft className={styles.icon} />
            </button>
          )}
          <h2 className={styles.title}>
            {step === "date" ? "Add to Log" : "Select Meal"}
          </h2>
          <button onClick={handleClose} className={styles.closeButton}>
            <X className={styles.icon} />
          </button>
        </div>

        <div className={styles.content}>
          {/* Food Preview */}
          <div className={styles.foodPreview}>
            <div className={styles.foodInfo}>
              <h3 className={styles.foodName}>{food.name}</h3>
              <p className={styles.foodServing}>{food.servingSize}</p>
            </div>
            <div className={styles.servingsRow}>
              <label className={styles.servingsLabel}>Servings:</label>
              <Input
                type="number"
                step="0.25"
                min="0.25"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                className={styles.servingsInput}
              />
            </div>
            <div className={styles.macros}>
              <span className={styles.calories}>{scaledFood.calories} cal</span>
              <span>{scaledFood.protein}g P</span>
              <span>{scaledFood.carbs}g C</span>
              <span>{scaledFood.fat}g F</span>
            </div>
          </div>

          {/* Step 1: Date Selection */}
          {step === "date" && (
            <div className={styles.dateSection}>
              <label className={styles.label}>Select a date</label>
              <DatePickerCalendar
                selectedDates={selectedDatesSet}
                onDateSelect={handleDateSelect}
                allowFutureDates={true}
              />
            </div>
          )}

          {/* Step 2: Meal Selection */}
          {step === "meal" && selectedDate && (
            <div className={styles.mealSection}>
              <label className={styles.label}>
                Add to meal on {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </label>

              {loading ? (
                <div className={styles.loading}>Loading meals...</div>
              ) : (
                <div className={styles.mealList}>
                  {/* Existing Meals */}
                  {mealsForDate.map((meal) => {
                    const mealCalories = meal.foods.reduce((sum, f) => sum + f.calories, 0);
                    return (
                      <button
                        key={meal.id}
                        onClick={() => handleAddToExistingMeal(meal)}
                        disabled={saving}
                        className={styles.mealItem}
                      >
                        <div className={styles.mealItemInfo}>
                          <span className={styles.mealItemName}>{meal.name}</span>
                          <span className={styles.mealItemCalories}>
                            {mealCalories} cal - {meal.foods.length} food{meal.foods.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <Plus className={styles.iconSmall} />
                      </button>
                    );
                  })}

                  {/* Create New Meal */}
                  {!showNewMealInput ? (
                    <button
                      onClick={() => setShowNewMealInput(true)}
                      className={styles.newMealButton}
                    >
                      <Plus className={styles.iconSmall} />
                      <span>Create new meal</span>
                    </button>
                  ) : (
                    <div className={styles.newMealForm}>
                      <Input
                        type="text"
                        placeholder="Meal name (e.g., Breakfast)"
                        value={newMealName}
                        onChange={(e) => setNewMealName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newMealName.trim()) {
                            handleCreateNewMeal();
                          }
                          if (e.key === "Escape") {
                            setShowNewMealInput(false);
                            setNewMealName("");
                          }
                        }}
                        autoFocus
                      />
                      <div className={styles.newMealActions}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setShowNewMealInput(false);
                            setNewMealName("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleCreateNewMeal}
                          disabled={!newMealName.trim() || saving}
                        >
                          {saving ? "Creating..." : "Create & Add"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
