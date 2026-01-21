import { useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon, Bell, Shield, Database, Cake, Crown } from "lucide-react";
import { seedCommonFoods, getCommonFoods, getUserProfile, saveUserProfile } from "@/services/db";
import { commonFoodsData } from "@/data/commonFoods";
import type { UserProfile } from "@/types";
import Header from "@/components/Header/Header";
import styles from "./Settings.module.css";

export default function Settings() {
  const [user, setUser] = useState<User | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<"idle" | "success" | "error" | "exists">("idle");
  const [foodCount, setFoodCount] = useState<number | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [birthday, setBirthday] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Check if foods already exist
  useEffect(() => {
    async function checkFoods() {
      try {
        const foods = await getCommonFoods();
        setFoodCount(foods.length);
        if (foods.length > 0) {
          setSeedStatus("exists");
        }
      } catch (error) {
        console.error("Error checking foods:", error);
      }
    }
    checkFoods();
  }, []);

  // Load user profile
  const loadUserProfile = useCallback(async () => {
    if (!user) return;
    try {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
      if (profile?.birthday) {
        setBirthday(profile.birthday);
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  }, [user]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  const handleBirthdayChange = async (newBirthday: string) => {
    if (!user) return;
    setBirthday(newBirthday);

    try {
      await saveUserProfile(user.uid, { birthday: newBirthday });
      setUserProfile((prev) =>
        prev
          ? { ...prev, birthday: newBirthday, updatedAt: new Date() }
          : {
              birthday: newBirthday,
              subscriptionTier: "free",
              createdAt: new Date(),
              updatedAt: new Date(),
            }
      );
    } catch (error) {
      console.error("Error saving birthday:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleSeedDatabase = async () => {
    setSeeding(true);
    setSeedStatus("idle");
    try {
      await seedCommonFoods(commonFoodsData);
      setSeedStatus("success");
      setFoodCount(commonFoodsData.length);
    } catch (error) {
      console.error("Error seeding database:", error);
      setSeedStatus("error");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className={styles.page}>
      <Header title="Settings" currentPage="settings" />

      <main className={styles.main}>
        {/* Account Section */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <UserIcon className={styles.cardIcon} />
            <h2 className={styles.cardTitle}>Account</h2>
          </div>

          {user && (
            <div className={styles.accountInfo}>
              <div className={styles.accountRow}>
                <span className={styles.accountLabel}>Name</span>
                <span className={styles.accountValue}>{user.displayName || "Not set"}</span>
              </div>
              <div className={styles.accountRow}>
                <span className={styles.accountLabel}>Email</span>
                <span className={styles.accountValue}>{user.email}</span>
              </div>
              <div className={`${styles.accountRow} ${styles.accountRowLast}`}>
                <span className={styles.accountLabel}>Member since</span>
                <span className={styles.accountValue}>
                  {user.metadata.creationTime
                    ? new Date(user.metadata.creationTime).toLocaleDateString()
                    : "Unknown"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Profile Section */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Cake className={styles.cardIcon} />
            <h2 className={styles.cardTitle}>Profile</h2>
          </div>

          <div className={styles.profileInfo}>
            <div className={styles.profileRow}>
              <span className={styles.profileLabel}>Birthday</span>
              <input
                type="date"
                value={birthday}
                onChange={(e) => handleBirthdayChange(e.target.value)}
                className={styles.dateInput}
              />
            </div>
            <div className={`${styles.profileRow} ${styles.profileRowLast}`}>
              <span className={styles.profileLabel}>Subscription</span>
              <div className={styles.subscriptionBadge}>
                <Crown className={styles.subscriptionIcon} />
                <span>{userProfile?.subscriptionTier === "premium" ? "Premium" : "Free"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Database Section */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Database className={styles.cardIcon} />
            <h2 className={styles.cardTitle}>Database</h2>
          </div>

          <p className={styles.description}>
            {foodCount !== null && foodCount > 0
              ? `${foodCount} common foods loaded.`
              : "Seed the database with common foods (chicken, rice, eggs, etc.)"}
          </p>

          {seedStatus === "success" && (
            <p className={styles.successMessage}>
              Successfully added {commonFoodsData.length} common foods!
            </p>
          )}

          {seedStatus === "error" && (
            <p className={styles.errorMessage}>
              Error seeding database. Check console for details. Make sure Firestore rules allow writes to /foods collection.
            </p>
          )}

          <Button
            variant="outline"
            className={styles.fullWidthButton}
            onClick={handleSeedDatabase}
            disabled={seeding || seedStatus === "exists" || seedStatus === "success"}
          >
            <Database className={styles.buttonIcon} />
            {seeding
              ? "Seeding..."
              : seedStatus === "exists" || seedStatus === "success"
              ? "Database Already Seeded"
              : "Seed Common Foods"}
          </Button>
        </div>

        {/* Notifications Section */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Bell className={styles.cardIcon} />
            <h2 className={styles.cardTitle}>Notifications</h2>
          </div>
          <p className={styles.description}>Coming soon</p>
        </div>

        {/* Privacy Section */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Shield className={styles.cardIcon} />
            <h2 className={styles.cardTitle}>Privacy</h2>
          </div>
          <p className={styles.description}>Your data is stored securely and never shared.</p>
        </div>

        {/* Sign Out */}
        <Button
          variant="destructive"
          className={styles.fullWidthButton}
          onClick={handleSignOut}
        >
          <LogOut className={styles.buttonIcon} />
          Sign Out
        </Button>
      </main>
    </div>
  );
}
