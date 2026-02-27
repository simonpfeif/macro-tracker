import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  getUserGoals,
  getMealsByDate,
  getDailyLogsForRange,
  saveWeightLog,
  getWeightLogs,
  getTodayDate,
} from "@/services/db";
import type { UserGoals, WeightLog } from "@/types";
import { TrendingUp, Calendar, Target, Apple } from "lucide-react";
import Header from "@/components/Header/Header";
import WeightChart from "@/components/WeightChart/WeightChart";
import styles from "./Dashboard.module.css";

// ── Local helper component ────────────────────────────────────────────────────

type MacroProgressBarProps = {
  label: string;
  consumed: number;
  goal: number;
  unit: string;
  color: string;
};

function MacroProgressBar({ label, consumed, goal, unit, color }: MacroProgressBarProps) {
  const pct = goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0;
  return (
    <div className={styles.macroProgressRow}>
      <div className={styles.macroProgressHeader}>
        <span className={styles.macroProgressLabel}>{label}</span>
        <span className={styles.macroProgressValues}>
          {Math.round(consumed)} / {goal}{unit}
        </span>
      </div>
      <div className={styles.macroProgressTrack}>
        <div
          className={styles.macroProgressFill}
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day; // Monday = 1
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [goals, setGoals] = useState<UserGoals | null>(null);
  const [todayMacros, setTodayMacros] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [streak, setStreak] = useState(0);
  const [weekCount, setWeekCount] = useState(0);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [weightInput, setWeightInput] = useState("");
  const [weightUnit, setWeightUnit] = useState<"lbs" | "kg">("lbs");
  const [loggingWeight, setLoggingWeight] = useState(false);
  const [importingHealth, setImportingHealth] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const today = getTodayDate();
    const thirtyDaysAgo = formatDateStr(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

    // Fetch all data in parallel
    Promise.all([
      getUserGoals(user.uid),
      getMealsByDate(user.uid, today),
      getDailyLogsForRange(user.uid, thirtyDaysAgo, today),
      getWeightLogs(user.uid, 30),
    ]).then(([fetchedGoals, meals, logs, wLogs]) => {
      setGoals(fetchedGoals);

      // Sum today's macros from meals
      const macros = meals.reduce(
        (acc, meal) => {
          for (const food of meal.foods) {
            acc.calories += food.calories;
            acc.protein += food.protein;
            acc.carbs += food.carbs;
            acc.fat += food.fat;
          }
          return acc;
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
      setTodayMacros(macros);

      // Build a set of logged dates
      const loggedDates = new Set(
        logs
          .filter((l) => l.status === "complete" || l.status === "started")
          .map((l) => l.date)
      );

      // Streak: consecutive days backwards from today
      let s = 0;
      const now = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const ds = formatDateStr(d);
        if (loggedDates.has(ds)) {
          s++;
        } else {
          break;
        }
      }
      setStreak(s);

      // Week count: Monday of current week → today
      const monday = getMondayOfWeek(now);
      let wc = 0;
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(d.getDate() + i);
        if (d > now) break;
        if (loggedDates.has(formatDateStr(d))) wc++;
      }
      setWeekCount(wc);

      setWeightLogs(wLogs);
    });
  }, [user]);

  async function handleLogWeight() {
    if (!user || !weightInput) return;
    const val = parseFloat(weightInput);
    if (isNaN(val) || val <= 0) return;
    setLoggingWeight(true);
    try {
      await saveWeightLog(user.uid, { date: getTodayDate(), weight: val, unit: weightUnit });
      const updated = await getWeightLogs(user.uid, 30);
      setWeightLogs(updated);
      setWeightInput("");
    } finally {
      setLoggingWeight(false);
    }
  }

  async function handleHealthImport(e: React.ChangeEvent<HTMLInputElement>) {
    if (!user || !e.target.files?.[0]) return;
    setImportingHealth(true);
    try {
      const text = await e.target.files[0].text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, "application/xml");
      const records = Array.from(
        xml.querySelectorAll('Record[type="HKQuantityTypeIdentifierBodyMass"]')
      );
      if (records.length === 0) {
        alert("No body mass records found in this file.");
        return;
      }
      const seen = new Set<string>();
      for (const rec of records) {
        const dateStr = rec.getAttribute("startDate")?.split(" ")[0]; // YYYY-MM-DD
        const value = parseFloat(rec.getAttribute("value") ?? "0");
        const srcUnit = rec.getAttribute("unit") ?? "lb";
        if (!dateStr || isNaN(value) || value <= 0 || seen.has(dateStr)) continue;
        seen.add(dateStr);
        const unit: "lbs" | "kg" = srcUnit.toLowerCase().startsWith("kg") ? "kg" : "lbs";
        await saveWeightLog(user.uid, { date: dateStr, weight: value, unit });
      }
      const updated = await getWeightLogs(user.uid, 30);
      setWeightLogs(updated);
    } finally {
      setImportingHealth(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const goalTypeLabel: Record<string, string> = {
    loss: "Fat Loss",
    maintenance: "Maintenance",
    gain: "Muscle Gain",
  };

  const latestWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1] : null;

  return (
    <div className={styles.page}>
      <Header title="SnackStat" currentPage="dashboard" />

      <main className={styles.main}>
        {/* Welcome */}
        <div className={styles.welcomeHeader}>
          <h1 className={styles.welcomeTitle}>
            Welcome back{user?.displayName ? `, ${user.displayName.split(" ")[0]}` : ""}!
          </h1>
          <p className={styles.welcomeSubtitle}>Here's your nutrition overview</p>
        </div>

        {/* Stats grid — 3 cards */}
        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.statCardStreak}`}>
            <div className={styles.statHeader}>
              <div className={styles.statIconWrapper}>
                <TrendingUp className={styles.statIcon} />
              </div>
              <span className={styles.statLabel}>Streak</span>
            </div>
            <p className={styles.statValue}>{streak} {streak === 1 ? "day" : "days"}</p>
          </div>

          <div className={`${styles.statCard} ${styles.statCardWeek}`}>
            <div className={styles.statHeader}>
              <div className={styles.statIconWrapper}>
                <Calendar className={styles.statIcon} />
              </div>
              <span className={styles.statLabel}>This Week</span>
            </div>
            <p className={styles.statValue}>{weekCount}/7</p>
          </div>

          <div className={`${styles.statCard} ${styles.statCardGoal}`}>
            <div className={styles.statHeader}>
              <div className={styles.statIconWrapper}>
                <Target className={styles.statIcon} />
              </div>
              <span className={styles.statLabel}>Goal</span>
            </div>
            <p className={styles.statValue}>
              {goals ? goalTypeLabel[goals.goalType] ?? "--" : "--"}
            </p>
          </div>
        </div>

        {/* Today's Progress */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleRow}>
              <span className={styles.cardTitle}>Today's Progress</span>
            </div>
            <Link to="/log" className={styles.cardAction}>Log food →</Link>
          </div>
          {goals ? (
            <div className={styles.macroProgressStack}>
              <MacroProgressBar
                label="Calories"
                consumed={todayMacros.calories}
                goal={goals.calories}
                unit=" kcal"
                color="var(--color-orange)"
              />
              <MacroProgressBar
                label="Protein"
                consumed={todayMacros.protein}
                goal={goals.protein}
                unit="g"
                color="var(--color-red)"
              />
              <MacroProgressBar
                label="Carbs"
                consumed={todayMacros.carbs}
                goal={goals.carbs}
                unit="g"
                color="var(--color-yellow)"
              />
              <MacroProgressBar
                label="Fat"
                consumed={todayMacros.fat}
                goal={goals.fat}
                unit="g"
                color="var(--color-green)"
              />
            </div>
          ) : (
            <p className={styles.placeholderText}>
              <Link to="/goals" className={styles.link}>Set your goals</Link> to see progress tracking.
            </p>
          )}
        </div>

        {/* Daily Targets */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleRow}>
              <span className={styles.cardTitle}>Daily Targets</span>
            </div>
            {goals && (
              <span
                className={styles.goalBadge}
                style={{
                  borderColor:
                    goals.goalType === "loss"
                      ? "var(--color-red)"
                      : goals.goalType === "gain"
                      ? "var(--color-green)"
                      : "var(--color-yellow)",
                  color:
                    goals.goalType === "loss"
                      ? "var(--color-red)"
                      : goals.goalType === "gain"
                      ? "var(--color-green)"
                      : "var(--color-text-secondary)",
                }}
              >
                {goalTypeLabel[goals.goalType]}
              </span>
            )}
          </div>
          {goals ? (
            <div className={styles.macroGrid}>
              <div className={`${styles.macroItem} ${styles.macroItemCalories}`}>
                <span className={styles.macroValue}>{goals.calories}</span>
                <span className={styles.macroLabel}>Calories</span>
              </div>
              <div className={`${styles.macroItem} ${styles.macroItemProtein}`}>
                <span className={styles.macroValue}>{goals.protein}g</span>
                <span className={styles.macroLabel}>Protein</span>
              </div>
              <div className={`${styles.macroItem} ${styles.macroItemCarbs}`}>
                <span className={styles.macroValue}>{goals.carbs}g</span>
                <span className={styles.macroLabel}>Carbs</span>
              </div>
              <div className={`${styles.macroItem} ${styles.macroItemFat}`}>
                <span className={styles.macroValue}>{goals.fat}g</span>
                <span className={styles.macroLabel}>Fat</span>
              </div>
            </div>
          ) : (
            <p className={styles.placeholderText}>
              <Link to="/goals" className={styles.link}>Set your goals</Link> to see daily targets.
            </p>
          )}
        </div>

        {/* Weight Progress */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleRow}>
              <span className={styles.cardTitle}>Weight Progress</span>
            </div>
            {latestWeight && (
              <span className={styles.latestWeight}>
                {latestWeight.weight} {latestWeight.unit}
              </span>
            )}
          </div>

          {/* Inline log form */}
          <div className={styles.weightForm}>
            <input
              type="number"
              className={styles.weightInput}
              placeholder="0.0"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              min="0"
              step="0.1"
            />
            <select
              className={styles.unitSelect}
              value={weightUnit}
              onChange={(e) => setWeightUnit(e.target.value as "lbs" | "kg")}
            >
              <option value="lbs">lbs</option>
              <option value="kg">kg</option>
            </select>
            <button
              className={styles.logButton}
              onClick={handleLogWeight}
              disabled={loggingWeight || !weightInput}
            >
              {loggingWeight ? "Saving…" : "Log"}
            </button>
          </div>

          {/* Apple Health import */}
          <button
            className={styles.appleHealthButton}
            onClick={() => fileInputRef.current?.click()}
            disabled={importingHealth}
          >
            <Apple className={styles.buttonIcon} size="1rem" />
            {importingHealth ? "Importing…" : "Import from Apple Health"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xml"
            className={styles.hiddenFileInput}
            onChange={handleHealthImport}
          />

          <WeightChart logs={weightLogs} />
        </div>
      </main>
    </div>
  );
}
