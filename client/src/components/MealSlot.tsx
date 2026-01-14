import { useState } from "react";
import { Plus, Trash2, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Food, FoodItem } from "@/types";

type MealSlotProps = {
  name: string;
  foods: Food[];
  availableFoods: FoodItem[];
  onAddFood: (food: Food) => void;
  onRemoveFood: (index: number) => void;
  onDelete?: () => void; // Only for custom meals
  isCustom?: boolean;
};

export default function MealSlot({
  name,
  foods,
  availableFoods,
  onAddFood,
  onRemoveFood,
  onDelete,
  isCustom = false,
}: MealSlotProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [servings, setServings] = useState("1");

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

  const multiplier = parseFloat(servings) || 1;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">{name}</h3>
        <div className="flex items-center gap-2">
          {foods.length > 0 && (
            <span className="text-sm text-gray-500">{totals.calories} cal</span>
          )}
          {isCustom && onDelete && (
            <button
              onClick={onDelete}
              className="text-gray-400 hover:text-red-500 p-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Foods List */}
      <div className="p-4">
        {foods.length > 0 ? (
          <ul className="space-y-2 mb-4">
            {foods.map((food, index) => (
              <li
                key={index}
                className="flex items-center justify-between text-sm py-2 px-3 bg-gray-50 rounded"
              >
                <div>
                  <span className="text-gray-800">{food.name}</span>
                  <span className="text-gray-500 ml-2">
                    {food.calories} cal
                  </span>
                </div>
                <button
                  onClick={() => onRemoveFood(index)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 text-sm mb-4">No foods added</p>
        )}

        {/* Add Food Section */}
        {isAdding ? (
          <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                className="pl-10"
                autoFocus
              />
            </div>

            {/* Search Results */}
            {!selectedFood && filteredFoods.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                {filteredFoods.map((food) => (
                  <button
                    key={food.id}
                    type="button"
                    onClick={() => handleSelectFood(food)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="text-sm font-medium text-gray-800">{food.name}</div>
                    <div className="text-xs text-gray-500">
                      {food.servingSize} · {food.calories} cal · {food.protein}g P
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Food */}
            {selectedFood && (
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-medium text-gray-800">{selectedFood.name}</div>
                    <div className="text-xs text-gray-500">{selectedFood.servingSize}</div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFood(null);
                      setSearchQuery("");
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <label className="text-sm text-gray-600">Servings:</label>
                  <Input
                    type="number"
                    step="0.25"
                    min="0.25"
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                    className="w-20 h-8"
                  />
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-gray-500">Protein</div>
                    <div className="font-medium">{Math.round(selectedFood.protein * multiplier * 10) / 10}g</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-gray-500">Carbs</div>
                    <div className="font-medium">{Math.round(selectedFood.carbs * multiplier * 10) / 10}g</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-gray-500">Fat</div>
                    <div className="font-medium">{Math.round(selectedFood.fat * multiplier * 10) / 10}g</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-gray-500">Cal</div>
                    <div className="font-medium">{Math.round(selectedFood.calories * multiplier)}</div>
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
              className="text-sm text-gray-500 hover:text-gray-700 w-full text-center"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Food
          </button>
        )}
      </div>
    </div>
  );
}
