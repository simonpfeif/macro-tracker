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

// Calculate protein based on body weight (industry standard approach)
// This gives more reasonable values than calorie-percentage approach
function calculateProteinGrams(weightKg: number, goalType: GoalType): number {
  const weightLbs = kgToLbs(weightKg);

  // Protein multipliers in g/lb based on goal
  const multipliers: Record<GoalType, number> = {
    loss: 1.0,        // Higher protein to preserve muscle during deficit
    maintenance: 0.85,
    gain: 0.9,
  };

  return Math.round(weightLbs * multipliers[goalType]);
}

// Carb/fat ratios for remaining calories based on training focus
type CarbFatRatio = { carbs: number; fat: number };

function getCarbFatRatios(trainingFocus: TrainingFocus): CarbFatRatio {
  // These ratios are applied to remaining calories after protein
  const focusRatios: Record<TrainingFocus, CarbFatRatio> = {
    tone: { carbs: 0.55, fat: 0.45 },       // Balanced
    performance: { carbs: 0.70, fat: 0.30 }, // Higher carbs for training fuel
    health: { carbs: 0.55, fat: 0.45 },      // Balanced, sustainable
  };

  return focusRatios[trainingFocus];
}

// Calculate carbs and fat from remaining calories after protein
function calculateCarbsAndFat(
  remainingCalories: number,
  trainingFocus: TrainingFocus
): { carbs: number; fat: number } {
  // Carbs: 4 calories per gram
  // Fat: 9 calories per gram
  const ratios = getCarbFatRatios(trainingFocus);

  const carbCalories = remainingCalories * ratios.carbs;
  const fatCalories = remainingCalories * ratios.fat;

  return {
    carbs: Math.round(carbCalories / 4),
    fat: Math.round(fatCalories / 9),
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

  // Calculate protein based on body weight (more reasonable than calorie percentage)
  const protein = calculateProteinGrams(weightKg, inputs.goalType);

  // Calculate protein calories and remaining calories for carbs/fat
  const proteinCalories = protein * 4;
  const remainingCalories = Math.max(0, calories - proteinCalories);

  // Distribute remaining calories between carbs and fat based on training focus
  const { carbs, fat } = calculateCarbsAndFat(remainingCalories, inputs.trainingFocus);

  return {
    bmr,
    tdee,
    calories,
    protein,
    carbs,
    fat,
  };
}
