import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { getTodayDate } from "@/services/db";
import styles from "./DatePickerCalendar.module.css";

type DatePickerCalendarProps = {
  selectedDates: Set<string>;
  onDateSelect: (date: string) => void;
  allowFutureDates?: boolean;
};

export default function DatePickerCalendar({
  selectedDates,
  onDateSelect,
  allowFutureDates = true,
}: DatePickerCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
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
    const isFuture = date > today;
    if (!allowFutureDates && isFuture) return;
    onDateSelect(date);
  };

  return (
    <div className={styles.calendar}>
      {/* Month Navigation */}
      <div className={styles.monthNavigation}>
        <button type="button" className={styles.navButton} onClick={goToPrevMonth}>
          <ChevronLeft className={styles.icon} />
        </button>
        <h3 className={styles.monthTitle}>{monthName}</h3>
        <button type="button" className={styles.navButton} onClick={goToNextMonth}>
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
          const isSelected = selectedDates.has(date);
          const isFuture = date > today;
          const isDisabled = !allowFutureDates && isFuture;

          let buttonClassName = styles.dayButton;
          if (!isCurrentMonth) buttonClassName += ` ${styles.dayOtherMonth}`;
          if (isToday) buttonClassName += ` ${styles.dayToday}`;
          if (isSelected) buttonClassName += ` ${styles.daySelected}`;

          return (
            <button
              key={date}
              type="button"
              onClick={() => handleDayClick(date)}
              disabled={isDisabled}
              className={buttonClassName}
            >
              {day}
              {isSelected && (
                <div className={styles.checkmark}>
                  <Check className={styles.checkIcon} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
