import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type Food = {
  name: string;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
};

type FoodFormProps = {
  onAddFood: (food: Food) => void;
};

export default function FoodForm({ onAddFood }: FoodFormProps) {
  const [foodName, setFoodName] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [calories, setCalories] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
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

    // Reset form
    setFoodName("");
    setProtein("");
    setCarbs("");
    setFat("");
    setCalories("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 border rounded-lg bg-gray-50">
      <h3 className="font-medium text-gray-700 mb-3">Add Food Item</h3>
      
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

      <Button type="submit" className="w-full">
        Add Food
      </Button>
    </form>
  );
}

