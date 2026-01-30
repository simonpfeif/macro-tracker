import { useState, useEffect } from "react";
import { Plus, Trash2, X, Search, Pencil, Check, Bookmark, BookmarkCheck } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Input } from "@/components/ui/input";
import type { Food, FoodItem } from "@/types";
import { ServingDisplay } from "./ServingDisplay";
import styles from "./MealSlot.module.css";

type MealSlotProps = {
  id: string;
  name: string;
  foods: Food[];
  availableFoods: FoodItem[];
  onAddFood: (food: Food) => void;
  onRemoveFood: (index: number) => void;
  onDelete?: () => void; // Only for custom meals
  onRename?: (newName: string) => void;
  onSaveAsTemplate?: () => void;
  isSavedAsTemplate?: boolean;
  isCustom?: boolean;
};

export default function MealSlot({
  id,
  name,
  foods,
  availableFoods,
  onAddFood,
  onRemoveFood,
  onDelete,
  onRename,
  onSaveAsTemplate,
  isSavedAsTemplate = false,
  isCustom = false,
}: MealSlotProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [servings, setServings] = useState("1");
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(name);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const filteredFoods = searchQuery.trim()
    ? availableFoods
        .filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 6)
    : [];

  // Reset highlighted index when search results change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchQuery]);

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

    onAddFood(food);
    setIsAdding(false);
    setSearchQuery("");
    setSelectedFood(null);
    setServings("1");
  };

  const handleCancel = () => {
    setIsAdding(false);
    setSearchQuery("");
    setSelectedFood(null);
    setServings("1");
  };

  const handleRename = () => {
    if (!editedName.trim() || editedName.trim() === name) {
      setIsEditing(false);
      setEditedName(name);
      return;
    }
    onRename?.(editedName.trim());
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedName(name);
  };

  const multiplier = parseFloat(servings) || 1;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.card} ${isDragging ? styles.dragging : ""}`}
    >
      {/* Header */}
      <div
        className={styles.header}
        {...attributes}
        {...listeners}
      >
        {isEditing ? (
          <div className={styles.editContainer} onClick={(e) => e.stopPropagation()}>
            <Input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className={styles.editInput}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") handleCancelEdit();
              }}
            />
            <button onClick={handleRename} className={styles.editActionButton}>
              <Check className={styles.icon} />
            </button>
            <button onClick={handleCancelEdit} className={styles.editActionButton}>
              <X className={styles.icon} />
            </button>
          </div>
        ) : (
          <div className={styles.titleContainer}>
            <h3 className={styles.title}>{name}</h3>
            {onRename && (
              <button
                onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                onPointerDown={(e) => e.stopPropagation()}
                className={styles.editButton}
              >
                <Pencil className={styles.icon} />
              </button>
            )}
          </div>
        )}

        {/* Macro totals grid (when foods exist) */}
        {foods.length > 0 && (
          <div className={styles.mealMacrosGrid}>
            <div className={styles.mealMacroCell}>
              <div className={styles.mealMacroCellLabel}>Cal</div>
              <div className={styles.mealMacroCellValue}>{Math.round(totals.calories)}</div>
            </div>
            <div className={`${styles.mealMacroCell} ${styles.mealMacroCellProtein}`}>
              <div className={styles.mealMacroCellLabel}>P</div>
              <div className={styles.mealMacroCellValue}>{Math.round(totals.protein)}g</div>
            </div>
            <div className={`${styles.mealMacroCell} ${styles.mealMacroCellCarbs}`}>
              <div className={styles.mealMacroCellLabel}>C</div>
              <div className={styles.mealMacroCellValue}>{Math.round(totals.carbs)}g</div>
            </div>
            <div className={`${styles.mealMacroCell} ${styles.mealMacroCellFat}`}>
              <div className={styles.mealMacroCellLabel}>F</div>
              <div className={styles.mealMacroCellValue}>{Math.round(totals.fat)}g</div>
            </div>
          </div>
        )}

        <div className={styles.headerRight}>
          {foods.length > 0 && onSaveAsTemplate && (
            <button
              onClick={(e) => { e.stopPropagation(); onSaveAsTemplate(); }}
              onPointerDown={(e) => e.stopPropagation()}
              className={isSavedAsTemplate ? styles.saveButtonSaved : styles.saveButton}
              title={isSavedAsTemplate ? "Saved as template" : "Save as template"}
            >
              {isSavedAsTemplate ? (
                <BookmarkCheck className={styles.icon} />
              ) : (
                <Bookmark className={styles.icon} />
              )}
            </button>
          )}
          {isCustom && onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              onPointerDown={(e) => e.stopPropagation()}
              className={styles.deleteButton}
            >
              <Trash2 className={styles.icon} />
            </button>
          )}
        </div>
      </div>

      {/* Foods List */}
      <div className={styles.content}>
        {foods.length > 0 ? (
          <ul className={styles.foodsList}>
            {foods.map((food, index) => (
              <li
                key={index}
                className={styles.foodItem}
              >
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
                  onClick={() => onRemoveFood(index)}
                  className={styles.removeButton}
                >
                  <X className={styles.icon} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptyState}>No foods added</p>
        )}

        {/* Add Food Section */}
        {isAdding ? (
          <div className={styles.addSection}>
            {/* Search Input */}
            <div className={styles.searchContainer}>
              <Search className={`${styles.searchIcon} ${styles.icon}`} />
              <Input
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
                    handleCancel();
                  }
                }}
                className={styles.searchInput}
                autoFocus
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
                      {food.servingSize} · {food.calories} cal · {food.protein}g P
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Food */}
            {selectedFood && (
              <div className={styles.selectedFoodCard}>
                <div className={styles.selectedFoodHeader}>
                  <div className={styles.selectedFoodInfo}>
                    <div className={styles.selectedFoodName}>{selectedFood.name}</div>
                    <div className={styles.selectedFoodServing}><ServingDisplay servingSize={selectedFood.servingSize} foodId={selectedFood.id} foodName={selectedFood.name} editable /></div>
                  </div>
                  <div className={styles.selectedFoodActions}>
                    <button onClick={handleAddFood} className={styles.confirmButton}>
                      <Check className={styles.icon} />
                    </button>
                    <button
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

                <div className={styles.servingsContainer}>
                  <label className={styles.servingsLabel}>Servings:</label>
                  <Input
                    type="number"
                    step="0.25"
                    min="0.25"
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
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

            {/* Cancel Button */}
            <button
              onClick={handleCancel}
              className={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className={styles.addFoodButton}
          >
            <Plus className={styles.icon} />
            Add Food
          </button>
        )}
      </div>
    </div>
  );
}
