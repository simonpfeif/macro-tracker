import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { UtensilsCrossed, Calendar, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header/Header";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className={styles.page}>
      <Header title="SnackStat" currentPage="dashboard" />

      <main className={styles.main}>
        {/* Welcome Header */}
        <div className={styles.welcomeHeader}>
          <h1 className={styles.welcomeTitle}>
            Welcome back{user?.displayName ? `, ${user.displayName.split(" ")[0]}` : ""}!
          </h1>
          <p className={styles.welcomeSubtitle}>Here's your nutrition overview</p>
        </div>

      {/* Quick Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <TrendingUp className={styles.icon} />
            <span className={styles.statLabel}>Streak</span>
          </div>
          <p className={styles.statValue}>0 days</p>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <Calendar className={styles.icon} />
            <span className={styles.statLabel}>This Week</span>
          </div>
          <p className={styles.statValue}>0/7</p>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <Target className={styles.icon} />
            <span className={styles.statLabel}>Goal</span>
          </div>
          <p className={styles.statValue}>--</p>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <UtensilsCrossed className={styles.icon} />
            <span className={styles.statLabel}>Today</span>
          </div>
          <p className={styles.statValue}>0 cal</p>
        </div>
      </div>

      {/* Weight Progress Placeholder */}
      <div className={styles.weightCard}>
        <h2 className={styles.weightTitle}>Weight Progress</h2>
        <div className={styles.weightPlaceholder}>
          <p className={styles.weightPlaceholderText}>No weight data yet. Start tracking to see your progress.</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.actionsCard}>
        <h2 className={styles.actionsTitle}>Quick Actions</h2>
        <div className={styles.actionsGrid}>
          <Link to="/log">
            <Button className={styles.actionButton} variant="outline">
              <UtensilsCrossed className={styles.icon} />
              Log Today's Meals
            </Button>
          </Link>
          <Link to="/calendar">
            <Button className={styles.actionButton} variant="outline">
              <Calendar className={styles.icon} />
              View Calendar
            </Button>
          </Link>
          <Link to="/goals">
            <Button className={styles.actionButton} variant="outline">
              <Target className={styles.icon} />
              Set Goals
            </Button>
          </Link>
          <Link to="/foods">
            <Button className={styles.actionButton} variant="outline">
              <TrendingUp className={styles.icon} />
              Manage Foods
            </Button>
          </Link>
        </div>
      </div>
      </main>
    </div>
  );
}
