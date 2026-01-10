import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import MacroForm from "@/components/MacroForm";
import type { Meal } from "@/components/MacroForm";
import MealList from "@/components/MealList";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // Load meals from localStorage on mount
  useEffect(() => {
    if (user) {
      const savedMeals = localStorage.getItem(`meals_${user.uid}`);
      if (savedMeals) {
        try {
          const parsedMeals = JSON.parse(savedMeals);
          setMeals(parsedMeals);
        } catch (error) {
          console.error("Error loading meals:", error);
        }
      }
    }
  }, [user]);

  // Save meals to localStorage whenever meals change
  useEffect(() => {
    if (user && meals.length >= 0) {
      localStorage.setItem(`meals_${user.uid}`, JSON.stringify(meals));
    }
  }, [meals, user]);

  const handleAddMeal = (meal: Meal) => {
    const newMeal: Meal = {
      ...meal,
      id: Date.now().toString(),
    };
    setMeals((prev) => [...prev, newMeal]);
  };

  const handleDeleteMeal = (index: number) => {
    setMeals((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to SnackStat!</h1>
          {user && (
            <p className="text-gray-600">
              Signed in as <span className="font-semibold">{user.displayName || user.email}</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column - Meal Form */}
          <div>
            <MacroForm onAddMeal={handleAddMeal} />
          </div>

          {/* Right column - Meal List */}
          <div>
            <MealList meals={meals} onDeleteMeal={handleDeleteMeal} />
          </div>
        </div>
      </div>
    </div>
  );
}