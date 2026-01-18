import { useState } from "react";
import { X, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Food, FoodItem } from "@/types";
import styles from "./AddMealModal.module.css";

type AddMealModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, foods: Food[]) => void;
  availableFoods: FoodItem[];
};

export default function AddMealModal({
  isOpen,
  onClose,
  onSave,
  availableFoods,
}: AddMealModalProps) {
  const [name, setName] = useState("");
  const [foods, setFoods] = useState<Food[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [servings, setServings] = useState("1");

  if (!isOpen) return null;

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

    setFoods((prev) => [...prev, food]);
    setSearchQuery("");
    setSelectedFood(null);
    setServings("1");
  };

  const handleRemoveFood = (index: number) => {
    setFoods((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || foods.length === 0) {
      return;
    }

    onSave(name.trim(), foods);

    // Reset form
    setName("");
    setFoods([]);
    setSearchQuery("");
    setSelectedFood(null);
    setServings("1");
    onClose();
  };

  const handleClose = () => {
    setName("");
    setFoods([]);
    setSearchQuery("");
    setSelectedFood(null);
    setServings("1");
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
              required
            />
          </div>

          {/* Food Search */}
          <div className={styles.field}>
            <label className={styles.label}>Add Foods</label>
            <div className={styles.searchContainer}>
              <Search className={styles.searchIcon} />
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
                      {food.servingSize} - {food.calories} cal - {food.protein}g P
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Food */}
            {selectedFood && (
              <div className={styles.selectedFood}>
                <div className={styles.selectedFoodInfo}>
                  <div className={styles.selectedFoodName}>{selectedFood.name}</div>
                  <div className={styles.selectedFoodServing}>{selectedFood.servingSize}</div>
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
                <div className={styles.previewMacros}>
                  <span>{Math.round(selectedFood.calories * multiplier)} cal</span>
                  <span>{Math.round(selectedFood.protein * multiplier * 10) / 10}g P</span>
                  <span>{Math.round(selectedFood.carbs * multiplier * 10) / 10}g C</span>
                  <span>{Math.round(selectedFood.fat * multiplier * 10) / 10}g F</span>
                </div>
                <div className={styles.selectedFoodActions}>
                  <Button type="button" size="sm" onClick={handleAddFood}>
                    <Plus className={styles.iconSmall} />
                    Add
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFood(null);
                      setSearchQuery("");
                    }}
                    className={styles.cancelButton}
                  >
                    Cancel
                  </button>
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
            <Button type="submit" disabled={!name.trim() || foods.length === 0}>
              Save Meal
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
