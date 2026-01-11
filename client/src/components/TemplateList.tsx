import { Button } from "@/components/ui/button";
import type { MealTemplate } from "@/types";

type TemplateListProps = {
  templates: MealTemplate[];
  onUseTemplate: (template: MealTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
};

export default function TemplateList({
  templates,
  onUseTemplate,
  onDeleteTemplate,
}: TemplateListProps) {
  if (templates.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Saved Meals</h2>

      <div className="space-y-3">
        {templates.map((template) => {
          const totals = template.foods.reduce(
            (acc, food) => {
              acc.protein += food.protein;
              acc.carbs += food.carbs;
              acc.fat += food.fat;
              acc.calories += food.calories;
              return acc;
            },
            { protein: 0, carbs: 0, fat: 0, calories: 0 }
          );

          return (
            <div
              key={template.id}
              className="border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-gray-800">{template.name}</h3>
                  <p className="text-xs text-gray-500">
                    {template.foods.length} item
                    {template.foods.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={() => onDeleteTemplate(template.id)}
                  className="text-gray-400 hover:text-red-500 text-sm"
                  type="button"
                >
                  ×
                </button>
              </div>

              <p className="text-xs text-gray-600 mb-3">
                {totals.protein}g P / {totals.carbs}g C / {totals.fat}g F —{" "}
                {totals.calories} cal
              </p>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => onUseTemplate(template)}
              >
                Log Again
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
