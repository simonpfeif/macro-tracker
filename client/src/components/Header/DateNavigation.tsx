import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./DateNavigation.module.css";

type DateNavigationProps = {
  selectedDate: string;
  isToday: boolean;
  formattedDate: string;
  onPrevDay: () => void;
  onNextDay: () => void;
  minDate?: string;
  maxDate?: string;
};

export default function DateNavigation({
  selectedDate,
  isToday,
  formattedDate,
  onPrevDay,
  onNextDay,
  minDate,
  maxDate,
}: DateNavigationProps) {
  // Check if we can navigate backward
  const canGoPrev = !minDate || selectedDate > minDate;

  // Check if we can navigate forward
  const canGoNext = !maxDate || selectedDate < maxDate;

  return (
    <div className={styles.dateNavigation}>
      <button
        onClick={onPrevDay}
        disabled={!canGoPrev}
        className={`${styles.navButton} ${!canGoPrev ? styles.navButtonDisabled : ""}`}
      >
        <ChevronLeft className={styles.icon} />
      </button>

      <div className={styles.dateContainer}>
        <h1 className={styles.dateTitle}>{isToday ? "Today" : formattedDate}</h1>
        {isToday && <p className={styles.dateSubtitle}>{formattedDate}</p>}
      </div>

      <button
        onClick={onNextDay}
        disabled={!canGoNext}
        className={`${styles.navButton} ${!canGoNext ? styles.navButtonDisabled : ""}`}
      >
        <ChevronRight className={styles.icon} />
      </button>
    </div>
  );
}
