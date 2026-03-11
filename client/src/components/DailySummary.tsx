import { useState } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { DailyLogStatus, GoalType, UserGoals } from '@/types';
import { getMacroColor, getProgressColor, getLimitColor } from '@/utils/colorLogic';
import styles from './DailySummary.module.css';

// Default daily goals (fallback when user hasn't set goals)
const DEFAULT_GOALS: UserGoals = {
  goalType: 'maintenance',
  calories: 2000,
  protein: 150,
  carbs: 225,
  fat: 65,
  fiber: 28,
  saturatedFat: 20,
  transFat: 2,
  cholesterol: 300,
  sodium: 2300,
  sugar: 50,
  addedSugar: 25,
  vitaminD: 20,
  calcium: 1000,
  iron: 18,
  potassium: 3500,
};

type DailySummaryProps = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  // Micronutrients
  fiber?: number;
  saturatedFat?: number;
  transFat?: number;
  cholesterol?: number;
  sodium?: number;
  sugar?: number;
  addedSugar?: number;
  vitaminD?: number;
  calcium?: number;
  iron?: number;
  potassium?: number;
  logStatus?: DailyLogStatus;
  onCompleteLog?: () => void;
  // User goals (optional, uses defaults if not provided)
  userGoals?: UserGoals;
};


type ProgressRowProps = {
  label: string;
  current: number;
  goal: number;
  unit: string;
  isLimit?: boolean;
  isMacro?: boolean;
  goalType?: GoalType;
  colorClass?: string;
};

function ProgressRow({ label, current, goal, unit, isLimit = false, isMacro = false, goalType = 'maintenance', colorClass }: ProgressRowProps) {
  const percent = goal > 0 ? (current / goal) * 100 : 0;
  const displayPercent = Math.min(percent, 100); // Cap bar at 100%

  // Use goal-aware coloring for main macros, otherwise use existing logic
  let color: 'red' | 'yellow' | 'green';
  if (isMacro) {
    color = getMacroColor(percent, goalType);
  } else if (isLimit) {
    color = getLimitColor(percent);
  } else {
    color = getProgressColor(percent);
  }

  const fillColorClass =
    color === 'red'
      ? styles.fillRed
      : color === 'yellow'
        ? styles.fillYellow
        : styles.fillGreen;

  // Format value based on magnitude
  const formatValue = (val: number) => {
    if (val >= 100) return Math.round(val);
    return Math.round(val * 10) / 10;
  };

  return (
    <div className={`${styles.progressRow} ${colorClass || ''}`}>
      <span className={styles.progressLabel}>{label}</span>
      <div className={styles.progressBarContainer}>
        <div className={styles.progressBar}>
          <div
            className={`${styles.progressFill} ${fillColorClass}`}
            style={{ width: `${displayPercent}%` }}
          />
        </div>
      </div>
      <span className={styles.progressValue}>
        {formatValue(current)} / {goal}
        {unit}
      </span>
    </div>
  );
}

