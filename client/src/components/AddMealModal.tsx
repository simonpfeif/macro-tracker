import { useState, useEffect, useRef } from "react";
import { X, Search, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Food, FoodItem } from "@/types";
import { ServingDisplay } from "./ServingDisplay";
import styles from "./AddMealModal.module.css";

type AddMealModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, foods: Food[]) => void;
  availableFoods: FoodItem[];
  existingTemplateNames?: Set<string>;
};

export default function AddMealModal({
  isOpen,
  onClose,
  onSave,
  availableFoods,
  existingTemplateNames = new Set(),
}: AddMealModalProps) {
  const [name, setName] = useState("");
  const [foods, setFoods] = useState<Food[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [servings, setServings] = useState("1");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [nameError, setNameError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const nameValidationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  if (!isOpen) return null;

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
      foodId: selectedFood.id,
      // Micronutrients - default to 0 if not present
      fiber: Math.round((selectedFood.fiber ?? 0) * multiplier * 10) / 10,
      saturatedFat: Math.round((selectedFood.saturatedFat ?? 0) * multiplier * 10) / 10,
      transFat: Math.round((selectedFood.transFat ?? 0) * multiplier * 10) / 10,
      cholesterol: Math.round((selectedFood.cholesterol ?? 0) * multiplier * 10) / 10,
      sodium: Math.round((selectedFood.sodium ?? 0) * multiplier * 10) / 10,
      sugar: Math.round((selectedFood.sugar ?? 0) * multiplier * 10) / 10,
      addedSugar: Math.round((selectedFood.addedSugar ?? 0) * multiplier * 10) / 10,
      vitaminD: Math.round((selectedFood.vitaminD ?? 0) * multiplier * 10) / 10,
      calcium: Math.round((selectedFood.calcium ?? 0) * multiplier * 10) / 10,
      iron: Math.round((selectedFood.iron ?? 0) * multiplier * 10) / 10,
      potassium: Math.round((selectedFood.potassium ?? 0) * multiplier * 10) / 10,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || foods.length === 0 || nameError) {
      return;
    }

    onSave(name.trim(), foods);

    // Reset form
    setName("");
    setFoods([]);
    setSearchQuery("");
    setSelectedFood(null);
    setServings("1");
    setNameError(null);
    onClose();
  };

  const handleClose = () => {
    setName("");
    setFoods([]);
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
          <h2 className={styles.title}>Create Meal Template</h2>
          <button onClick={handleClose} className={styles.closeButton}>
            <X className={styles.icon} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
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

          {/* Foods List */}
          {foods.length > 0 && (
            <div className={styles.foodsList}>
              <label className={styles.label}>Foods in Meal ({foods.length})</label>
              <ul className={styles.foodsListItems}>
                {foods.map((food, index) => (
                  <li key={index} className={styles.foodItem}>
                    <div className={styles.foodItemInfo}>
                      <span className={styles.foodName}>{food.name}</span>
                      <span className={styles.foodCalories}>{food.calories} cal</span>
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

              {/* Totals */}
              <div className={styles.totals}>
                <div className={styles.totalsLabel}>Total:</div>
                <div className={styles.totalsValues}>
                  <span className={styles.totalCalories}>{totals.calories} cal</span>
                  <span>{totals.protein}g P</span>
                  <span>{totals.carbs}g C</span>
                  <span>{totals.fat}g F</span>
                </div>
              </div>
            </div>
          )}

          <div className={styles.actions}>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || foods.length === 0 || !!nameError}>
              Save Meal
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
