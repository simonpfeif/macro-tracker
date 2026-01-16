import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./DateNavigation.module.css";

type DateNavigationProps = {
  selectedDate: string;
  isToday: boolean;
  formattedDate: string;
  onPrevDay: () => void;
  onNextDay: () => void;
};

export default function DateNavigation({
  selectedDate,
  isToday,
  formattedDate,
  onPrevDay,
  onNextDay,
}: DateNavigationProps) {
  return (
    <div className={styles.dateNavigation}>
      <button onClick={onPrevDay} className={styles.navButton}>
        <ChevronLeft className={styles.icon} />
      </button>

      <div className={styles.dateContainer}>
        <h1 className={styles.dateTitle}>{isToday ? "Today" : formattedDate}</h1>
        {isToday && <p className={styles.dateSubtitle}>{formattedDate}</p>}
      </div>

      <button
        onClick={onNextDay}
        disabled={isToday}
        className={`${styles.navButton} ${isToday ? styles.navButtonInvisible : ""}`}
      >
        <ChevronRight className={styles.icon} />
      </button>
    </div>
  );
}
