import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Goals() {
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const handleSave = () => {
    // TODO: Save goals to Firestore
    console.log("Save goals:", { calories, protein, carbs, fat });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Daily Goals</h1>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <p className="text-gray-500 mb-6">
          Set your daily nutrition targets. These will be used to track your progress.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Daily Calories
            </label>
            <Input
              type="number"
              placeholder="e.g., 2000"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Protein (g)
              </label>
              <Input
                type="number"
                placeholder="e.g., 150"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Carbs (g)
              </label>
              <Input
                type="number"
                placeholder="e.g., 200"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fat (g)
              </label>
              <Input
                type="number"
                placeholder="e.g., 65"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <h3 className="font-medium text-gray-800 mb-3">Quick Presets</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCalories("1500");
                setProtein("120");
                setCarbs("150");
                setFat("50");
              }}
            >
              Weight Loss
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCalories("2000");
                setProtein("150");
                setCarbs("200");
                setFat("65");
              }}
            >
              Maintenance
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCalories("2500");
                setProtein("180");
                setCarbs("280");
                setFat("80");
              }}
            >
              Muscle Gain
            </Button>
          </div>
        </div>

        <Button className="w-full mt-6" onClick={handleSave}>
          Save Goals
        </Button>
      </div>
    </div>
  );
}
