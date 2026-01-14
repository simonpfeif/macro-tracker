type DailySummaryProps = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export default function DailySummary({ calories, protein, carbs, fat }: DailySummaryProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 sticky top-6">
      <h3 className="font-semibold text-gray-800 mb-4">Daily Totals</h3>

      {/* Calories - Prominent */}
      <div className="text-center py-4 mb-4 bg-blue-50 rounded-lg">
        <div className="text-3xl font-bold text-gray-800">{Math.round(calories)}</div>
        <div className="text-sm text-gray-500">Calories</div>
      </div>

      {/* Macros */}
      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-gray-600">Protein</span>
          <span className="font-semibold text-gray-800">{Math.round(protein * 10) / 10}g</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-gray-600">Carbs</span>
          <span className="font-semibold text-gray-800">{Math.round(carbs * 10) / 10}g</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-gray-600">Fat</span>
          <span className="font-semibold text-gray-800">{Math.round(fat * 10) / 10}g</span>
        </div>
      </div>
    </div>
  );
}