export default function DailySummary({
  calories,
  protein,
  carbs,
  fat,
  fiber = 0,
  saturatedFat = 0,
  transFat = 0,
  cholesterol = 0,
  sodium = 0,
  sugar = 0,
  addedSugar = 0,
  vitaminD = 0,
  calcium = 0,
  iron = 0,
  potassium = 0,
  logStatus = 'unlogged',
  onCompleteLog,
  userGoals,
}: DailySummaryProps) {
  const [showMicronutrients, setShowMicronutrients] = useState(false);

  // Merge user goals with defaults
  const goals = { ...DEFAULT_GOALS, ...userGoals };

  return (
    <div className={styles.card}>
      <div className={styles.titleRow}>
        <h3 className={styles.title}>Daily Totals</h3>
        {logStatus !== 'unlogged' && (
          <span
            className={`${styles.statusBadge} ${
              logStatus === 'complete' ? styles.statusComplete : styles.statusStarted
            }`}
          >
            {logStatus === 'complete' ? 'Complete' : 'In Progress'}
          </span>
        )}
      </div>

      {/* Main Nutrients with Progress Bars */}
      <div className={styles.nutritionContainer}>
        <ProgressRow
          label="Calories"
          current={calories}
          goal={goals.calories}
          unit=""
          isMacro
          goalType={goals.goalType}
          colorClass={styles.progressRowCalories}
        />
        <ProgressRow
          label="Protein"
          current={protein}
          goal={goals.protein}
          unit="g"
          isMacro
          goalType={goals.goalType}
          colorClass={styles.progressRowProtein}
        />
        <ProgressRow
          label="Fat"
          current={fat}
          goal={goals.fat}
          unit="g"
          isMacro
          goalType={goals.goalType}
          colorClass={styles.progressRowFat}
        />
        <ProgressRow
          label="Carbs"
          current={carbs}
          goal={goals.carbs}
          unit="g"
          isMacro
          goalType={goals.goalType}
          colorClass={styles.progressRowCarbs}
        />
      </div>

      {/* Micronutrients Toggle */}
      <button
        className={styles.toggleButton}
        onClick={() => setShowMicronutrients(!showMicronutrients)}
      >
        {showMicronutrients ? (
          <>
            <ChevronUp className={styles.toggleIcon} />
            Show Less
          </>
        ) : (
          <>
            <ChevronDown className={styles.toggleIcon} />
            Show More
          </>
        )}
      </button>

      {/* Micronutrients Section */}
      {showMicronutrients && (
        <div className={styles.micronutrientsSection}>
          <ProgressRow
            label="Fiber"
            current={fiber}
            goal={goals.fiber ?? DEFAULT_GOALS.fiber!}
            unit="g"
          />
          <ProgressRow
            label="Saturated Fat"
            current={saturatedFat}
            goal={goals.saturatedFat ?? DEFAULT_GOALS.saturatedFat!}
            unit="g"
            isLimit
          />
          <ProgressRow
            label="Trans Fat"
            current={transFat}
            goal={goals.transFat ?? DEFAULT_GOALS.transFat!}
            unit="g"
            isLimit
          />
          <ProgressRow
            label="Cholesterol"
            current={cholesterol}
            goal={goals.cholesterol ?? DEFAULT_GOALS.cholesterol!}
            unit="mg"
            isLimit
          />
          <ProgressRow
            label="Sodium"
            current={sodium}
            goal={goals.sodium ?? DEFAULT_GOALS.sodium!}
            unit="mg"
            isLimit
          />
          <ProgressRow
            label="Sugar"
            current={sugar}
            goal={goals.sugar ?? DEFAULT_GOALS.sugar!}
            unit="g"
            isLimit
          />
          <ProgressRow
            label="Added Sugar"
            current={addedSugar}
            goal={goals.addedSugar ?? DEFAULT_GOALS.addedSugar!}
            unit="g"
            isLimit
          />
          <ProgressRow
            label="Vitamin D"
            current={vitaminD}
            goal={goals.vitaminD ?? DEFAULT_GOALS.vitaminD!}
            unit="mcg"
          />
          <ProgressRow
            label="Calcium"
            current={calcium}
            goal={goals.calcium ?? DEFAULT_GOALS.calcium!}
            unit="mg"
          />
          <ProgressRow
            label="Iron"
            current={iron}
            goal={goals.iron ?? DEFAULT_GOALS.iron!}
            unit="mg"
          />
          <ProgressRow
            label="Potassium"
            current={potassium}
            goal={goals.potassium ?? DEFAULT_GOALS.potassium!}
            unit="mg"
          />
        </div>
      )}

      {/* Complete Log Button */}
      {logStatus !== 'complete' && onCompleteLog && (
        <button className={styles.completeLogButton} onClick={onCompleteLog}>
          <Check className={styles.completeIcon} />
          Complete Log
        </button>
      )}
    </div>
  );
}
