import { useState, useEffect, useCallback } from "react";
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

const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  loss: "Fat Loss",
  maintenance: "Maintenance",
  gain: "Muscle Gain",
};

export default function Goals() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [goalType, setGoalType] = useState<GoalType>("maintenance");
  const [savedToast, setSavedToast] = useState(false);
  const [birthday, setBirthday] = useState<string | undefined>();
  const [calculatedResults, setCalculatedResults] = useState<CalculatedMacros | null>(null);

  // Manual override state
  const [manualExpanded, setManualExpanded] = useState(false);
  const [manualCalories, setManualCalories] = useState("");
  const [manualProtein, setManualProtein] = useState("");
  const [manualCarbs, setManualCarbs] = useState("");
  const [manualFat, setManualFat] = useState("");

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
          // Pre-fill manual fields with existing goals
          setManualCalories(goals.calories.toString());
          setManualProtein(goals.protein.toString());
          setManualCarbs(goals.carbs.toString());
          setManualFat(goals.fat.toString());
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

  // Handler for calculator changes (memoized to avoid infinite loops)
  const handleCalculatorChange = useCallback((results: CalculatedMacros | null) => {
    setCalculatedResults(results);
  }, []);

  // Determine which values to display/save
  const getDisplayValues = () => {
    if (manualExpanded) {
      return {
        calories: manualCalories,
        protein: manualProtein,
        carbs: manualCarbs,
        fat: manualFat,
        fiber: calculatedResults?.fiber.toString() || "—",
      };
    }
    if (calculatedResults) {
      return {
        calories: calculatedResults.calories.toString(),
        protein: calculatedResults.protein.toString(),
        carbs: calculatedResults.carbs.toString(),
        fat: calculatedResults.fat.toString(),
        fiber: calculatedResults.fiber.toString(),
      };
    }
    return {
      calories: manualCalories || "—",
      protein: manualProtein || "—",
      carbs: manualCarbs || "—",
      fat: manualFat || "—",
      fiber: "—",
    };
  };

  const displayValues = getDisplayValues();
  const hasValidValues = manualExpanded
    ? (parseInt(manualCalories) > 0 && parseInt(manualProtein) >= 0 && parseInt(manualCarbs) >= 0 && parseInt(manualFat) >= 0)
    : calculatedResults !== null;

  const handleSave = async () => {
    if (!user || !hasValidValues) return;

    setSaving(true);
    try {
      await saveUserGoals(user.uid, {
        goalType,
        calories: parseInt(displayValues.calories) || 2000,
        protein: parseInt(displayValues.protein) || 150,
        carbs: parseInt(displayValues.carbs) || 225,
        fat: parseInt(displayValues.fat) || 65,
        fiber: parseInt(displayValues.fiber) || undefined,
      });
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2000);
    } catch (error) {
      console.error("Error saving goals:", error);
    } finally {
      setSaving(false);
    }
  };

  // When expanding manual, pre-fill with calculated values if available
  const handleManualToggle = () => {
    if (!manualExpanded && calculatedResults) {
      setManualCalories(calculatedResults.calories.toString());
      setManualProtein(calculatedResults.protein.toString());
      setManualCarbs(calculatedResults.carbs.toString());
      setManualFat(calculatedResults.fat.toString());
    }
    setManualExpanded(!manualExpanded);
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
        <div className={styles.twoColumnLayout}>
          {/* Form Column */}
          <div className={styles.formColumn}>
            {/* Calculator Card */}
            <div className={styles.card}>
              <p className={styles.description}>
                Fill in your details below and your personalized macro targets will calculate automatically.
              </p>
              <MacroCalculator
                birthday={birthday}
                goalType={goalType}
                onChange={handleCalculatorChange}
              />
            </div>
          </div>

          {/* Results Column (sticky) */}
          <div className={styles.resultsColumn}>
            {/* Live Results Display */}
            <div className={styles.resultsCard}>
          <h3 className={styles.resultsTitle}>Your Calculated Targets</h3>

          {/* Goal Type Selector */}
          <div className={styles.goalSelector}>
            <label className={styles.goalSelectorLabel}>Goal</label>
            <div className={styles.goalTypeButtons}>
              {(["loss", "maintenance", "gain"] as GoalType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`${styles.goalTypeButton} ${goalType === type ? styles.goalTypeButtonActive : ""}`}
                  onClick={() => setGoalType(type)}
                >
                  {GOAL_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {calculatedResults ? (
            <>
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
                <span className={styles.calorieValue}>
                  {manualExpanded ? manualCalories || "—" : calculatedResults.calories}
                </span>
                <span className={styles.calorieUnit}>calories</span>
              </div>

              <div className={styles.macroResults}>
                <div className={styles.macroResult}>
                  <span className={styles.macroLabel}>Protein</span>
                  <span className={styles.macroValue}>
                    {manualExpanded ? manualProtein || "—" : calculatedResults.protein}g
                  </span>
                </div>
                <div className={styles.macroResult}>
                  <span className={styles.macroLabel}>Carbs</span>
                  <span className={styles.macroValue}>
                    {manualExpanded ? manualCarbs || "—" : calculatedResults.carbs}g
                  </span>
                </div>
                <div className={styles.macroResult}>
                  <span className={styles.macroLabel}>Fat</span>
                  <span className={styles.macroValue}>
                    {manualExpanded ? manualFat || "—" : calculatedResults.fat}g
                  </span>
                </div>
                <div className={styles.macroResult}>
                  <span className={styles.macroLabel}>Fiber</span>
                  <span className={styles.macroValue}>
                    {calculatedResults.fiber}g
                  </span>
                </div>
              </div>
            </>
          ) : (
            <p className={styles.noResults}>
              Enter your details above to see calculated targets
            </p>
          )}

          {/* Manual Override Section */}
          <div className={styles.manualOverride}>
            <button
              className={styles.manualToggle}
              onClick={handleManualToggle}
            >
              <span>{manualExpanded ? "Use Calculated Values" : "Enter Manually Instead"}</span>
              <span className={styles.toggleIcon}>{manualExpanded ? "−" : "+"}</span>
            </button>

            {manualExpanded && (
              <div className={styles.manualFields}>
                <div className={styles.manualFieldGroup}>
                  <label className={styles.label}>Daily Calories</label>
                  <Input
                    type="number"
                    placeholder="e.g., 2000"
                    value={manualCalories}
                    onChange={(e) => setManualCalories(e.target.value)}
                  />
                </div>

                <div className={styles.macroGrid}>
                  <div className={styles.manualFieldGroup}>
                    <label className={styles.label}>Protein (g)</label>
                    <Input
                      type="number"
                      placeholder="e.g., 150"
                      value={manualProtein}
                      onChange={(e) => setManualProtein(e.target.value)}
                    />
                  </div>

                  <div className={styles.manualFieldGroup}>
                    <label className={styles.label}>Carbs (g)</label>
                    <Input
                      type="number"
                      placeholder="e.g., 200"
                      value={manualCarbs}
                      onChange={(e) => setManualCarbs(e.target.value)}
                    />
                  </div>

                  <div className={styles.manualFieldGroup}>
                    <label className={styles.label}>Fat (g)</label>
                    <Input
                      type="number"
                      placeholder="e.g., 65"
                      value={manualFat}
                      onChange={(e) => setManualFat(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <Button
            className={styles.saveButton}
            onClick={handleSave}
            disabled={saving || !user || !hasValidValues}
          >
            {saving ? "Saving..." : "Save Goals"}
          </Button>
            </div>
          </div>
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
