import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTodayDate } from "@/services/db";
import Header from "@/components/Header/Header";
import styles from "./Calendar.module.css";

export default function Calendar() {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  // TODO: Fetch logged days from Firestore
  const [loggedDays] = useState<Set<string>>(new Set());

  const today = getTodayDate();

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: { date: string; day: number; isCurrentMonth: boolean }[] = [];

    // Add days from previous month to fill the first week
    const startPadding = firstDay.getDay();
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({
        date: date.toISOString().split("T")[0],
        day: date.getDate(),
        isCurrentMonth: false,
      });
    }

    // Add days of current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      days.push({
        date: date.toISOString().split("T")[0],
        day,
        isCurrentMonth: true,
      });
    }

    // Add days from next month to complete the grid
    const endPadding = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= endPadding; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date: date.toISOString().split("T")[0],
        day: i,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentMonth]);

  const monthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDayClick = (date: string) => {
    navigate(`/log?date=${date}`);
  };

  return (
    <div className={styles.page}>
      <Header title="Calendar" currentPage="calendar" />

      <main className={styles.main}>
        <div className={styles.card}>
          {/* Month Navigation */}
          <div className={styles.monthNavigation}>
            <button className={styles.navButton} onClick={goToPrevMonth}>
              <ChevronLeft className={styles.icon} />
            </button>
            <h2 className={styles.monthTitle}>{monthName}</h2>
            <button className={styles.navButton} onClick={goToNextMonth}>
              <ChevronRight className={styles.icon} />
            </button>
          </div>

          {/* Day Headers */}
          <div className={styles.dayHeaders}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className={styles.dayHeader}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className={styles.calendarGrid}>
            {calendarDays.map(({ date, day, isCurrentMonth }) => {
              const isToday = date === today;
              const isLogged = loggedDays.has(date);
              const isFuture = date > today;

              let buttonClassName = styles.dayButton;
              if (!isCurrentMonth) buttonClassName += ` ${styles.dayOtherMonth}`;
              if (isToday) buttonClassName += ` ${styles.dayToday}`;

              return (
                <button
                  key={date}
                  onClick={() => !isFuture && handleDayClick(date)}
                  disabled={isFuture}
                  className={buttonClassName}
                >
                  {day}
                  {isLogged && <div className={styles.loggedIndicator} />}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <div className={styles.legendDotLogged} />
              <span>Logged</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendDotToday} />
              <span>Today</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
