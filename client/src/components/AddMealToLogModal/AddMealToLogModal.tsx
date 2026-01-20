import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import DatePickerCalendar from "@/components/DatePickerCalendar/DatePickerCalendar";
import type { MealTemplate } from "@/types";
import styles from "./AddMealToLogModal.module.css";

type AddMealToLogModalProps = {
  isOpen: boolean;
  onClose: () => void;
  mealTemplate: MealTemplate | null;
  onSave: (dates: string[]) => Promise<void>;
};

export default function AddMealToLogModal({
  isOpen,
  onClose,
  mealTemplate,
  onSave,
}: AddMealToLogModalProps) {
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  if (!isOpen || !mealTemplate) return null;

  const totals = mealTemplate.foods.reduce(
    (acc, f) => ({
      calories: acc.calories + f.calories,
      protein: acc.protein + f.protein,
      carbs: acc.carbs + f.carbs,
      fat: acc.fat + f.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const handleDateSelect = (date: string) => {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (selectedDates.size === 0) return;

    const datesToSave = Array.from(selectedDates);

    // Optimistic: Close modal immediately
    handleClose();

    // Database call in background
    try {
      await onSave(datesToSave);
    } catch (error) {
      console.error("Error saving meal to log:", error);
    }
  };

  const handleClose = () => {
    setSelectedDates(new Set());
    onClose();
  };

  const dateCount = selectedDates.size;
  const buttonText = dateCount === 0
    ? "Select dates"
    : `Add to ${dateCount} day${dateCount !== 1 ? "s" : ""}`;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Add to Log</h2>
          <button onClick={handleClose} className={styles.closeButton}>
            <X className={styles.icon} />
          </button>
        </div>

        <div className={styles.content}>
          {/* Meal Info */}
          <div className={styles.mealInfo}>
            <h3 className={styles.mealName}>{mealTemplate.name}</h3>
            <p className={styles.mealFoods}>
              {mealTemplate.foods.length} food{mealTemplate.foods.length !== 1 ? "s" : ""}
            </p>
            <div className={styles.macros}>
              <span className={styles.calories}>{totals.calories} cal</span>
              <span>{totals.protein}g P</span>
              <span>{totals.carbs}g C</span>
              <span>{totals.fat}g F</span>
            </div>
          </div>

          {/* Calendar */}
          <div className={styles.calendarSection}>
            <label className={styles.label}>Select dates to add this meal</label>
            <DatePickerCalendar
              selectedDates={selectedDates}
              onDateSelect={handleDateSelect}
              allowFutureDates={true}
            />
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={dateCount === 0 || saving}
            >
              {saving ? "Adding..." : buttonText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
