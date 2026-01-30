import { X, CalendarPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FoodItem } from "@/types";
import styles from "./FoodDetailModal.module.css";

type FoodDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  food: FoodItem | null;
  onAddToLog?: (food: FoodItem) => void;
  onDelete?: (foodId: string) => void;
};

export default function FoodDetailModal({
  isOpen,
  onClose,
  food,
  onAddToLog,
  onDelete,
}: FoodDetailModalProps) {
  if (!isOpen || !food) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatValue = (value: number | undefined, unit: string): string => {
    if (value === undefined) return "--";
    return `${value}${unit}`;
  };

  const hasSubFats = food.saturatedFat !== undefined || food.transFat !== undefined;
  const hasSubCarbs = food.fiber !== undefined || food.sugar !== undefined || food.addedSugar !== undefined;
  const hasMicronutrients =
    food.vitaminD !== undefined ||
    food.calcium !== undefined ||
    food.iron !== undefined ||
    food.potassium !== undefined;

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <button onClick={onClose} className={styles.closeButton}>
            <X className={styles.icon} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* Food Info */}
          <div className={styles.foodInfo}>
            <h2 className={styles.foodName}>{food.name}</h2>
            <div className={styles.foodMeta}>
              <span className={styles.servingSize}>{food.servingSize}</span>
              <span className={styles.separator}>|</span>
              <span className={styles.category}>{food.category}</span>
            </div>
            {food.source === "custom" && (
              <span className={styles.customBadge}>Custom</span>
            )}
          </div>

          {/* Nutrition Label */}
          <div className={styles.nutritionLabel}>
            <h3 className={styles.nutritionTitle}>Nutrition Facts</h3>

            {/* Calories */}
            <div className={styles.caloriesRow}>
              <span className={styles.caloriesLabel}>Calories</span>
              <span className={styles.caloriesValue}>{food.calories}</span>
            </div>

            <div className={styles.divider} />

            {/* Total Fat */}
            <div className={styles.nutrientRow}>
              <span className={styles.nutrientLabel}>Total Fat</span>
              <span className={styles.nutrientValue}>{food.fat}g</span>
            </div>
            {hasSubFats && (
              <>
                {food.saturatedFat !== undefined && (
                  <div className={styles.subNutrientRow}>
                    <span className={styles.subNutrientLabel}>Saturated Fat</span>
                    <span className={styles.subNutrientValue}>{food.saturatedFat}g</span>
                  </div>
                )}
                {food.transFat !== undefined && (
                  <div className={styles.subNutrientRow}>
                    <span className={styles.subNutrientLabel}>Trans Fat</span>
                    <span className={styles.subNutrientValue}>{food.transFat}g</span>
                  </div>
                )}
              </>
            )}

            {/* Cholesterol */}
            {food.cholesterol !== undefined && (
              <div className={styles.nutrientRow}>
                <span className={styles.nutrientLabel}>Cholesterol</span>
                <span className={styles.nutrientValue}>{formatValue(food.cholesterol, "mg")}</span>
              </div>
            )}

            {/* Sodium */}
            {food.sodium !== undefined && (
              <div className={styles.nutrientRow}>
                <span className={styles.nutrientLabel}>Sodium</span>
                <span className={styles.nutrientValue}>{formatValue(food.sodium, "mg")}</span>
              </div>
            )}

            {/* Total Carbs */}
            <div className={styles.nutrientRow}>
              <span className={styles.nutrientLabel}>Total Carbohydrate</span>
              <span className={styles.nutrientValue}>{food.carbs}g</span>
            </div>
            {hasSubCarbs && (
              <>
                {food.fiber !== undefined && (
                  <div className={styles.subNutrientRow}>
                    <span className={styles.subNutrientLabel}>Dietary Fiber</span>
                    <span className={styles.subNutrientValue}>{food.fiber}g</span>
                  </div>
                )}
                {food.sugar !== undefined && (
                  <div className={styles.subNutrientRow}>
                    <span className={styles.subNutrientLabel}>Total Sugars</span>
                    <span className={styles.subNutrientValue}>{food.sugar}g</span>
                  </div>
                )}
                {food.addedSugar !== undefined && (
                  <div className={styles.subSubNutrientRow}>
                    <span className={styles.subSubNutrientLabel}>Includes Added Sugars</span>
                    <span className={styles.subSubNutrientValue}>{food.addedSugar}g</span>
                  </div>
                )}
              </>
            )}

            {/* Protein */}
            <div className={styles.nutrientRow}>
              <span className={styles.nutrientLabel}>Protein</span>
              <span className={styles.nutrientValue}>{food.protein}g</span>
            </div>

            {/* Vitamins & Minerals */}
            {hasMicronutrients && (
              <>
                <div className={styles.divider} />
                {food.vitaminD !== undefined && (
                  <div className={styles.micronutrientRow}>
                    <span className={styles.micronutrientLabel}>Vitamin D</span>
                    <span className={styles.micronutrientValue}>{food.vitaminD}mcg</span>
                  </div>
                )}
                {food.calcium !== undefined && (
                  <div className={styles.micronutrientRow}>
                    <span className={styles.micronutrientLabel}>Calcium</span>
                    <span className={styles.micronutrientValue}>{food.calcium}mg</span>
                  </div>
                )}
                {food.iron !== undefined && (
                  <div className={styles.micronutrientRow}>
                    <span className={styles.micronutrientLabel}>Iron</span>
                    <span className={styles.micronutrientValue}>{food.iron}mg</span>
                  </div>
                )}
                {food.potassium !== undefined && (
                  <div className={styles.micronutrientRow}>
                    <span className={styles.micronutrientLabel}>Potassium</span>
                    <span className={styles.micronutrientValue}>{food.potassium}mg</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        {(onAddToLog || (onDelete && food.source === "custom")) && (
          <div className={styles.actions}>
            {onAddToLog && (
              <Button
                onClick={() => onAddToLog(food)}
                className={styles.addToLogButton}
              >
                <CalendarPlus className={styles.iconSmall} />
                Add to Log
              </Button>
            )}
            {onDelete && food.source === "custom" && (
              <Button
                variant="outline"
                onClick={() => onDelete(food.id)}
                className={styles.deleteButton}
              >
                <Trash2 className={styles.iconSmall} />
                Delete
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
