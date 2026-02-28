import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Food, FoodItem } from "@/types";
import { Search } from "lucide-react";
import { ServingDisplay } from "./ServingDisplay";
import { saveCustomFood } from "@/services/db";
import { searchOpenFoodFacts, type ExternalFood } from "@/services/nutritionApi";
import styles from "./FoodForm.module.css";

type FoodFormProps = {
  onAddFood: (food: Food) => void;
  foods: FoodItem[];
  userId?: string;
};

export default function FoodForm({ onAddFood, foods, userId }: FoodFormProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [servings, setServings] = useState("1");
  const [manualMode, setManualMode] = useState(false);

  // Online search state
  const [onlineResults, setOnlineResults] = useState<ExternalFood[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineSearchedQuery, setOnlineSearchedQuery] = useState("");

  // Manual entry fields
  const [foodName, setFoodName] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [calories, setCalories] = useState("");

  const searchRef = useRef<HTMLDivElement>(null);

  // Filter foods based on search
  const filteredFoods = searchQuery.trim()
    ? foods.filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8)
    : [];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setSearchQuery(food.name);
    setShowResults(false);
    setServings("1");
  };

  async function handleSearchOnline() {
    if (!searchQuery.trim()) return;
    setIsSearchingOnline(true);
    try {
      const results = await searchOpenFoodFacts(searchQuery);
      setOnlineResults(results);
      setOnlineSearchedQuery(searchQuery);
    } finally {
      setIsSearchingOnline(false);
    }
  }

  function handleSelectOnlineFood(food: ExternalFood) {
    const tempFood: FoodItem = {
      ...food,
      id: `online-${Date.now()}`,
      createdAt: new Date(),
    };
    handleSelectFood(tempFood);
    setOnlineResults([]);

    // Auto-save to My Foods in background (fire-and-forget)
    if (userId) {
      saveCustomFood(userId, food).catch(() => {/* silent */});
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (manualMode) {
      // Manual entry
      if (!foodName || !protein || !carbs || !fat || !calories) {
        return;
      }

      const food: Food = {
        name: foodName,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fat: parseFloat(fat) || 0,
        calories: parseFloat(calories) || 0,
      };

      onAddFood(food);

      // Reset
      setFoodName("");
      setProtein("");
      setCarbs("");
      setFat("");
      setCalories("");
    } else {
      // Database selection
      if (!selectedFood) return;

      const multiplier = parseFloat(servings) || 1;
      const food: Food = {
        name: multiplier !== 1
          ? `${selectedFood.name} (${servings}x)`
          : selectedFood.name,
        protein: Math.round(selectedFood.protein * multiplier * 10) / 10,
        carbs: Math.round(selectedFood.carbs * multiplier * 10) / 10,
        fat: Math.round(selectedFood.fat * multiplier * 10) / 10,
        calories: Math.round(selectedFood.calories * multiplier),
      };

      onAddFood(food);

      // Reset
      setSearchQuery("");
      setSelectedFood(null);
      setServings("1");
    }
  };

  const multiplier = parseFloat(servings) || 1;

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.header}>
        <h3 className={styles.title}>Add Food Item</h3>
        <button
          type="button"
          onClick={() => {
            setManualMode(!manualMode);
            setSelectedFood(null);
            setSearchQuery("");
            setOnlineResults([]);
            setOnlineSearchedQuery("");
          }}
          className={styles.modeToggle}
        >
          {manualMode ? "Search foods" : "Enter manually"}
        </button>
      </div>

      {manualMode ? (
        // Manual entry mode
        <>
          <div>
            <label className={styles.label}>
              Food Name
            </label>
            <Input
              type="text"
              placeholder="e.g. Chicken Breast"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              required
            />
          </div>

          <div className={styles.grid}>
            <div>
              <label className={styles.label}>
                Protein (g)
              </label>
              <Input
                type="number"
                step="0.1"
                placeholder="0"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                required
              />
            </div>

            <div>
              <label className={styles.label}>
                Carbs (g)
              </label>
              <Input
                type="number"
                step="0.1"
                placeholder="0"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                required
              />
            </div>

            <div>
              <label className={styles.label}>
                Fat (g)
              </label>
              <Input
                type="number"
                step="0.1"
                placeholder="0"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                required
              />
            </div>

            <div>
              <label className={styles.label}>
                Calories
              </label>
              <Input
                type="number"
                step="0.1"
                placeholder="0"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                required
              />
            </div>
          </div>
        </>
      ) : (
        // Search mode
        <>
          <div ref={searchRef} className={styles.searchContainer}>
            <label className={styles.label}>
              Search Food
            </label>
            <div className={styles.searchContainer}>
              <Search className={styles.searchIcon} />
              <Input
                type="text"
                placeholder="Search chicken, rice, eggs..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowResults(true);
                  setOnlineResults([]);
                  setOnlineSearchedQuery("");
                  if (selectedFood && e.target.value !== selectedFood.name) {
                    setSelectedFood(null);
                  }
                }}
                onFocus={() => setShowResults(true)}
                className={styles.searchInput}
              />
            </div>

            {/* Local Search Results Dropdown */}
            {showResults && filteredFoods.length > 0 && (
              <div className={styles.dropdown}>
                {filteredFoods.map((food) => (
                  <button
                    key={food.id}
                    type="button"
                    onClick={() => handleSelectFood(food)}
                    className={styles.dropdownItem}
                  >
                    <div className={styles.itemName}>{food.name}</div>
                    <div className={styles.itemDetails}>
                      {food.servingSize} · {food.calories} cal · {food.protein}g P
                    </div>
                  </button>
                ))}
                <div className={styles.onlineSeparator}>
                  <button
                    type="button"
                    onClick={handleSearchOnline}
                    className={styles.searchOnlineLink}
                    disabled={isSearchingOnline}
                  >
                    {isSearchingOnline ? "Searching…" : "Search online →"}
                  </button>
                </div>
              </div>
            )}

            {/* Empty state */}
            {showResults && searchQuery && filteredFoods.length === 0 && (
              <div className={styles.emptyState}>
                <p className={styles.emptyText}>No foods found locally</p>
                {onlineSearchedQuery !== searchQuery ? (
                  <button
                    type="button"
                    onClick={handleSearchOnline}
                    className={styles.emptyLink}
                    disabled={isSearchingOnline}
                  >
                    {isSearchingOnline ? "Searching…" : `Search online for "${searchQuery}"`}
                  </button>
                ) : onlineResults.length === 0 ? (
                  <p className={styles.emptyText}>No online results found either</p>
                ) : null}
                <button
                  type="button"
                  onClick={() => setManualMode(true)}
                  className={styles.emptyLink}
                >
                  Enter manually instead
                </button>
              </div>
            )}

            {/* Online results dropdown */}
            {showResults && onlineResults.length > 0 && (
              <div className={styles.dropdown}>
                <div className={styles.onlineSectionLabel}>Results from Open Food Facts</div>
                {onlineResults.map((food, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectOnlineFood(food)}
                    className={`${styles.dropdownItem} ${styles.dropdownItemOnline}`}
                  >
                    <div className={styles.itemName}>{food.name}</div>
                    <div className={styles.itemDetails}>
                      per 100g · {food.calories} cal · {food.protein}g P
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Food Details */}
          {selectedFood && (
            <div className={styles.selectedFoodCard}>
              <div className={styles.selectedFoodHeader}>
                <div className={styles.selectedFoodInfo}>
                  <div className={styles.selectedFoodName}>{selectedFood.name}</div>
                  <div className={styles.selectedFoodServing}><ServingDisplay servingSize={selectedFood.servingSize} foodId={selectedFood.id} foodName={selectedFood.name} editable /></div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFood(null);
                    setSearchQuery("");
                  }}
                  className={styles.clearButton}
                >
                  ×
                </button>
              </div>

              <div>
                <label className={styles.label}>
                  Servings
                </label>
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
                <div className={styles.macroCell}>
                  <div className={styles.macroLabel}>Protein</div>
                  <div className={styles.macroValue}>{Math.round(selectedFood.protein * multiplier * 10) / 10}g</div>
                </div>
                <div className={styles.macroCell}>
                  <div className={styles.macroLabel}>Carbs</div>
                  <div className={styles.macroValue}>{Math.round(selectedFood.carbs * multiplier * 10) / 10}g</div>
                </div>
                <div className={styles.macroCell}>
                  <div className={styles.macroLabel}>Fat</div>
                  <div className={styles.macroValue}>{Math.round(selectedFood.fat * multiplier * 10) / 10}g</div>
                </div>
                <div className={styles.macroCell}>
                  <div className={styles.macroLabel}>Calories</div>
                  <div className={styles.macroValue}>{Math.round(selectedFood.calories * multiplier)}</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <Button
        type="submit"
        className={styles.submitButton}
        disabled={!manualMode && !selectedFood}
      >
        Add Food
      </Button>
    </form>
  );
}
