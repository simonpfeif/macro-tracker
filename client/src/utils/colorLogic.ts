import type { GoalType } from '@/types';

// Goal-aware color logic for main macros (calories, protein, carbs, fat)
export function getMacroColor(percent: number, goalType: GoalType): 'red' | 'yellow' | 'green' {
  const isAtGoal = percent >= 80 && percent <= 120;
  const isWayOver = percent > 150;
  const isWayUnder = percent < 50;

  // Extremes are always bad
  if (isWayOver || isWayUnder) return 'red';

  switch (goalType) {
    case 'loss':
      // Under/at goal is good, over is bad
      if (percent <= 100) return 'green';
      return 'red';
    case 'maintenance':
      // Near goal is good, off-track is yellow
      return isAtGoal ? 'green' : 'yellow';
    case 'gain':
      // At/over goal is good, under is bad
      if (percent >= 80) return 'green';
      return percent >= 50 ? 'yellow' : 'red';
  }
}

// Color logic for target nutrients (want to reach goal) - used for micronutrients
export function getProgressColor(percent: number): 'red' | 'yellow' | 'green' {
  if (percent < 50) return 'red'; // 0-49% - way under
  if (percent < 80) return 'yellow'; // 50-79% - getting close
  return 'green'; // 80%+ - on target
}

// Color logic for limit nutrients (want to stay under)
export function getLimitColor(percent: number): 'green' | 'yellow' | 'red' {
  if (percent <= 80) return 'green'; // Well under limit
  if (percent <= 100) return 'yellow'; // Approaching limit
  return 'red'; // Over limit
}
