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

// Goal calorie adjustments as percentage of TDEE
const GOAL_CALORIE_MULTIPLIERS: Record<GoalType, number> = {
  loss: -0.20,       // 20% deficit
  maintenance: 0,    // No adjustment
  gain: 0.10,        // 10% surplus
};

// Minimum fat floor: 0.3g per lb bodyweight
const MIN_FAT_PER_LB = 0.3;

// Fiber: 14g per 1,000 calories (USDA guideline)
const FIBER_PER_1000_CAL = 14;

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

// Calculate target calories based on goal (percentage-based)
export function calculateTargetCalories(tdee: number, goalType: GoalType): number {
  return Math.round(tdee * (1 + GOAL_CALORIE_MULTIPLIERS[goalType]));
}

// Calculate protein based on body weight or lean body mass
function calculateProteinGrams(weightLbs: number, goalType: GoalType, bodyFatPercent?: number): number {
  if (bodyFatPercent != null && bodyFatPercent > 0 && bodyFatPercent < 100) {
    // LBM-based multipliers (g/lb of lean body mass)
    const lbmMultipliers: Record<GoalType, number> = {
      loss: 1.2,
      maintenance: 1.0,
      gain: 1.1,
    };
    const leanMassLbs = weightLbs * (1 - bodyFatPercent / 100);
    return Math.round(leanMassLbs * lbmMultipliers[goalType]);
  }

  // Fallback: total bodyweight multipliers (g/lb)
  const multipliers: Record<GoalType, number> = {
    loss: 1.0,
    maintenance: 0.85,
    gain: 0.9,
  };

  return Math.round(weightLbs * multipliers[goalType]);
}

// Carb/fat ratios for remaining calories based on training focus
type CarbFatRatio = { carbs: number; fat: number };

function getCarbFatRatios(trainingFocus: TrainingFocus): CarbFatRatio {
  const focusRatios: Record<TrainingFocus, CarbFatRatio> = {
    tone: { carbs: 0.55, fat: 0.45 },        // Higher carbs for resistance training fuel & muscle recovery
    performance: { carbs: 0.65, fat: 0.35 },  // Higher carbs for glycogen replenishment
    health: { carbs: 0.50, fat: 0.50 },       // Balanced, middle ground
  };

  return focusRatios[trainingFocus];
}

// Calculate carbs and fat from remaining calories after protein, with minimum fat floor
function calculateCarbsAndFat(
  remainingCalories: number,
  trainingFocus: TrainingFocus,
  weightLbs: number
): { carbs: number; fat: number } {
  const ratios = getCarbFatRatios(trainingFocus);

  const minFatGrams = Math.round(weightLbs * MIN_FAT_PER_LB);
  const minFatCalories = minFatGrams * 9;

  let fatCalories = remainingCalories * ratios.fat;
  let carbCalories = remainingCalories * ratios.carbs;

  // Enforce minimum fat floor
  if (fatCalories < minFatCalories) {
    fatCalories = minFatCalories;
    carbCalories = remainingCalories - fatCalories;
  }

  return {
    carbs: Math.max(0, Math.round(carbCalories / 4)),
    fat: Math.round(fatCalories / 9),
  };
}

// Main calculation function
export function calculateMacros(inputs: CalculatorInputs): CalculatedMacros {
  // Convert weight to kg if needed
  const weightKg = inputs.weightUnit === 'lbs'
    ? lbsToKg(inputs.weight)
    : inputs.weight;

  // Get weight in lbs for protein and fat floor calculations
  const weightLbs = inputs.weightUnit === 'lbs'
    ? inputs.weight
    : kgToLbs(inputs.weight);

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

  // Calculate target calories (percentage-based adjustment)
  const calories = calculateTargetCalories(tdee, inputs.goalType);

  // Calculate protein based on body weight or lean body mass
  const protein = calculateProteinGrams(weightLbs, inputs.goalType, inputs.bodyFatPercent);

  // Calculate protein calories and remaining calories for carbs/fat
  const proteinCalories = protein * 4;
  const remainingCalories = Math.max(0, calories - proteinCalories);

  // Distribute remaining calories between carbs and fat based on training focus
  const { carbs, fat } = calculateCarbsAndFat(remainingCalories, inputs.trainingFocus, weightLbs);

  // Calculate fiber target (14g per 1,000 calories)
  const fiber = Math.round((calories / 1000) * FIBER_PER_1000_CAL);

  return {
    bmr,
    tdee,
    calories,
    protein,
    carbs,
    fat,
    fiber,
  };
}
