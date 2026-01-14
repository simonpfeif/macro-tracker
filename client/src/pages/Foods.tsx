import { useEffect, useState, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Search, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AddFoodModal from "@/components/AddFoodModal";
import type { FoodItem } from "@/types";
import {
  getAllFoods,
  saveCustomFood,
  deleteCustomFood,
  searchFoods,
} from "@/services/db";

export default function Foods() {
  const [user, setUser] = useState<User | null>(null);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [filteredFoods, setFilteredFoods] = useState<FoodItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "custom" | "common">("all");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const loadFoods = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const allFoods = await getAllFoods(user.uid);
      setFoods(allFoods);
    } catch (error) {
      console.error("Error loading foods:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadFoods();
  }, [loadFoods]);

  // Filter foods based on search and tab
  useEffect(() => {
    let result = foods;

    // Filter by tab
    if (activeTab === "custom") {
      result = result.filter((f) => f.source === "custom");
    } else if (activeTab === "common") {
      result = result.filter((f) => f.source === "common");
    }

    // Filter by search
    result = searchFoods(result, searchQuery);

    setFilteredFoods(result);
  }, [foods, searchQuery, activeTab]);

  const handleSaveFood = async (foodData: {
    name: string;
    protein: number;
    carbs: number;
    fat: number;
    calories: number;
    servingSize: string;
    category: string;
  }) => {
    if (!user) return;
    try {
      const foodId = await saveCustomFood(user.uid, foodData);
      const newFood: FoodItem = {
        id: foodId,
        ...foodData,
        source: "custom",
        createdAt: new Date(),
      };
      setFoods((prev) => [...prev, newFood].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error("Error saving food:", error);
    }
  };

  const handleDeleteFood = async (foodId: string) => {
    if (!user) return;
    try {
      await deleteCustomFood(user.uid, foodId);
      setFoods((prev) => prev.filter((f) => f.id !== foodId));
    } catch (error) {
      console.error("Error deleting food:", error);
    }
  };

  const customCount = foods.filter((f) => f.source === "custom").length;
  const commonCount = foods.filter((f) => f.source === "common").length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Foods</h1>
        <Button className="gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Food
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search foods..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("all")}
          className={`pb-2 px-1 ${
            activeTab === "all"
              ? "border-b-2 border-blue-600 text-blue-600 font-medium"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          All ({foods.length})
        </button>
        <button
          onClick={() => setActiveTab("custom")}
          className={`pb-2 px-1 ${
            activeTab === "custom"
              ? "border-b-2 border-blue-600 text-blue-600 font-medium"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          My Foods ({customCount})
        </button>
        <button
          onClick={() => setActiveTab("common")}
          className={`pb-2 px-1 ${
            activeTab === "common"
              ? "border-b-2 border-blue-600 text-blue-600 font-medium"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Common ({commonCount})
        </button>
      </div>

      {/* Food List */}
      {loading ? (
        <div className="bg-white rounded-xl p-12 shadow-sm text-center">
          <p className="text-gray-500">Loading foods...</p>
        </div>
      ) : filteredFoods.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            {searchQuery ? "No foods found" : "No foods yet"}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchQuery
              ? "Try a different search term"
              : "Add your first custom food to quickly log meals."}
          </p>
          {!searchQuery && (
            <Button className="gap-2" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4" />
              Add Your First Food
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredFoods.map((food) => (
            <div
              key={food.id}
              className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-800">{food.name}</h3>
                  {food.source === "custom" && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      Custom
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {food.servingSize} · {food.category}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {food.calories} cal · {food.protein}g P · {food.carbs}g C · {food.fat}g F
                </p>
              </div>

              {food.source === "custom" && (
                <button
                  onClick={() => handleDeleteFood(food.id)}
                  className="text-gray-400 hover:text-red-500 p-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <AddFoodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveFood}
      />
    </div>
  );
}
