import { Check } from 'lucide-react';
import type { DailyLogStatus } from '@/types';
import styles from './DailySummary.module.css';

type DailySummaryProps = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  logStatus?: DailyLogStatus;
  onCompleteLog?: () => void;
};

export default function DailySummary({
  calories,
  protein,
  carbs,
  fat,
  logStatus = 'unlogged',
  onCompleteLog,
}: DailySummaryProps) {
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

      {/* Calories - Prominent */}
      <div className={styles.caloriesSection}>
        <div className={styles.caloriesValue}>{Math.round(calories)}</div>
        <div className={styles.caloriesLabel}>Calories</div>
      </div>

      {/* Macros */}
      <div className={styles.macrosContainer}>
        <div className={`${styles.macroRow} ${styles.macroRowProtein}`}>
          <span className={styles.macroLabel}>Protein</span>
          <span className={styles.macroValue}>{Math.round(protein * 10) / 10}g</span>
        </div>
        <div className={`${styles.macroRow} ${styles.macroRowCarbs}`}>
          <span className={styles.macroLabel}>Carbs</span>
          <span className={styles.macroValue}>{Math.round(carbs * 10) / 10}g</span>
        </div>
        <div className={`${styles.macroRow} ${styles.macroRowFat}`}>
          <span className={styles.macroLabel}>Fat</span>
          <span className={styles.macroValue}>{Math.round(fat * 10) / 10}g</span>
        </div>
      </div>

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
