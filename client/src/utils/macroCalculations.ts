import type {
  ActivityLevel,
  BiologicalSex,
  GoalType,
  TrainingFocus,
  CalculatorInputs,
  CalculatedMacros,
} from '@/types';

// Activity level multipliers for TDEE calculation
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,    // Desk job, little exercise
  light: 1.375,      // 1-3 days/week exercise
  moderate: 1.55,    // 3-5 days/week exercise
  active: 1.725,     // 6-7 days/week exercise
  very_active: 1.9,  // Athlete, physical job
};

// Goal calorie adjustments
const GOAL_CALORIE_ADJUSTMENTS: Record<GoalType, number> = {
  loss: -500,        // 500 calorie deficit
  maintenance: 0,    // No adjustment
  gain: 300,         // 300 calorie surplus
};

// Convert pounds to kilograms
export function lbsToKg(lbs: number): number {
  return lbs * 0.453592;
}

// Convert kilograms to pounds
export function kgToLbs(kg: number): number {
  return kg / 0.453592;
}

// Convert feet and inches to centimeters
export function ftInToCm(feet: number, inches: number): number {
  const totalInches = feet * 12 + inches;
  return totalInches * 2.54;
}

// Convert centimeters to feet and inches
export function cmToFtIn(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
}

// Calculate age from birthday string (YYYY-MM-DD)
export function calculateAge(birthday: string): number {
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

// Calculate BMR using Mifflin-St Jeor formula
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: BiologicalSex
): number {
  const baseBMR = 10 * weightKg + 6.25 * heightCm - 5 * age;

  if (sex === 'male') {
    return Math.round(baseBMR + 5);
  } else {
    return Math.round(baseBMR - 161);
  }
}

// Calculate TDEE (Total Daily Energy Expenditure)
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

// Calculate target calories based on goal
export function calculateTargetCalories(tdee: number, goalType: GoalType): number {
  return tdee + GOAL_CALORIE_ADJUSTMENTS[goalType];
}

// Macro split ratios based on goal and training focus
type MacroRatios = { protein: number; carbs: number; fat: number };

function getMacroRatios(goalType: GoalType, trainingFocus: TrainingFocus): MacroRatios {
  // Base ratios vary by training focus
  const focusRatios: Record<TrainingFocus, MacroRatios> = {
    tone: { protein: 0.35, carbs: 0.35, fat: 0.30 },      // Higher protein
    performance: { protein: 0.25, carbs: 0.50, fat: 0.25 }, // Higher carbs
    health: { protein: 0.30, carbs: 0.40, fat: 0.30 },    // Balanced
  };

  const base = focusRatios[trainingFocus];

  // Adjust based on goal
  if (goalType === 'loss') {
    // Increase protein ratio for muscle preservation during cut
    return {
      protein: Math.min(base.protein + 0.05, 0.40),
      carbs: base.carbs - 0.05,
      fat: base.fat,
    };
  } else if (goalType === 'gain') {
    // Increase carbs slightly for energy during bulk
    return {
      protein: base.protein,
      carbs: Math.min(base.carbs + 0.05, 0.55),
      fat: base.fat - 0.05,
    };
  }

  return base;
}

// Calculate macros in grams from calories
function calculateMacroGrams(
  calories: number,
  ratios: MacroRatios
): { protein: number; carbs: number; fat: number } {
  // Protein: 4 calories per gram
  // Carbs: 4 calories per gram
  // Fat: 9 calories per gram

  return {
    protein: Math.round((calories * ratios.protein) / 4),
    carbs: Math.round((calories * ratios.carbs) / 4),
    fat: Math.round((calories * ratios.fat) / 9),
  };
}

// Main calculation function
export function calculateMacros(inputs: CalculatorInputs): CalculatedMacros {
  // Convert weight to kg if needed
  const weightKg = inputs.weightUnit === 'lbs'
    ? lbsToKg(inputs.weight)
    : inputs.weight;

  // Convert height to cm if needed
  let heightCm: number;
  if (inputs.heightUnit === 'ft_in') {
    heightCm = ftInToCm(inputs.heightFeet || 0, inputs.heightInches || 0);
  } else {
    heightCm = inputs.heightCm || 0;
  }

  // Calculate BMR
  const bmr = calculateBMR(weightKg, heightCm, inputs.age, inputs.biologicalSex);

  // Calculate TDEE
  const tdee = calculateTDEE(bmr, inputs.activityLevel);

  // Calculate target calories
  const calories = calculateTargetCalories(tdee, inputs.goalType);

  // Get macro ratios and calculate grams
  const ratios = getMacroRatios(inputs.goalType, inputs.trainingFocus);
  const macroGrams = calculateMacroGrams(calories, ratios);

  return {
    bmr,
    tdee,
    calories,
    protein: macroGrams.protein,
    carbs: macroGrams.carbs,
    fat: macroGrams.fat,
  };
}
