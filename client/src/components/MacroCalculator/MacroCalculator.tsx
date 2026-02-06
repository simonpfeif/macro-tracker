import { useReducer, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { calculateMacros, calculateAge } from '@/utils/macroCalculations';
import type {
  BiologicalSex,
  ActivityLevel,
  GoalType,
  TrainingFocus,
  WeightUnit,
  HeightUnit,
  CalculatedMacros,
} from '@/types';
import styles from './MacroCalculator.module.css';

type FormState = {
  weight: string;
  weightUnit: WeightUnit;
  heightFeet: string;
  heightInches: string;
  heightCm: string;
  heightUnit: HeightUnit;
  age: string;
  biologicalSex: BiologicalSex;
  activityLevel: ActivityLevel;
  trainingFocus: TrainingFocus;
};

type FormAction =
  | { type: 'SET_FIELD'; field: keyof FormState; value: string | WeightUnit | HeightUnit | BiologicalSex | ActivityLevel | TrainingFocus }
  | { type: 'SET_AGE_FROM_BIRTHDAY'; age: number };

const initialState: FormState = {
  weight: '',
  weightUnit: 'lbs',
  heightFeet: '',
  heightInches: '',
  heightCm: '',
  heightUnit: 'ft_in',
  age: '',
  biologicalSex: 'male',
  activityLevel: 'moderate',
  trainingFocus: 'health',
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_AGE_FROM_BIRTHDAY':
      return { ...state, age: action.age.toString() };
    default:
      return state;
  }
}

const ACTIVITY_LEVEL_OPTIONS: { value: ActivityLevel; label: string; description: string }[] = [
  { value: 'sedentary', label: 'Sedentary', description: 'Desk job, little exercise' },
  { value: 'light', label: 'Light', description: '1-3 days/week exercise' },
  { value: 'moderate', label: 'Moderate', description: '3-5 days/week exercise' },
  { value: 'active', label: 'Active', description: '6-7 days/week exercise' },
  { value: 'very_active', label: 'Very Active', description: 'Athlete, physical job' },
];

const TRAINING_FOCUS_OPTIONS: { value: TrainingFocus; label: string; description: string }[] = [
  { value: 'tone', label: 'Tone & Aesthetics', description: 'Higher protein, balanced macros' },
  { value: 'performance', label: 'Performance', description: 'Higher carbs for training fuel' },
  { value: 'health', label: 'General Health', description: 'Balanced, sustainable approach' },
];

type MacroCalculatorProps = {
  birthday?: string;
  goalType: GoalType;
  onChange: (results: CalculatedMacros | null) => void;
};

