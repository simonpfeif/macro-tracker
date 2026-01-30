import { useState, useEffect } from "react";
import { X, ChevronLeft, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DatePickerCalendar from "@/components/DatePickerCalendar/DatePickerCalendar";
import type { FoodItem, Meal, Food } from "@/types";
import { getMealsByDate, saveMeal, deleteMeal } from "@/services/db";
import { ServingDisplay } from "@/components/ServingDisplay";
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
  const [selectedMealIds, setSelectedMealIds] = useState<Set<string>>(new Set());

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep("date");
      setSelectedDate(null);
      setMealsForDate([]);
      setServings("1");
      setNewMealName("");
      setShowNewMealInput(false);
      setSelectedMealIds(new Set());
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

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;

      if (e.key === "Escape") {
        handleClose();
      }

      if (e.key === "Enter" && step === "meal" && selectedMealIds.size > 0 && !showNewMealInput) {
        // If Enter was pressed while focusing a meal item/button or an input inside the modal,
        // let the native handler toggle selection or submit the form — don't auto-add immediately.
        if (
          target &&
          (target.closest(`.${styles.mealItem}`) ||
            target.closest(`.${styles.newMealForm}`) ||
            target.tagName === "BUTTON" ||
            target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA")
        ) {
          return;
        }

        e.preventDefault();
        handleAddToSelectedMeals();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, step, selectedMealIds, showNewMealInput]);

  if (!isOpen || !food) return null;

  const multiplier = parseFloat(servings) || 1;
  const scaledFood: Food = {
    name: multiplier !== 1 ? `${food.name} (${servings}x)` : food.name,
    protein: Math.round(food.protein * multiplier * 10) / 10,
    carbs: Math.round(food.carbs * multiplier * 10) / 10,
    fat: Math.round(food.fat * multiplier * 10) / 10,
    calories: Math.round(food.calories * multiplier),
    foodId: food.id,
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
    setSelectedMealIds(new Set());
  };

  const toggleMealSelection = (mealId: string) => {
    setSelectedMealIds((prev) => {
      const next = new Set(prev);
      if (next.has(mealId)) {
        next.delete(mealId);
      } else {
        next.add(mealId);
      }
      return next;
    });
  };

  const handleAddToSelectedMeals = async () => {
    if (selectedMealIds.size === 0) return;

    // Optimistic: Close modal immediately
    handleClose();

    // Database calls in background
    try {
      for (const mealId of selectedMealIds) {
        const meal = mealsForDate.find((m) => m.id === mealId);
        if (meal) {
          // Avoid adding duplicate (e.g., when a newly created temp meal already contains the scaled food)
          const alreadyHas = meal.foods.some((f) => f.name === scaledFood.name && f.calories === scaledFood.calories && f.protein === scaledFood.protein);
          if (alreadyHas) continue;

          const updatedFoods = [...meal.foods, scaledFood];

          // Preserve the original order when re-saving so list order doesn't change
          await deleteMeal(userId, meal.id);
          await saveMeal(userId, {
            name: meal.name,
            foods: updatedFoods,
            date: meal.date,
            order: meal.order,
          });
        }
      }
    } catch (error) {
      console.error("Error adding food to meals:", error);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleCreateNewMeal = async () => {
    if (!newMealName.trim() || !selectedDate) return;

    const mealName = newMealName.trim();

    // Optimistic: add new meal to the list and keep modal open so user can select it
    const tempId = `temp-${Date.now()}`;
    const tempMeal = {
      id: tempId,
      name: mealName,
      foods: [scaledFood],
      date: selectedDate,
      order: Date.now(),
      createdAt: new Date(),
    };

    setMealsForDate((prev) => [...prev, tempMeal]);
    setSelectedMealIds((prev) => {
      const next = new Set(prev);
      next.add(tempId);
      return next;
    });
    setShowNewMealInput(false);
    setNewMealName("");

    // Database call in background - replace temp id with real id when saved
    try {
      const realId = await saveMeal(userId, {
        name: mealName,
        foods: [scaledFood],
        date: selectedDate,
        order: tempMeal.order,
      });

      setMealsForDate((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, id: realId } : m))
      );

      setSelectedMealIds((prev) => {
        const next = new Set(Array.from(prev).map((id) => (id === tempId ? realId : id)));
        return next;
      });
    } catch (error) {
      console.error("Error creating new meal:", error);
      // Rollback optimistic add
      setMealsForDate((prev) => prev.filter((m) => m.id !== tempId));
      setSelectedMealIds((prev) => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });
    }
  };

  const handleClose = () => {
    setStep("date");
    setSelectedDate(null);
    setMealsForDate([]);
    setServings("1");
    setNewMealName("");
    setShowNewMealInput(false);
    setSelectedMealIds(new Set());
    onClose();
  };

  const selectedDatesSet = selectedDate ? new Set([selectedDate]) : new Set<string>();

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
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
              <p className={styles.foodServing}><ServingDisplay servingSize={food.servingSize} foodId={food.id} foodName={food.name} editable /></p>
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
                    const isSelected = selectedMealIds.has(meal.id);
                    return (
                      <button
                        key={meal.id}
                        onClick={() => toggleMealSelection(meal.id)}
                        disabled={saving}
                        className={`${styles.mealItem} ${isSelected ? styles.mealItemSelected : ""}`}
                      >
                        <div className={styles.mealItemInfo}>
                          <span className={styles.mealItemName}>{meal.name}</span>
                          <span className={styles.mealItemCalories}>
                            {mealCalories} cal - {meal.foods.length} food{meal.foods.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        {isSelected ? (
                          <Check className={styles.iconSmall} />
                        ) : (
                          <Plus className={styles.iconSmall} />
                        )}
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
                            // Prevent the global handler from also acting
                            e.preventDefault();
                            e.stopPropagation();
                            handleCreateNewMeal();
                          }
                          if (e.key === "Escape") {
                            e.preventDefault();
                            e.stopPropagation();
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

              {/* Action Buttons */}
              <div className={styles.actionButtons}>
                <button className={styles.cancelButton} onClick={handleClose}>
                  Cancel
                </button>
                <button
                  className={styles.addButton}
                  onClick={handleAddToSelectedMeals}
                  disabled={selectedMealIds.size === 0}
                >
                  Add to {selectedMealIds.size || ""} meal{selectedMealIds.size !== 1 ? "s" : ""}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
