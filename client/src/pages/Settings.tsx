import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon, Bell, Shield, Database } from "lucide-react";
import { seedCommonFoods, getCommonFoods } from "@/services/db";
import { commonFoodsData } from "@/data/commonFoods";

export default function Settings() {
  const [user, setUser] = useState<User | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<"idle" | "success" | "error" | "exists">("idle");
  const [foodCount, setFoodCount] = useState<number | null>(null);

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
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>

      {/* Account Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <UserIcon className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-800">Account</h2>
        </div>

        {user && (
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Name</span>
              <span className="text-gray-800">{user.displayName || "Not set"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Email</span>
              <span className="text-gray-800">{user.email}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Member since</span>
              <span className="text-gray-800">
                {user.metadata.creationTime
                  ? new Date(user.metadata.creationTime).toLocaleDateString()
                  : "Unknown"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Database Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-800">Database</h2>
        </div>

        <p className="text-gray-500 text-sm mb-4">
          {foodCount !== null && foodCount > 0
            ? `${foodCount} common foods loaded.`
            : "Seed the database with common foods (chicken, rice, eggs, etc.)"}
        </p>

        {seedStatus === "success" && (
          <p className="text-green-600 text-sm mb-4">
            Successfully added {commonFoodsData.length} common foods!
          </p>
        )}

        {seedStatus === "error" && (
          <p className="text-red-600 text-sm mb-4">
            Error seeding database. Check console for details. Make sure Firestore rules allow writes to /foods collection.
          </p>
        )}

        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={handleSeedDatabase}
          disabled={seeding || seedStatus === "exists" || seedStatus === "success"}
        >
          <Database className="w-4 h-4" />
          {seeding
            ? "Seeding..."
            : seedStatus === "exists" || seedStatus === "success"
            ? "Database Already Seeded"
            : "Seed Common Foods"}
        </Button>
      </div>

      {/* Notifications Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-800">Notifications</h2>
        </div>
        <p className="text-gray-500 text-sm">Coming soon</p>
      </div>

      {/* Privacy Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-800">Privacy</h2>
        </div>
        <p className="text-gray-500 text-sm">Your data is stored securely and never shared.</p>
      </div>

      {/* Sign Out */}
      <Button
        variant="destructive"
        className="w-full gap-2"
        onClick={handleSignOut}
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </Button>
    </div>
  );
}
