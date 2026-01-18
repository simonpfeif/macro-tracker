import { useEffect, useState, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Search, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header/Header";
import AddFoodModal from "@/components/AddFoodModal";
import AddMealModal from "@/components/AddMealModal";
import type { FoodItem, MealTemplate, Food } from "@/types";
import {
  getAllFoods,
  saveCustomFood,
  deleteCustomFood,
  searchFoods,
  getMealTemplates,
  saveMealTemplate,
  deleteMealTemplate,
} from "@/services/db";
import styles from "./Foods.module.css";

export default function Foods() {
  const [user, setUser] = useState<User | null>(null);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [mealTemplates, setMealTemplates] = useState<MealTemplate[]>([]);
  const [filteredFoods, setFilteredFoods] = useState<FoodItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "custom" | "common" | "meals">("all");

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

  const loadMealTemplates = useCallback(async () => {
    if (!user) return;
    try {
      const templates = await getMealTemplates(user.uid);
      setMealTemplates(templates);
    } catch (error) {
      console.error("Error loading meal templates:", error);
    }
  }, [user]);

  useEffect(() => {
    loadFoods();
    loadMealTemplates();
  }, [loadFoods, loadMealTemplates]);

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

  const handleSaveMeal = async (name: string, mealFoods: Food[]) => {
    if (!user) return;
    try {
      const templateId = await saveMealTemplate(user.uid, { name, foods: mealFoods });
      const newTemplate: MealTemplate = {
        id: templateId,
        name,
        foods: mealFoods,
        createdAt: new Date(),
      };
      setMealTemplates((prev) => [newTemplate, ...prev]);
    } catch (error) {
      console.error("Error saving meal template:", error);
    }
  };

  const handleDeleteMealTemplate = async (templateId: string) => {
    if (!user) return;
    try {
      await deleteMealTemplate(user.uid, templateId);
      setMealTemplates((prev) => prev.filter((t) => t.id !== templateId));
    } catch (error) {
      console.error("Error deleting meal template:", error);
    }
  };

  const customCount = foods.filter((f) => f.source === "custom").length;
  const commonCount = foods.filter((f) => f.source === "common").length;

  return (
    <div className={styles.page}>
      <Header title="Foods" currentPage="foods" />

      <main className={styles.main}>
        <div className={styles.topBar}>
          <h2 className={styles.pageTitle}>Food Database</h2>
          <div className={styles.topBarButtons}>
            <Button variant="outline" className={styles.addButton} onClick={() => setIsMealModalOpen(true)}>
              <Plus className={styles.icon} />
              Add Meal
            </Button>
            <Button className={styles.addButton} onClick={() => setIsModalOpen(true)}>
              <Plus className={styles.icon} />
              Add Food
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} />
          <Input
            type="text"
            placeholder="Search foods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            onClick={() => setActiveTab("all")}
            className={`${styles.tab} ${activeTab === "all" ? styles.tabActive : ""}`}
          >
            All ({foods.length})
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            className={`${styles.tab} ${activeTab === "custom" ? styles.tabActive : ""}`}
          >
            My Foods ({customCount})
          </button>
          <button
            onClick={() => setActiveTab("common")}
            className={`${styles.tab} ${activeTab === "common" ? styles.tabActive : ""}`}
          >
            Common ({commonCount})
          </button>
          <button
            onClick={() => setActiveTab("meals")}
            className={`${styles.tab} ${activeTab === "meals" ? styles.tabActive : ""}`}
          >
            Meals ({mealTemplates.length})
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className={styles.emptyState}>
            <p className={styles.loadingText}>Loading...</p>
          </div>
        ) : activeTab === "meals" ? (
          // Meals Tab Content
          mealTemplates.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Search className={styles.emptyIconInner} />
              </div>
              <h3 className={styles.emptyTitle}>No meal templates yet</h3>
              <p className={styles.emptyText}>
                Create meal templates to quickly log your favorite meals.
              </p>
              <Button className={styles.addButton} onClick={() => setIsMealModalOpen(true)}>
                <Plus className={styles.icon} />
                Create Your First Meal
              </Button>
            </div>
          ) : (
            <div className={styles.foodList}>
              {mealTemplates.map((template) => {
                const totals = template.foods.reduce(
                  (acc, f) => ({
                    calories: acc.calories + f.calories,
                    protein: acc.protein + f.protein,
                    carbs: acc.carbs + f.carbs,
                    fat: acc.fat + f.fat,
                  }),
                  { calories: 0, protein: 0, carbs: 0, fat: 0 }
                );
                return (
                  <div key={template.id} className={styles.foodItem}>
                    <div className={styles.foodInfo}>
                      <div className={styles.foodHeader}>
                        <h3 className={styles.foodName}>{template.name}</h3>
                        <span className={styles.mealBadge}>Meal</span>
                      </div>
                      <p className={styles.foodServing}>
                        {template.foods.length} food{template.foods.length !== 1 ? "s" : ""}
                      </p>
                      <p className={styles.foodMacros}>
                        {totals.calories} cal - {totals.protein}g P - {totals.carbs}g C - {totals.fat}g F
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteMealTemplate(template.id)}
                      className={styles.deleteButton}
                    >
                      <Trash2 className={styles.icon} />
                    </button>
                  </div>
                );
              })}
            </div>
          )
        ) : filteredFoods.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Search className={styles.emptyIconInner} />
            </div>
            <h3 className={styles.emptyTitle}>
              {searchQuery ? "No foods found" : "No foods yet"}
            </h3>
            <p className={styles.emptyText}>
              {searchQuery
                ? "Try a different search term"
                : "Add your first custom food to quickly log meals."}
            </p>
            {!searchQuery && (
              <Button className={styles.addButton} onClick={() => setIsModalOpen(true)}>
                <Plus className={styles.icon} />
                Add Your First Food
              </Button>
            )}
          </div>
        ) : (
          <div className={styles.foodList}>
            {filteredFoods.map((food) => (
              <div key={food.id} className={styles.foodItem}>
                <div className={styles.foodInfo}>
                  <div className={styles.foodHeader}>
                    <h3 className={styles.foodName}>{food.name}</h3>
                    {food.source === "custom" && (
                      <span className={styles.customBadge}>Custom</span>
                    )}
                  </div>
                  <p className={styles.foodServing}>
                    {food.servingSize} - {food.category}
                  </p>
                  <p className={styles.foodMacros}>
                    {food.calories} cal - {food.protein}g P - {food.carbs}g C - {food.fat}g F
                  </p>
                </div>

                {food.source === "custom" && (
                  <button
                    onClick={() => handleDeleteFood(food.id)}
                    className={styles.deleteButton}
                  >
                    <Trash2 className={styles.icon} />
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

        <AddMealModal
          isOpen={isMealModalOpen}
          onClose={() => setIsMealModalOpen(false)}
          onSave={handleSaveMeal}
          availableFoods={foods}
        />
      </main>
    </div>
  );
}
