import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ChevronLeft, ChevronRight, Cake } from "lucide-react";
import {
  getTodayDate,
  getUserProfile,
  getDailyLogsForRange,
  getDateLimits,
} from "@/services/db";
import type { UserProfile, DailyLog, DailyLogStatus } from "@/types";
import Header from "@/components/Header/Header";
import styles from "./Calendar.module.css";

export default function Calendar() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [dailyLogs, setDailyLogs] = useState<Map<string, DailyLogStatus>>(new Map());

  const today = getTodayDate();

  // Calculate date limits based on user tier
  const dateLimits = getDateLimits(
    userProfile?.subscriptionTier || "free",
    userProfile?.birthday
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Load user profile
  const loadUserProfile = useCallback(async () => {
    if (!user) return;
    try {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  }, [user]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  // Load daily logs for the visible month
  const loadDailyLogs = useCallback(async () => {
    if (!user) return;

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Get range for the calendar (including padding days)
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Extend range to include padding days from prev/next month
    const startPadding = firstDay.getDay();
    const startDate = new Date(year, month, 1 - startPadding);
    const endPadding = 42 - (startPadding + lastDay.getDate());
    const endDate = new Date(year, month + 1, endPadding);

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    try {
      const logs = await getDailyLogsForRange(user.uid, startDateStr, endDateStr);
      const logsMap = new Map<string, DailyLogStatus>();
      logs.forEach((log: DailyLog) => {
        logsMap.set(log.date, log.status);
      });
      setDailyLogs(logsMap);
    } catch (error) {
      console.error("Error loading daily logs:", error);
    }
  }, [user, currentMonth]);

  useEffect(() => {
    loadDailyLogs();
  }, [loadDailyLogs]);

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

  // Check if a date is user's birthday (ignoring year)
  const isBirthday = (date: string) => {
    if (!userProfile?.birthday) return false;
    const birthdayMonthDay = userProfile.birthday.slice(5); // "MM-DD"
    const dateMonthDay = date.slice(5); // "MM-DD"
    return birthdayMonthDay === dateMonthDay;
  };

  // Check if prev month navigation should be disabled
  const canGoPrevMonth = () => {
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
    const lastDayOfPrevMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0);
    const lastDayStr = lastDayOfPrevMonth.toISOString().split("T")[0];
    return lastDayStr >= dateLimits.minDate;
  };

  // Check if next month navigation should be disabled
  const canGoNextMonth = () => {
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
    const firstDayOfNextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
    const firstDayStr = firstDayOfNextMonth.toISOString().split("T")[0];
    return firstDayStr <= dateLimits.maxDate;
  };

  const goToPrevMonth = () => {
    if (canGoPrevMonth()) {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    }
  };

  const goToNextMonth = () => {
    if (canGoNextMonth()) {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    }
  };

  const handleDayClick = (date: string) => {
    // Only navigate if date is within limits
    if (date >= dateLimits.minDate && date <= dateLimits.maxDate) {
      navigate(`/log?date=${date}`);
    }
  };

  return (
    <div className={styles.page}>
      <Header title="Calendar" currentPage="calendar" />

      <main className={styles.main}>
        <div className={styles.card}>
          {/* Month Navigation */}
          <div className={styles.monthNavigation}>
            <button
              className={`${styles.navButton} ${!canGoPrevMonth() ? styles.navButtonDisabled : ""}`}
              onClick={goToPrevMonth}
              disabled={!canGoPrevMonth()}
            >
              <ChevronLeft className={styles.icon} />
            </button>
            <h2 className={styles.monthTitle}>{monthName}</h2>
            <button
              className={`${styles.navButton} ${!canGoNextMonth() ? styles.navButtonDisabled : ""}`}
              onClick={goToNextMonth}
              disabled={!canGoNextMonth()}
            >
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
              const logStatus = dailyLogs.get(date);
              const isOutOfRange = date < dateLimits.minDate || date > dateLimits.maxDate;
              const showBirthday = isBirthday(date);

              let buttonClassName = styles.dayButton;
              if (!isCurrentMonth) buttonClassName += ` ${styles.dayOtherMonth}`;
              if (isToday) buttonClassName += ` ${styles.dayToday}`;
              if (isOutOfRange) buttonClassName += ` ${styles.dayDisabled}`;

              return (
                <button
                  key={date}
                  onClick={() => handleDayClick(date)}
                  disabled={isOutOfRange}
                  className={buttonClassName}
                >
                  {day}
                  {showBirthday && (
                    <div className={styles.birthdayIcon}>
                      <Cake className={styles.cakeIcon} />
                    </div>
                  )}
                  {logStatus === "started" && (
                    <div className={`${styles.statusIndicator} ${styles.statusStarted}`} />
                  )}
                  {logStatus === "complete" && (
                    <div className={`${styles.statusIndicator} ${styles.statusComplete}`} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <div className={styles.legendDotStarted} />
              <span>In Progress</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendDotComplete} />
              <span>Complete</span>
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
