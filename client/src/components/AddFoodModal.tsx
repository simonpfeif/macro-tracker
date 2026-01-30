import { useState } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import styles from "./AddFoodModal.module.css";

type AddFoodModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (food: {
    name: string;
    protein: number;
    carbs: number;
    fat: number;
    calories: number;
    fiber: number;
    servingSize: string;
    category: string;
    // Micronutrients
    saturatedFat?: number;
    transFat?: number;
    cholesterol?: number;
    sodium?: number;
    sugar?: number;
    addedSugar?: number;
    vitaminD?: number;
    calcium?: number;
    iron?: number;
    potassium?: number;
  }) => void;
};

const categories = [
  "Protein",
  "Dairy",
  "Grains",
  "Vegetables",
  "Fruits",
  "Fats & Oils",
  "Snacks",
  "Beverages",
  "Other",
];

export default function AddFoodModal({ isOpen, onClose, onSave }: AddFoodModalProps) {
  const [name, setName] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [fiber, setFiber] = useState("");
  const [servingSize, setServingSize] = useState("100g");
  const [category, setCategory] = useState("Other");
  const [nameError, setNameError] = useState(false);

  // Micronutrient state
  const [showMoreNutrients, setShowMoreNutrients] = useState(false);
  const [saturatedFat, setSaturatedFat] = useState("");
  const [transFat, setTransFat] = useState("");
  const [cholesterol, setCholesterol] = useState("");
  const [sodium, setSodium] = useState("");
  const [sugar, setSugar] = useState("");
  const [addedSugar, setAddedSugar] = useState("");
  const [vitaminD, setVitaminD] = useState("");
  const [calcium, setCalcium] = useState("");
  const [iron, setIron] = useState("");
  const [potassium, setPotassium] = useState("");

  // Auto-calculate calories based on macros
  const calculateCalories = () => {
    const p = parseFloat(protein) || 0;
    const c = parseFloat(carbs) || 0;
    const fi = parseFloat(fiber) || 0;
    const f = parseFloat(fat) || 0;
    const netCarbs = Math.max(0, c - fi);
    return Math.round((p * 4) + (netCarbs * 4) + (f * 9));
  };

  const calories = calculateCalories();

  if (!isOpen) return null;

  const resetForm = () => {
    setName("");
    setProtein("");
    setCarbs("");
    setFat("");
    setFiber("");
    setServingSize("100g");
    setCategory("Other");
    setNameError(false);
    // Reset micronutrients
    setShowMoreNutrients(false);
    setSaturatedFat("");
    setTransFat("");
    setCholesterol("");
    setSodium("");
    setSugar("");
    setAddedSugar("");
    setVitaminD("");
    setCalcium("");
    setIron("");
    setPotassium("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError(true);
      return;
    }

    // Helper to parse optional number fields
    const parseOptional = (value: string): number | undefined => {
      const num = parseFloat(value);
      return isNaN(num) ? undefined : num;
    };

    onSave({
      name: trimmedName,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      calories,
      fiber: parseFloat(fiber) || 0,
      servingSize,
      category,
      // Micronutrients (optional)
      saturatedFat: parseOptional(saturatedFat),
      transFat: parseOptional(transFat),
      cholesterol: parseOptional(cholesterol),
      sodium: parseOptional(sodium),
      sugar: parseOptional(sugar),
      addedSugar: parseOptional(addedSugar),
      vitaminD: parseOptional(vitaminD),
      calcium: parseOptional(calcium),
      iron: parseOptional(iron),
      potassium: parseOptional(potassium),
    });

    resetForm();
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Add Custom Food</h2>
          <button onClick={handleClose} className={styles.closeButton}>
            <X className={styles.icon} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>
              Food Name
              <span className={styles.required}>*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g., Chicken Breast"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(false);
              }}
              className={nameError ? styles.inputError : ""}
            />
            {nameError && (
              <span className={styles.errorText}>Please enter a food name</span>
            )}
          </div>

          <div className={styles.grid2}>
            <div className={styles.field}>
              <label className={styles.label}>Serving Size</label>
              <Input
                type="text"
                placeholder="e.g., 100g"
                value={servingSize}
                onChange={(e) => setServingSize(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={styles.select}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Calories</label>
            <Input
              type="number"
              value={calories}
              readOnly
              className={styles.readOnlyInput}
            />
          </div>

          <div className={styles.grid4}>
            <div className={styles.field}>
              <label className={styles.label}>Protein (g)</label>
              <Input
                type="number"
                step="0.1"
                placeholder="0"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Carbs (g)</label>
              <Input
                type="number"
                step="0.1"
                placeholder="0"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Fiber (g)</label>
              <Input
                type="number"
                step="0.1"
                placeholder="0"
                value={fiber}
                onChange={(e) => setFiber(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Fat (g)</label>
              <Input
                type="number"
                step="0.1"
                placeholder="0"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
              />
            </div>
          </div>

          {/* More Nutrients Collapsible Section */}
          <button
            type="button"
            onClick={() => setShowMoreNutrients(!showMoreNutrients)}
            className={styles.moreNutrientsToggle}
          >
            More Nutrients {showMoreNutrients ? <ChevronUp className={styles.chevronIcon} /> : <ChevronDown className={styles.chevronIcon} />}
          </button>

          {showMoreNutrients && (
            <div className={styles.moreNutrientsSection}>
              {/* Fats */}
              <div className={styles.nutrientGroup}>
                <span className={styles.nutrientGroupLabel}>Fats</span>
                <div className={styles.grid2}>
                  <div className={styles.field}>
                    <label className={styles.label}>Saturated Fat (g)</label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="0"
                      value={saturatedFat}
                      onChange={(e) => setSaturatedFat(e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Trans Fat (g)</label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="0"
                      value={transFat}
                      onChange={(e) => setTransFat(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Other */}
              <div className={styles.nutrientGroup}>
                <span className={styles.nutrientGroupLabel}>Other</span>
                <div className={styles.grid2}>
                  <div className={styles.field}>
                    <label className={styles.label}>Cholesterol (mg)</label>
                    <Input
                      type="number"
                      step="1"
                      placeholder="0"
                      value={cholesterol}
                      onChange={(e) => setCholesterol(e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Sodium (mg)</label>
                    <Input
                      type="number"
                      step="1"
                      placeholder="0"
                      value={sodium}
                      onChange={(e) => setSodium(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Sugars */}
              <div className={styles.nutrientGroup}>
                <span className={styles.nutrientGroupLabel}>Sugars</span>
                <div className={styles.grid2}>
                  <div className={styles.field}>
                    <label className={styles.label}>Sugar (g)</label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="0"
                      value={sugar}
                      onChange={(e) => setSugar(e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Added Sugar (g)</label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="0"
                      value={addedSugar}
                      onChange={(e) => setAddedSugar(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Vitamins & Minerals */}
              <div className={styles.nutrientGroup}>
                <span className={styles.nutrientGroupLabel}>Vitamins & Minerals</span>
                <div className={styles.grid2}>
                  <div className={styles.field}>
                    <label className={styles.label}>Vitamin D (mcg)</label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="0"
                      value={vitaminD}
                      onChange={(e) => setVitaminD(e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Calcium (mg)</label>
                    <Input
                      type="number"
                      step="1"
                      placeholder="0"
                      value={calcium}
                      onChange={(e) => setCalcium(e.target.value)}
                    />
                  </div>
                </div>
                <div className={styles.grid2}>
                  <div className={styles.field}>
                    <label className={styles.label}>Iron (mg)</label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="0"
                      value={iron}
                      onChange={(e) => setIron(e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Potassium (mg)</label>
                    <Input
                      type="number"
                      step="1"
                      placeholder="0"
                      value={potassium}
                      onChange={(e) => setPotassium(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className={styles.actions}>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">
              Save Food
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
