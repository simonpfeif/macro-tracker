import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import MacroForm from "@/components/MacroForm";
import type { NewMealInput } from "@/components/MacroForm";
import MealList from "@/components/MealList";
import type { Meal, MealTemplate } from "@/types";
import {
  saveMeal,
  getMealsByDate,
  deleteMeal,
  getTodayDate,
  saveMealTemplate,
  getMealTemplates,
  deleteMealTemplate,
} from "@/services/db";
import TemplateList from "@/components/TemplateList";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DailyLog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Get date from URL or default to today
  const selectedDate = searchParams.get("date") || getTodayDate();
  const isToday = selectedDate === getTodayDate();

  const setSelectedDate = (date: string) => {
    if (date === getTodayDate()) {
      setSearchParams({});
    } else {
      setSearchParams({ date });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const loadMeals = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const fetchedMeals = await getMealsByDate(user.uid, selectedDate);
      setMeals(fetchedMeals);
    } catch (error) {
      console.error("Error loading meals:", error);
    } finally {
      setLoading(false);
    }
  }, [user, selectedDate]);

  const loadTemplates = useCallback(async () => {
    if (!user) return;
    try {
      const fetchedTemplates = await getMealTemplates(user.uid);
      setTemplates(fetchedTemplates);
    } catch (error) {
      console.error("Error loading templates:", error);
    }
  }, [user]);

  useEffect(() => {
    loadMeals();
  }, [loadMeals]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleAddMeal = async (mealInput: NewMealInput) => {
    if (!user) return;
    setSaving(true);
    try {
      const mealId = await saveMeal(user.uid, {
        name: mealInput.name,
        foods: mealInput.foods,
        date: selectedDate,
      });
      const newMeal: Meal = {
        id: mealId,
        name: mealInput.name,
        foods: mealInput.foods,
        date: selectedDate,
        createdAt: new Date(),
      };
      setMeals((prev) => [newMeal, ...prev]);
    } catch (error) {
      console.error("Error saving meal:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    if (!user) return;
    try {
      await deleteMeal(user.uid, mealId);
      setMeals((prev) => prev.filter((m) => m.id !== mealId));
    } catch (error) {
      console.error("Error deleting meal:", error);
    }
  };

  const handleSaveAsTemplate = async (meal: Meal) => {
    if (!user) return;
    try {
      const templateId = await saveMealTemplate(user.uid, {
        name: meal.name,
        foods: meal.foods,
      });
      const newTemplate: MealTemplate = {
        id: templateId,
        name: meal.name,
        foods: meal.foods,
        createdAt: new Date(),
      };
      setTemplates((prev) => [newTemplate, ...prev]);
    } catch (error) {
      console.error("Error saving template:", error);
    }
  };

  const handleUseTemplate = async (template: MealTemplate) => {
    if (!user) return;
    setSaving(true);
    try {
      const mealId = await saveMeal(user.uid, {
        name: template.name,
        foods: template.foods,
        date: selectedDate,
      });
      const newMeal: Meal = {
        id: mealId,
        name: template.name,
        foods: template.foods,
        date: selectedDate,
        createdAt: new Date(),
      };
      setMeals((prev) => [newMeal, ...prev]);
    } catch (error) {
      console.error("Error using template:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!user) return;
    try {
      await deleteMealTemplate(user.uid, templateId);
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    } catch (error) {
      console.error("Error deleting template:", error);
    }
  };

  const goToPrevDay = () => {
    const date = new Date(selectedDate + "T12:00:00");
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const goToNextDay = () => {
    const date = new Date(selectedDate + "T12:00:00");
    date.setDate(date.getDate() + 1);
    const nextDate = date.toISOString().split("T")[0];
    if (nextDate <= getTodayDate()) {
      setSelectedDate(nextDate);
    }
  };

  const formattedDate = new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Date Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="icon" onClick={goToPrevDay}>
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-800">
            {isToday ? "Today" : formattedDate}
          </h1>
          {isToday && (
            <p className="text-sm text-gray-500">{formattedDate}</p>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextDay}
          disabled={isToday}
          className={isToday ? "invisible" : ""}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {!isToday && (
        <div className="text-center mb-4">
          <button
            onClick={() => setSelectedDate(getTodayDate())}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Go to Today
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column - Meal Form & Templates */}
        <div className="space-y-6">
          <MacroForm onAddMeal={handleAddMeal} />
          {saving && (
            <p className="text-center text-gray-500 text-sm">Saving...</p>
          )}
          <TemplateList
            templates={templates}
            onUseTemplate={handleUseTemplate}
            onDeleteTemplate={handleDeleteTemplate}
          />
        </div>

        {/* Right column - Meal List */}
        <div>
          {loading ? (
            <div className="w-full max-w-2xl p-6 bg-white rounded-2xl shadow-md">
              <p className="text-gray-500 text-center py-8">Loading meals...</p>
            </div>
          ) : (
            <MealList
              meals={meals}
              onDeleteMeal={handleDeleteMeal}
              onSaveAsTemplate={handleSaveAsTemplate}
              selectedDate={selectedDate}
            />
          )}
        </div>
      </div>
    </div>
  );
}
