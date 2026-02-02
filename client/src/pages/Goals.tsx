import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header/Header";
import { getUserGoals, saveUserGoals } from "@/services/db";
import type { GoalType } from "@/types";
import styles from "./Goals.module.css";

const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  loss: "Weight Loss",
  maintenance: "Maintenance",
  gain: "Muscle Gain",
};

export default function Goals() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [goalType, setGoalType] = useState<GoalType>("maintenance");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [savedToast, setSavedToast] = useState(false);

  // Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Load existing goals on mount
  useEffect(() => {
    async function loadGoals() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const goals = await getUserGoals(user.uid);
        if (goals) {
          setGoalType(goals.goalType);
          setCalories(goals.calories.toString());
          setProtein(goals.protein.toString());
          setCarbs(goals.carbs.toString());
          setFat(goals.fat.toString());
        }
      } catch (error) {
        console.error("Error loading goals:", error);
      } finally {
        setLoading(false);
      }
    }

    loadGoals();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      await saveUserGoals(user.uid, {
        goalType,
        calories: parseInt(calories) || 2000,
        protein: parseInt(protein) || 150,
        carbs: parseInt(carbs) || 225,
        fat: parseInt(fat) || 65,
      });
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2000);
    } catch (error) {
      console.error("Error saving goals:", error);
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset: GoalType) => {
    setGoalType(preset);
    switch (preset) {
      case "loss":
        setCalories("1500");
        setProtein("120");
        setCarbs("150");
        setFat("50");
        break;
      case "maintenance":
        setCalories("2000");
        setProtein("150");
        setCarbs("200");
        setFat("65");
        break;
      case "gain":
        setCalories("2500");
        setProtein("180");
        setCarbs("280");
        setFat("80");
        break;
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <Header title="Goals" currentPage="goals" />
        <main className={styles.main}>
          <div className={styles.card}>Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Header title="Goals" currentPage="goals" />

      <main className={styles.main}>
        <div className={styles.card}>
          <p className={styles.description}>
            Set your daily nutrition targets. These will be used to track your progress.
          </p>

          {/* Goal Type Selector */}
          <div className={styles.goalTypeSection}>
            <label className={styles.label}>Goal Type</label>
            <div className={styles.goalTypeButtons}>
              {(["loss", "maintenance", "gain"] as GoalType[]).map((type) => (
                <button
                  key={type}
                  className={`${styles.goalTypeButton} ${goalType === type ? styles.goalTypeButtonActive : ""}`}
                  onClick={() => setGoalType(type)}
                >
                  {GOAL_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
            <p className={styles.goalTypeHint}>
              {goalType === "loss" && "Under goal = good (green), over goal = bad (red)"}
              {goalType === "maintenance" && "Near goal (80-120%) = good (green)"}
              {goalType === "gain" && "At/over goal = good (green), under goal = bad (red)"}
            </p>
          </div>

          <div className={styles.formFields}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Daily Calories</label>
              <Input
                type="number"
                placeholder="e.g., 2000"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
              />
            </div>

            <div className={styles.macroGrid}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Protein (g)</label>
                <Input
                  type="number"
                  placeholder="e.g., 150"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Carbs (g)</label>
                <Input
                  type="number"
                  placeholder="e.g., 200"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Fat (g)</label>
                <Input
                  type="number"
                  placeholder="e.g., 65"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className={styles.presetsSection}>
            <h3 className={styles.presetsTitle}>Quick Presets</h3>
            <div className={styles.presetsGrid}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPreset("loss")}
              >
                Weight Loss
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPreset("maintenance")}
              >
                Maintenance
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPreset("gain")}
              >
                Muscle Gain
              </Button>
            </div>
          </div>

          <Button
            className={styles.saveButton}
            onClick={handleSave}
            disabled={saving || !user}
          >
            {saving ? "Saving..." : "Save Goals"}
          </Button>
        </div>
      </main>

      {/* Toast notification */}
      {savedToast && (
        <div className={styles.toast}>
          Goals saved successfully!
        </div>
      )}
    </div>
  );
}
