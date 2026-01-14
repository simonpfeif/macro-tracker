import styles from './DailySummary.module.css';

type DailySummaryProps = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export default function DailySummary({ calories, protein, carbs, fat }: DailySummaryProps) {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Daily Totals</h3>

      {/* Calories - Prominent */}
      <div className={styles.caloriesSection}>
        <div className={styles.caloriesValue}>{Math.round(calories)}</div>
        <div className={styles.caloriesLabel}>Calories</div>
      </div>

      {/* Macros */}
      <div className={styles.macrosContainer}>
        <div className={styles.macroRow}>
          <span className={styles.macroLabel}>Protein</span>
          <span className={styles.macroValue}>{Math.round(protein * 10) / 10}g</span>
        </div>
        <div className={styles.macroRow}>
          <span className={styles.macroLabel}>Carbs</span>
          <span className={styles.macroValue}>{Math.round(carbs * 10) / 10}g</span>
        </div>
        <div className={styles.macroRow}>
          <span className={styles.macroLabel}>Fat</span>
          <span className={styles.macroValue}>{Math.round(fat * 10) / 10}g</span>
        </div>
      </div>
    </div>
  );
}
