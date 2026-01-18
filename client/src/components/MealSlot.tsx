import { useState } from "react";
import { Plus, Trash2, X, Search, Pencil, Check, Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Food, FoodItem } from "@/types";
import styles from "./MealSlot.module.css";

type MealSlotProps = {
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
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [servings, setServings] = useState("1");
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(name);

  const filteredFoods = searchQuery.trim()
    ? availableFoods
        .filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 6)
    : [];

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
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        {isEditing ? (
          <div className={styles.editContainer}>
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
                onClick={() => setIsEditing(true)}
                className={styles.editButton}
              >
                <Pencil className={styles.icon} />
              </button>
            )}
          </div>
        )}
        <div className={styles.headerRight}>
          {foods.length > 0 && (
            <span className={styles.caloriesBadge}>{totals.calories} cal</span>
          )}
          {foods.length > 0 && onSaveAsTemplate && (
            <button
              onClick={onSaveAsTemplate}
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
              onClick={onDelete}
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
                <div>
                  <span className={styles.foodName}>{food.name}</span>
                  <span className={styles.foodCalories}>
                    {food.calories} cal
                  </span>
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
                className={styles.searchInput}
                autoFocus
              />
            </div>

            {/* Search Results */}
            {!selectedFood && filteredFoods.length > 0 && (
              <div className={styles.searchResults}>
                {filteredFoods.map((food) => (
                  <button
                    key={food.id}
                    type="button"
                    onClick={() => handleSelectFood(food)}
                    className={styles.searchResultItem}
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
                    <div className={styles.selectedFoodServing}>{selectedFood.servingSize}</div>
                  </div>
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

                <div className={styles.servingsContainer}>
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

                <Button onClick={handleAddFood} size="sm" className="w-full">
                  Add to {name}
                </Button>
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
