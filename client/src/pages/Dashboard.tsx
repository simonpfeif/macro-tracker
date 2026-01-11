import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { UtensilsCrossed, Calendar, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome back{user?.displayName ? `, ${user.displayName.split(" ")[0]}` : ""}!
        </h1>
        <p className="text-gray-500 mt-1">Here's your nutrition overview</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Streak</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">0 days</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">This Week</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">0/7</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Target className="w-4 h-4" />
            <span className="text-sm">Goal</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">--</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <UtensilsCrossed className="w-4 h-4" />
            <span className="text-sm">Today</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">0 cal</p>
        </div>
      </div>

      {/* Weight Progress Placeholder */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Weight Progress</h2>
        <div className="h-48 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-gray-400">No weight data yet. Start tracking to see your progress.</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link to="/log">
            <Button className="w-full justify-start gap-2" variant="outline">
              <UtensilsCrossed className="w-4 h-4" />
              Log Today's Meals
            </Button>
          </Link>
          <Link to="/calendar">
            <Button className="w-full justify-start gap-2" variant="outline">
              <Calendar className="w-4 h-4" />
              View Calendar
            </Button>
          </Link>
          <Link to="/goals">
            <Button className="w-full justify-start gap-2" variant="outline">
              <Target className="w-4 h-4" />
              Set Goals
            </Button>
          </Link>
          <Link to="/foods">
            <Button className="w-full justify-start gap-2" variant="outline">
              <TrendingUp className="w-4 h-4" />
              Manage Foods
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
