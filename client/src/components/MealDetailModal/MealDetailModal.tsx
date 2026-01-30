import { useState, useEffect, useRef } from "react";
import { X, Search, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Food, FoodItem, MealTemplate } from "@/types";
import { ServingDisplay } from "@/components/ServingDisplay";
import styles from "./MealDetailModal.module.css";

type MealDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  mealTemplate: MealTemplate | null;
  onSave: (templateId: string, name: string, foods: Food[]) => Promise<void>;
  availableFoods: FoodItem[];
  existingTemplateNames: Set<string>;
};

export default function MealDetailModal({
  isOpen,
  onClose,
  mealTemplate,
  onSave,
  availableFoods,
  existingTemplateNames,
}: MealDetailModalProps) {
  const [name, setName] = useState("");
  const [foods, setFoods] = useState<Food[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [servings, setServings] = useState("1");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const nameValidationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize form when modal opens with meal template data
  useEffect(() => {
    if (isOpen && mealTemplate) {
      setName(mealTemplate.name);
      setFoods([...mealTemplate.foods]);
      setSearchQuery("");
      setSelectedFood(null);
      setServings("1");
      setNameError(null);
    }
  }, [isOpen, mealTemplate]);

  const filteredFoods = searchQuery.trim()
    ? availableFoods
        .filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 6)
    : [];

  // Reset highlighted index when search results change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchQuery]);

  // Debounced validation for duplicate name check
  useEffect(() => {
    if (nameValidationTimeoutRef.current) {
      clearTimeout(nameValidationTimeoutRef.current);
    }

    if (!name.trim()) {
      setNameError(null);
      return;
    }

    nameValidationTimeoutRef.current = setTimeout(() => {
      const normalizedName = name.trim().toLowerCase();
      if (existingTemplateNames.has(normalizedName)) {
        setNameError("A meal template with this name already exists");
      } else {
        setNameError(null);
      }
    }, 300);

    return () => {
      if (nameValidationTimeoutRef.current) {
        clearTimeout(nameValidationTimeoutRef.current);
      }
    };
  }, [name, existingTemplateNames]);

  if (!isOpen || !mealTemplate) return null;

  const totals = foods.reduce(
    (acc, food) => ({
      protein: acc.protein + food.protein,
      carbs: acc.carbs + food.carbs,
      fat: acc.fat + food.fat,
      calories: acc.calories + food.calories,
    }),
    { protein: 0, carbs: 0, fat: 0, calories: 0 }
  );

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setSearchQuery(food.name);
    setServings("1");
  };

  const handleAddFood = () => {
    if (!selectedFood) return;

    const multiplier = parseFloat(servings) || 1;
    const food: Food = {
      name: multiplier !== 1 ? `${selectedFood.name} (${servings}x)` : selectedFood.name,
      protein: Math.round(selectedFood.protein * multiplier * 10) / 10,
      carbs: Math.round(selectedFood.carbs * multiplier * 10) / 10,
      fat: Math.round(selectedFood.fat * multiplier * 10) / 10,
      calories: Math.round(selectedFood.calories * multiplier),
    };

    setFoods((prev) => [...prev, food]);
    setSearchQuery("");
    setSelectedFood(null);
    setServings("1");
    setHighlightedIndex(-1);
  };

  const handleRemoveFood = (index: number) => {
    setFoods((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || foods.length === 0 || nameError || isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(mealTemplate.id, name.trim(), foods);
      onClose();
    } catch (error) {
      console.error("Error saving meal template:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    setSelectedFood(null);
    setServings("1");
    setNameError(null);
    onClose();
  };

  const multiplier = parseFloat(servings) || 1;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Edit Meal</h2>
          <button onClick={handleClose} className={styles.closeButton}>
            <X className={styles.icon} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Editable Meal Name */}
          <div className={styles.field}>
            <label className={styles.label}>Meal Name</label>
            <Input
              type="text"
              placeholder="e.g., Post-Workout Shake"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  searchInputRef.current?.focus();
                }
              }}
              className={nameError ? styles.inputError : ""}
              required
            />
            {nameError && <span className={styles.errorMessage}>{nameError}</span>}
          </div>

          {/* Macro Totals Grid */}
          <div className={styles.totalsSection}>
            <label className={styles.label}>Macro Totals</label>
            <div className={styles.macroTotalsGrid}>
              <div className={styles.macroTotalCell}>
                <div className={styles.macroTotalLabel}>Cal</div>
                <div className={styles.macroTotalValue}>{Math.round(totals.calories)}</div>
              </div>
              <div className={`${styles.macroTotalCell} ${styles.macroTotalProtein}`}>
                <div className={styles.macroTotalLabel}>P</div>
                <div className={styles.macroTotalValue}>{Math.round(totals.protein)}g</div>
              </div>
              <div className={`${styles.macroTotalCell} ${styles.macroTotalCarbs}`}>
                <div className={styles.macroTotalLabel}>C</div>
                <div className={styles.macroTotalValue}>{Math.round(totals.carbs)}g</div>
              </div>
              <div className={`${styles.macroTotalCell} ${styles.macroTotalFat}`}>
                <div className={styles.macroTotalLabel}>F</div>
                <div className={styles.macroTotalValue}>{Math.round(totals.fat)}g</div>
              </div>
            </div>
          </div>

          {/* Foods List */}
          {foods.length > 0 && (
            <div className={styles.foodsList}>
              <label className={styles.label}>Foods ({foods.length})</label>
              <ul className={styles.foodsListItems}>
                {foods.map((food, index) => (
                  <li key={index} className={styles.foodItem}>
                    <div className={styles.foodItemInfo}>
                      <span className={styles.foodName}>{food.name}</span>
                      <div className={styles.foodMacros}>
                        <span>{food.calories} cal</span>
                        <span className={styles.macroProtein}>{food.protein}g P</span>
                        <span className={styles.macroCarbs}>{food.carbs}g C</span>
                        <span className={styles.macroFat}>{food.fat}g F</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFood(index)}
                      className={styles.removeButton}
                    >
                      <X className={styles.iconSmall} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Food Search */}
          <div className={styles.field}>
            <label className={styles.label}>Add Foods</label>
            <div className={styles.searchContainer}>
              <Search className={styles.searchIcon} />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search foods..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (selectedFood && e.target.value !== selectedFood.name) {
                    setSelectedFood(null);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    if (filteredFoods.length > 0) {
                      setHighlightedIndex((prev) =>
                        prev < filteredFoods.length - 1 ? prev + 1 : prev
                      );
                    }
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    if (selectedFood) {
                      handleAddFood();
                    } else if (filteredFoods.length > 0) {
                      const indexToSelect = highlightedIndex >= 0 ? highlightedIndex : 0;
                      handleSelectFood(filteredFoods[indexToSelect]);
                    }
                  } else if (e.key === "Escape") {
                    setSearchQuery("");
                    setSelectedFood(null);
                  }
                }}
                className={styles.searchInput}
              />
            </div>

            {/* Search Results */}
            {!selectedFood && filteredFoods.length > 0 && (
              <div className={styles.searchResults}>
                {filteredFoods.map((food, index) => (
                  <button
                    key={food.id}
                    type="button"
                    onClick={() => handleSelectFood(food)}
                    className={`${styles.searchResultItem} ${index === highlightedIndex ? styles.searchResultItemHighlighted : ""}`}
                  >
                    <div className={styles.searchResultName}>{food.name}</div>
                    <div className={styles.searchResultDetails}>
                      {food.servingSize} - {food.calories} cal - {food.protein}g P
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Food */}
            {selectedFood && (
              <div className={styles.selectedFood}>
                <div className={styles.selectedFoodHeader}>
                  <div className={styles.selectedFoodInfo}>
                    <div className={styles.selectedFoodName}>{selectedFood.name}</div>
                    <div className={styles.selectedFoodServing}><ServingDisplay servingSize={selectedFood.servingSize} foodId={selectedFood.id} foodName={selectedFood.name} editable /></div>
                  </div>
                  <div className={styles.selectedFoodActions}>
                    <button type="button" onClick={handleAddFood} className={styles.confirmButton}>
                      <Check className={styles.icon} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFood(null);
                        setSearchQuery("");
                      }}
                      className={styles.clearButton}
                    >
                      <X className={styles.icon} />
                    </button>
                  </div>
                </div>
                <div className={styles.servingsRow}>
                  <label className={styles.servingsLabel}>Servings:</label>
                  <Input
                    type="number"
                    step="0.25"
                    min="0.25"
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddFood();
                      }
                    }}
                    className={styles.servingsInput}
                  />
                </div>
                <div className={styles.macroGrid}>
                  <div className={`${styles.macroCell} ${styles.macroCellProtein}`}>
                    <div className={styles.macroLabel}>Protein</div>
                    <div className={styles.macroValue}>{Math.round(selectedFood.protein * multiplier * 10) / 10}g</div>
                  </div>
                  <div className={`${styles.macroCell} ${styles.macroCellCarbs}`}>
                    <div className={styles.macroLabel}>Carbs</div>
                    <div className={styles.macroValue}>{Math.round(selectedFood.carbs * multiplier * 10) / 10}g</div>
                  </div>
                  <div className={`${styles.macroCell} ${styles.macroCellFat}`}>
                    <div className={styles.macroLabel}>Fat</div>
                    <div className={styles.macroValue}>{Math.round(selectedFood.fat * multiplier * 10) / 10}g</div>
                  </div>
                  <div className={`${styles.macroCell} ${styles.macroCellCalories}`}>
                    <div className={styles.macroLabel}>Cal</div>
                    <div className={styles.macroValue}>{Math.round(selectedFood.calories * multiplier)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={styles.actions}>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || foods.length === 0 || !!nameError || isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
