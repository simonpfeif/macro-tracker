import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header/Header";
import MacroCalculator from "@/components/MacroCalculator/MacroCalculator";
import { getUserGoals, saveUserGoals, getUserProfile } from "@/services/db";
import type { GoalType, CalculatedMacros } from "@/types";
import styles from "./Goals.module.css";

type InputMode = "calculate" | "manual";

const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  loss: "Fat Loss",
  maintenance: "Maintenance",
  gain: "Muscle Gain",
};

export default function Goals() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>("calculate");
  const [goalType, setGoalType] = useState<GoalType>("maintenance");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [savedToast, setSavedToast] = useState(false);
  const [birthday, setBirthday] = useState<string | undefined>();
  const [calculatedResults, setCalculatedResults] = useState<CalculatedMacros | null>(null);

  // Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Load existing goals and profile on mount
  useEffect(() => {
    async function loadData() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const [goals, profile] = await Promise.all([
          getUserGoals(user.uid),
          getUserProfile(user.uid),
        ]);

        if (goals) {
          setGoalType(goals.goalType);
          setCalories(goals.calories.toString());
          setProtein(goals.protein.toString());
          setCarbs(goals.carbs.toString());
          setFat(goals.fat.toString());
        }

        if (profile?.birthday) {
          setBirthday(profile.birthday);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
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

  const handleCalculatorResults = (results: CalculatedMacros, calculatedGoalType: GoalType) => {
    setCalculatedResults(results);
    setGoalType(calculatedGoalType);
    setCalories(results.calories.toString());
    setProtein(results.protein.toString());
    setCarbs(results.carbs.toString());
    setFat(results.fat.toString());
  };

  const clearResults = () => {
    setCalculatedResults(null);
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
        {/* Mode Toggle */}
        <div className={styles.modeToggle}>
          <button
            className={`${styles.modeButton} ${inputMode === "calculate" ? styles.modeButtonActive : ""}`}
            onClick={() => {
              setInputMode("calculate");
              clearResults();
            }}
          >
            Calculate for Me
          </button>
          <button
            className={`${styles.modeButton} ${inputMode === "manual" ? styles.modeButtonActive : ""}`}
            onClick={() => setInputMode("manual")}
          >
            Enter Manually
          </button>
        </div>

        {/* Calculator Mode */}
        {inputMode === "calculate" && !calculatedResults && (
          <div className={styles.card}>
            <p className={styles.description}>
              Answer a few questions and we'll calculate your personalized macro targets.
            </p>
            <MacroCalculator
              birthday={birthday}
              onCalculate={handleCalculatorResults}
            />
          </div>
        )}

        {/* Results Display */}
        {inputMode === "calculate" && calculatedResults && (
          <div className={styles.card}>
            <div className={styles.resultsHeader}>
              <h3 className={styles.resultsTitle}>Your Calculated Targets</h3>
              <button
                className={styles.recalculateButton}
                onClick={clearResults}
              >
                Recalculate
              </button>
            </div>

            <div className={styles.statsRow}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>BMR</span>
                <span className={styles.statValue}>{calculatedResults.bmr}</span>
                <span className={styles.statUnit}>cal/day</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>TDEE</span>
                <span className={styles.statValue}>{calculatedResults.tdee}</span>
                <span className={styles.statUnit}>cal/day</span>
              </div>
            </div>

            <div className={styles.calorieTarget}>
              <span className={styles.calorieLabel}>Daily Calorie Target</span>
              <span className={styles.calorieValue}>{calories}</span>
              <span className={styles.calorieUnit}>calories</span>
            </div>

            <div className={styles.macroResults}>
              <div className={styles.macroResult}>
                <label className={styles.label}>Protein (g)</label>
                <Input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                />
              </div>
              <div className={styles.macroResult}>
                <label className={styles.label}>Carbs (g)</label>
                <Input
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                />
              </div>
              <div className={styles.macroResult}>
                <label className={styles.label}>Fat (g)</label>
                <Input
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                />
              </div>
            </div>

            <p className={styles.editHint}>
              You can adjust these values before saving.
            </p>

            <Button
              className={styles.saveButton}
              onClick={handleSave}
              disabled={saving || !user}
            >
              {saving ? "Saving..." : "Save Goals"}
            </Button>
          </div>
        )}

        {/* Manual Entry Mode */}
        {inputMode === "manual" && (
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
                  Fat Loss
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
        )}
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
