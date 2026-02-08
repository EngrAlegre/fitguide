import AsyncStorage from '@react-native-async-storage/async-storage';
import { Activity, DailySummary, WeeklySummary } from '../types/activity';

const ACTIVITIES_KEY = '@movera_activities';
const DAILY_GOAL_KEY = '@movera_daily_goal';

/**
 * Save activities to storage
 */
export async function saveActivities(activities: Activity[]): Promise<void> {
  try {
    await AsyncStorage.setItem(ACTIVITIES_KEY, JSON.stringify(activities));
  } catch (error) {
    console.error('Error saving activities:', error);
    throw error;
  }
}

/**
 * Load all activities from storage
 */
export async function loadActivities(): Promise<Activity[]> {
  try {
    const data = await AsyncStorage.getItem(ACTIVITIES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading activities:', error);
    return [];
  }
}

/**
 * Add a new activity
 */
export async function addActivity(activity: Activity): Promise<Activity[]> {
  const activities = await loadActivities();
  const newActivities = [activity, ...activities];
  await saveActivities(newActivities);
  return newActivities;
}

/**
 * Get today's activities
 */
export async function getTodayActivities(): Promise<DailySummary> {
  const activities = await loadActivities();
  const today = new Date().toISOString().split('T')[0];

  const todayActivities = activities.filter(a => a.date === today);
  const totalCalories = todayActivities.reduce((sum, a) => sum + a.caloriesBurned, 0);

  return {
    date: today,
    totalCalories,
    activities: todayActivities,
  };
}

/**
 * Get weekly summary (last 7 days)
 */
export async function getWeeklySummary(): Promise<WeeklySummary> {
  const activities = await loadActivities();
  const today = new Date();

  // Get last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  // Calculate daily totals
  const dailyTotals = last7Days.map(date => {
    const dayActivities = activities.filter(a => a.date === date);
    const calories = dayActivities.reduce((sum, a) => sum + a.caloriesBurned, 0);
    return { date, calories };
  });

  // Find best day
  const bestDay = dailyTotals.reduce<{ date: string; calories: number } | null>((best, day) => {
    if (day.calories === 0) return best;
    if (!best || day.calories > best.calories) return day;
    return best;
  }, null);

  // Calculate total
  const totalCalories = dailyTotals.reduce((sum, day) => sum + day.calories, 0);

  return {
    totalCalories,
    bestDay,
    dailyTotals,
  };
}

/**
 * Save daily goal
 */
export async function saveDailyGoal(goal: number): Promise<void> {
  try {
    await AsyncStorage.setItem(DAILY_GOAL_KEY, goal.toString());
  } catch (error) {
    console.error('Error saving daily goal:', error);
  }
}

/**
 * Load daily goal
 */
export async function loadDailyGoal(): Promise<number> {
  try {
    const goal = await AsyncStorage.getItem(DAILY_GOAL_KEY);
    return goal ? parseInt(goal, 10) : 2500; // Default goal
  } catch (error) {
    console.error('Error loading daily goal:', error);
    return 2500;
  }
}

/**
 * Clear all storage (for sign out)
 */
export async function clearAllStorage(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([ACTIVITIES_KEY, DAILY_GOAL_KEY]);
    console.log('Storage cleared successfully');
  } catch (error) {
    console.error('Error clearing storage:', error);
    throw error;
  }
}
