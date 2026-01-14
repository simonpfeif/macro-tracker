import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Food, FoodItem } from "@/types";
import { Search } from "lucide-react";

type FoodFormProps = {
  onAddFood: (food: Food) => void;
  foods: FoodItem[];
};

export default function FoodForm({ onAddFood, foods }: FoodFormProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [servings, setServings] = useState("1");
  const [manualMode, setManualMode] = useState(false);

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
    <form onSubmit={handleSubmit} className="space-y-3 p-4 border rounded-lg bg-gray-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-700">Add Food Item</h3>
        <button
          type="button"
          onClick={() => {
            setManualMode(!manualMode);
            setSelectedFood(null);
            setSearchQuery("");
          }}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          {manualMode ? "Search foods" : "Enter manually"}
        </button>
      </div>

      {manualMode ? (
        // Manual entry mode
        <>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
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
              <label className="block text-sm font-medium text-gray-600 mb-1">
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
              <label className="block text-sm font-medium text-gray-600 mb-1">
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
              <label className="block text-sm font-medium text-gray-600 mb-1">
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
          <div ref={searchRef} className="relative">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Search Food
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search chicken, rice, eggs..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowResults(true);
                  if (selectedFood && e.target.value !== selectedFood.name) {
                    setSelectedFood(null);
                  }
                }}
                onFocus={() => setShowResults(true)}
                className="pl-10"
              />
            </div>

            {/* Search Results Dropdown */}
            {showResults && filteredFoods.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {filteredFoods.map((food) => (
                  <button
                    key={food.id}
                    type="button"
                    onClick={() => handleSelectFood(food)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-800">{food.name}</div>
                    <div className="text-xs text-gray-500">
                      {food.servingSize} · {food.calories} cal · {food.protein}g P
                    </div>
                  </button>
                ))}
              </div>
            )}

            {showResults && searchQuery && filteredFoods.length === 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center">
                <p className="text-gray-500 text-sm">No foods found</p>
                <button
                  type="button"
                  onClick={() => setManualMode(true)}
                  className="text-blue-600 text-sm mt-1 hover:text-blue-800"
                >
                  Enter manually instead
                </button>
              </div>
            )}
          </div>

          {/* Selected Food Details */}
          {selectedFood && (
            <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-gray-800">{selectedFood.name}</div>
                  <div className="text-xs text-gray-500">{selectedFood.servingSize}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFood(null);
                    setSearchQuery("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Servings
                </label>
                <Input
                  type="number"
                  step="0.25"
                  min="0.25"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  className="w-24"
                />
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-sm">
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-gray-500 text-xs">Protein</div>
                  <div className="font-medium">{Math.round(selectedFood.protein * multiplier * 10) / 10}g</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-gray-500 text-xs">Carbs</div>
                  <div className="font-medium">{Math.round(selectedFood.carbs * multiplier * 10) / 10}g</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-gray-500 text-xs">Fat</div>
                  <div className="font-medium">{Math.round(selectedFood.fat * multiplier * 10) / 10}g</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-gray-500 text-xs">Calories</div>
                  <div className="font-medium">{Math.round(selectedFood.calories * multiplier)}</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={!manualMode && !selectedFood}
      >
        Add Food
      </Button>
    </form>
  );
}
