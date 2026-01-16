import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header/Header";
import styles from "./Goals.module.css";

export default function Goals() {
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const handleSave = () => {
    // TODO: Save goals to Firestore
    console.log("Save goals:", { calories, protein, carbs, fat });
  };

  return (
    <div className={styles.page}>
      <Header title="Goals" currentPage="goals" />

      <main className={styles.main}>
        <div className={styles.card}>
          <p className={styles.description}>
            Set your daily nutrition targets. These will be used to track your progress.
          </p>

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
                onClick={() => {
                  setCalories("1500");
                  setProtein("120");
                  setCarbs("150");
                  setFat("50");
                }}
              >
                Weight Loss
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCalories("2000");
                  setProtein("150");
                  setCarbs("200");
                  setFat("65");
                }}
              >
                Maintenance
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCalories("2500");
                  setProtein("180");
                  setCarbs("280");
                  setFat("80");
                }}
              >
                Muscle Gain
              </Button>
            </div>
          </div>

          <Button className={styles.saveButton} onClick={handleSave}>
            Save Goals
          </Button>
        </div>
      </main>
    </div>
  );
}
