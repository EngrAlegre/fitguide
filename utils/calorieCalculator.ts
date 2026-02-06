import { ActivityType } from '../types/activity';

// Base calorie burn rates per minute (for moderate intensity)
const BASE_CALORIE_RATES: Record<ActivityType, number> = {
  Running: 10.5,
  Cycling: 8.0,
  Weightlifting: 6.0,
  Yoga: 3.5,
  Swimming: 9.0,
  Walking: 4.0,
};

/**
 * Calculate calories burned based on activity type, duration, and intensity
 * @param activityType - Type of activity
 * @param duration - Duration in minutes
 * @param intensity - Intensity level (1-10)
 * @returns Estimated calories burned
 */
export function calculateCalories(
  activityType: ActivityType,
  duration: number,
  intensity: number
): number {
  const baseRate = BASE_CALORIE_RATES[activityType];

  // Intensity multiplier: intensity 5 = 1x, intensity 10 = 1.5x, intensity 1 = 0.5x
  const intensityMultiplier = 0.5 + (intensity / 10) * 0.5;

  const calories = baseRate * duration * intensityMultiplier;

  return Math.round(calories);
}

/**
 * Get activity type options
 */
export function getActivityTypes(): ActivityType[] {
  return ['Running', 'Weightlifting', 'Cycling', 'Yoga', 'Swimming', 'Walking'];
}
