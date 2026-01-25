import { useEffect, useState, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Search, Plus, Trash2, CalendarPlus, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header/Header";
import AddFoodModal from "@/components/AddFoodModal";
import AddMealModal from "@/components/AddMealModal";
import AddMealToLogModal from "@/components/AddMealToLogModal/AddMealToLogModal";
import AddFoodToLogModal from "@/components/AddFoodToLogModal/AddFoodToLogModal";
import type { FoodItem, MealTemplate, Food } from "@/types";
import {
  getAllFoods,
  saveCustomFood,
  deleteCustomFood,
  searchFoods,
  getMealTemplates,
  saveMealTemplate,
  deleteMealTemplate,
  saveMeal,
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
  const [isMealToLogModalOpen, setIsMealToLogModalOpen] = useState(false);
  const [isFoodToLogModalOpen, setIsFoodToLogModalOpen] = useState(false);
  const [selectedMealTemplate, setSelectedMealTemplate] = useState<MealTemplate | null>(null);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "custom" | "common" | "meals">("all");
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set());

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

    const tempId = `temp-${Date.now()}`;
    const newFood: FoodItem = {
      id: tempId,
      ...foodData,
      source: "custom",
      createdAt: new Date(),
    };

    // Optimistic: Add food to UI immediately
    setFoods((prev) => [...prev, newFood].sort((a, b) => a.name.localeCompare(b.name)));

    // Database call in background
    try {
      const foodId = await saveCustomFood(user.uid, foodData);
      setFoods((prev) =>
        prev.map((f) => (f.id === tempId ? { ...f, id: foodId } : f))
      );
    } catch (error) {
      console.error("Error saving food:", error);
      setFoods((prev) => prev.filter((f) => f.id !== tempId));
    }
  };

  const handleDeleteFood = async (foodId: string) => {
    if (!user) return;

    const previousFoods = foods;

    // Optimistic: Remove food from UI immediately
    setFoods((prev) => prev.filter((f) => f.id !== foodId));

    // Database call in background
    try {
      await deleteCustomFood(user.uid, foodId);
    } catch (error) {
      console.error("Error deleting food:", error);
      setFoods(previousFoods);
    }
  };

  const handleSaveMeal = async (name: string, mealFoods: Food[]) => {
    if (!user) return;

    const tempId = `temp-${Date.now()}`;
    const newTemplate: MealTemplate = {
      id: tempId,
      name,
      foods: mealFoods,
      createdAt: new Date(),
    };

    // Optimistic: Add template to UI immediately
    setMealTemplates((prev) => [newTemplate, ...prev]);

    // Database call in background
    try {
      const templateId = await saveMealTemplate(user.uid, { name, foods: mealFoods });
      setMealTemplates((prev) =>
        prev.map((t) => (t.id === tempId ? { ...t, id: templateId } : t))
      );
    } catch (error) {
      console.error("Error saving meal template:", error);
      setMealTemplates((prev) => prev.filter((t) => t.id !== tempId));
    }
  };

  const handleDeleteMealTemplate = async (templateId: string) => {
    if (!user) return;

    const previousTemplates = mealTemplates;

    // Optimistic: Remove template from UI immediately
    setMealTemplates((prev) => prev.filter((t) => t.id !== templateId));

    // Database call in background
    try {
      await deleteMealTemplate(user.uid, templateId);
    } catch (error) {
      console.error("Error deleting meal template:", error);
      setMealTemplates(previousTemplates);
    }
  };

  const handleOpenMealToLog = (template: MealTemplate) => {
    setSelectedMealTemplate(template);
    setIsMealToLogModalOpen(true);
  };

  const handleOpenFoodToLog = (food: FoodItem) => {
    setSelectedFood(food);
    setIsFoodToLogModalOpen(true);
  };

  const toggleMealExpansion = (templateId: string) => {
    setExpandedMeals((prev) => {
      const next = new Set(prev);
      if (next.has(templateId)) {
        next.delete(templateId);
      } else {
        next.add(templateId);
      }
      return next;
    });
  };

  const handleAddMealToLog = async (dates: string[]) => {
    if (!user || !selectedMealTemplate) return;

    // Close modal immediately (optimistic)
    setIsMealToLogModalOpen(false);
    setSelectedMealTemplate(null);

    // Database calls in background (fire and forget for different dates)
    for (const date of dates) {
      saveMeal(user.uid, {
        name: selectedMealTemplate.name,
        foods: selectedMealTemplate.foods,
        date,
      }).catch((error) => {
        console.error("Error saving meal to log:", error);
      });
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
                const hasMoreThanThree = template.foods.length > 3;
                const isExpanded = expandedMeals.has(template.id);
                const visibleFoods = hasMoreThanThree ? template.foods.slice(0, 3) : template.foods;
                const hiddenFoods = hasMoreThanThree ? template.foods.slice(3) : [];

                return (
                  <div key={template.id} className={styles.mealCard}>
                    <div className={styles.mealCardHeader}>
                      <div className={styles.mealHeaderLeft}>
                        <h3 className={styles.mealCardName}>{template.name}</h3>
                      </div>
                      <div className={styles.macrosGrid}>
                        <div className={styles.gridHeader}>Cal</div>
                        <div className={styles.gridHeader}>P</div>
                        <div className={styles.gridHeader}>C</div>
                        <div className={styles.gridHeader}>F</div>
                        
                        <div className={styles.gridValue}>{Math.round(totals.calories)}</div>
                        <div className={`${styles.gridValue} ${styles.macroProtein}`}>{Math.round(totals.protein)}g</div>
                        <div className={`${styles.gridValue} ${styles.macroCarbs}`}>{Math.round(totals.carbs)}g</div>
                        <div className={`${styles.gridValue} ${styles.macroFat}`}>{Math.round(totals.fat)}g</div>
                      </div>
                      <div className={styles.itemActions}>
                        <button
                          onClick={() => handleOpenMealToLog(template)}
                          className={styles.addToLogButton}
                          title="Add to log"
                        >
                          <CalendarPlus className={styles.icon} />
                        </button>
                        <button
                          onClick={() => handleDeleteMealTemplate(template.id)}
                          className={styles.deleteButton}
                          title="Delete"
                        >
                          <Trash2 className={styles.icon} />
                        </button>
                      </div>
                    </div>

                    <div className={styles.mealFoodsList}>
                      {visibleFoods.map((food, index) => (
                        <div key={index} className={styles.mealFoodItem}>
                          <span className={styles.mealFoodName}>{food.name}</span>
                        </div>
                      ))}
                      {hasMoreThanThree && !isExpanded && (
                        <button
                          onClick={() => toggleMealExpansion(template.id)}
                          className={styles.showMoreButton}
                        >
                          +{hiddenFoods.length} more <ChevronDown className={styles.icon} />
                        </button>
                      )}
                      {isExpanded && hiddenFoods.map((food, index) => (
                        <div key={`hidden-${index}`} className={styles.mealFoodItem}>
                          <span className={styles.mealFoodName}>{food.name}</span>
                        </div>
                      ))}
                      {hasMoreThanThree && isExpanded && (
                        <button
                          onClick={() => toggleMealExpansion(template.id)}
                          className={styles.showMoreButton}
                        >
                          Show less <ChevronUp className={styles.icon} />
                        </button>
                      )}
                    </div>
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
                <div className={styles.foodHeaderLeft}>
                  <h3 className={styles.foodName}>{food.name}</h3>
                  {food.source === "custom" && (
                    <span className={styles.customBadge}>Custom</span>
                  )}
                  <p className={styles.foodServing}>
                    {food.servingSize} - {food.category}
                  </p>
                </div>

                <div className={styles.macrosGrid}>
                  <div className={styles.gridHeader}>Cal</div>
                  <div className={styles.gridHeader}>P</div>
                  <div className={styles.gridHeader}>C</div>
                  <div className={styles.gridHeader}>F</div>
                  
                  <div className={styles.gridValue}>{food.calories}</div>
                  <div className={`${styles.gridValue} ${styles.macroProtein}`}>{food.protein}g</div>
                  <div className={`${styles.gridValue} ${styles.macroCarbs}`}>{food.carbs}g</div>
                  <div className={`${styles.gridValue} ${styles.macroFat}`}>{food.fat}g</div>
                </div>

                <div className={styles.itemActions}>
                  <button
                    onClick={() => handleOpenFoodToLog(food)}
                    className={styles.addToLogButton}
                    title="Add to log"
                  >
                    <CalendarPlus className={styles.icon} />
                  </button>
                  {food.source === "custom" && (
                    <button
                      onClick={() => handleDeleteFood(food.id)}
                      className={styles.deleteButton}
                      title="Delete"
                    >
                      <Trash2 className={styles.icon} />
                    </button>
                  )}
                </div>
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
          existingTemplateNames={new Set(mealTemplates.map((t) => t.name.toLowerCase()))}
        />

        <AddMealToLogModal
          isOpen={isMealToLogModalOpen}
          onClose={() => {
            setIsMealToLogModalOpen(false);
            setSelectedMealTemplate(null);
          }}
          mealTemplate={selectedMealTemplate}
          onSave={handleAddMealToLog}
        />

        <AddFoodToLogModal
          isOpen={isFoodToLogModalOpen}
          onClose={() => {
            setIsFoodToLogModalOpen(false);
            setSelectedFood(null);
          }}
          food={selectedFood}
          userId={user?.uid || ""}
        />
      </main>
    </div>
  );
}