export default function MacroCalculator({ birthday, goalType, onChange }: MacroCalculatorProps) {
  const [state, dispatch] = useReducer(formReducer, initialState);

  // Auto-fill age from birthday if available
  useEffect(() => {
    if (birthday) {
      const age = calculateAge(birthday);
      dispatch({ type: 'SET_AGE_FROM_BIRTHDAY', age });
    }
  }, [birthday]);

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    dispatch({ type: 'SET_FIELD', field, value });
  };

  const isValid = useMemo((): boolean => {
    const weight = parseFloat(state.weight);
    const age = parseInt(state.age);

    if (isNaN(weight) || weight <= 0) return false;
    if (isNaN(age) || age <= 0 || age > 120) return false;

    if (state.heightUnit === 'ft_in') {
      const feet = parseInt(state.heightFeet);
      const inches = parseInt(state.heightInches);
      if (isNaN(feet) || feet < 0) return false;
      if (isNaN(inches) || inches < 0 || inches > 11) return false;
      if (feet === 0 && inches === 0) return false;
    } else {
      const cm = parseFloat(state.heightCm);
      if (isNaN(cm) || cm <= 0) return false;
    }

    return true;
  }, [state.weight, state.age, state.heightUnit, state.heightFeet, state.heightInches, state.heightCm]);

  // Calculate macros whenever inputs change and are valid
  const calculatedResults = useMemo((): CalculatedMacros | null => {
    if (!isValid) return null;

    return calculateMacros({
      weight: parseFloat(state.weight),
      weightUnit: state.weightUnit,
      heightFeet: parseInt(state.heightFeet) || 0,
      heightInches: parseInt(state.heightInches) || 0,
      heightCm: parseFloat(state.heightCm) || 0,
      heightUnit: state.heightUnit,
      age: parseInt(state.age),
      biologicalSex: state.biologicalSex,
      activityLevel: state.activityLevel,
      goalType: goalType,
      trainingFocus: state.trainingFocus,
    });
  }, [
    isValid,
    state.weight,
    state.weightUnit,
    state.heightFeet,
    state.heightInches,
    state.heightCm,
    state.heightUnit,
    state.age,
    state.biologicalSex,
    state.activityLevel,
    goalType,
    state.trainingFocus,
  ]);

  // Notify parent of changes
  useEffect(() => {
    onChange(calculatedResults);
  }, [calculatedResults, onChange]);

  return (
    <div className={styles.calculator}>
      {/* Weight + Age Row */}
      <div className={styles.compactRow}>
        {/* Weight */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Weight</label>
          <div className={styles.inputWithUnit}>
            <Input
              type="number"
              placeholder={state.weightUnit === 'lbs' ? 'e.g., 150' : 'e.g., 68'}
              value={state.weight}
              onChange={(e) => setField('weight', e.target.value)}
            />
            <div className={styles.unitToggle}>
              <button
                type="button"
                className={`${styles.unitButton} ${state.weightUnit === 'lbs' ? styles.unitButtonActive : ''}`}
                onClick={() => setField('weightUnit', 'lbs')}
              >
                lbs
              </button>
              <button
                type="button"
                className={`${styles.unitButton} ${state.weightUnit === 'kg' ? styles.unitButtonActive : ''}`}
                onClick={() => setField('weightUnit', 'kg')}
              >
                kg
              </button>
            </div>
          </div>
        </div>

        {/* Age */}
        <div className={`${styles.fieldGroup} ${styles.ageField}`}>
          <label className={styles.label}>
            Age
            {birthday && <span className={styles.labelHint}> (auto)</span>}
          </label>
          <Input
            type="number"
            placeholder="30"
            value={state.age}
            onChange={(e) => setField('age', e.target.value)}
          />
        </div>
      </div>

      {/* Height */}
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Height</label>
        <div className={styles.heightRow}>
          {state.heightUnit === 'ft_in' ? (
            <div className={styles.heightInputs}>
              <div className={styles.heightField}>
                <Input
                  type="number"
                  placeholder="5"
                  value={state.heightFeet}
                  onChange={(e) => setField('heightFeet', e.target.value)}
                />
                <span className={styles.heightLabel}>ft</span>
              </div>
              <div className={styles.heightField}>
                <Input
                  type="number"
                  placeholder="10"
                  value={state.heightInches}
                  onChange={(e) => setField('heightInches', e.target.value)}
                  min="0"
                  max="11"
                />
                <span className={styles.heightLabel}>in</span>
              </div>
            </div>
          ) : (
            <div className={styles.heightInputs}>
              <div className={styles.heightFieldCm}>
                <Input
                  type="number"
                  placeholder="178"
                  value={state.heightCm}
                  onChange={(e) => setField('heightCm', e.target.value)}
                />
                <span className={styles.heightLabel}>cm</span>
              </div>
            </div>
          )}
          <div className={styles.unitToggle}>
            <button
              type="button"
              className={`${styles.unitButton} ${state.heightUnit === 'ft_in' ? styles.unitButtonActive : ''}`}
              onClick={() => setField('heightUnit', 'ft_in')}
            >
              ft/in
            </button>
            <button
              type="button"
              className={`${styles.unitButton} ${state.heightUnit === 'cm' ? styles.unitButtonActive : ''}`}
              onClick={() => setField('heightUnit', 'cm')}
            >
              cm
            </button>
          </div>
        </div>
      </div>

      {/* Biological Sex */}
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Biological Sex</label>
        <p className={styles.fieldHint}>Used for BMR calculation accuracy</p>
        <div className={styles.segmentedControl}>
          <button
            type="button"
            className={`${styles.segmentButton} ${state.biologicalSex === 'male' ? styles.segmentButtonActive : ''}`}
            onClick={() => setField('biologicalSex', 'male')}
          >
            Male
          </button>
          <button
            type="button"
            className={`${styles.segmentButton} ${state.biologicalSex === 'female' ? styles.segmentButtonActive : ''}`}
            onClick={() => setField('biologicalSex', 'female')}
          >
            Female
          </button>
        </div>
      </div>

      {/* Activity Level */}
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Activity Level</label>
        <select
          className={styles.select}
          value={state.activityLevel}
          onChange={(e) => setField('activityLevel', e.target.value as ActivityLevel)}
        >
          {ACTIVITY_LEVEL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} - {option.description}
            </option>
          ))}
        </select>
      </div>

      {/* Training Focus */}
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Training Focus</label>
        <div className={styles.focusCards}>
          {TRAINING_FOCUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.focusCard} ${state.trainingFocus === option.value ? styles.focusCardActive : ''}`}
              onClick={() => setField('trainingFocus', option.value)}
            >
              <span className={styles.focusCardTitle}>{option.label}</span>
              <span className={styles.focusCardDescription}>{option.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
