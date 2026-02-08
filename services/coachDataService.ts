import { auth, db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { Activity, ActivityType } from '../types/activity';
import { Meal } from '../types/nutrition';

/**
 * Service for fetching user data for AI Coach context
 */

export interface RecentMeal extends Meal {
  timeAgo: string;
}

export interface RecentActivity extends Activity {
  timeAgo: string;
}

export interface CoachDataContext {
  meals: RecentMeal[];
  activities: RecentActivity[];
  totalCaloriesIn: number;
  totalCaloriesOut: number;
  totalProtein: number;
  mealCount: number;
  workoutCount: number;
  last48HoursSummary: string;
}

/**
 * Get human-readable time ago string
 */
function getTimeAgo(timestamp: number | string): string {
  const now = Date.now();
  const then = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
  const diff = now - then;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (hours < 1) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Fetch meals from the last 48 hours
 */
export async function getRecentMeals(): Promise<RecentMeal[]> {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const fortyEightHoursAgo = Date.now() - 48 * 60 * 60 * 1000;
    const startDate = new Date(fortyEightHoursAgo).toISOString().split('T')[0];

    const q = query(
      collection(db, 'meals'),
      where('user_id', '==', user.uid),
      where('date', '>=', startDate),
      orderBy('created_at', 'desc')
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      const createdAt = data.created_at?.toDate().toISOString() || new Date().toISOString();
      return {
        id: doc.id,
        user_id: data.user_id,
        meal_type: data.meal_type,
        description: data.description,
        calories: data.calories,
        protein_grams: data.protein_grams,
        carbs_grams: data.carbs_grams,
        fats_grams: data.fats_grams,
        date: data.date,
        analysis_method: data.analysis_method,
        created_at: createdAt,
        timeAgo: getTimeAgo(createdAt),
      };
    });
  } catch (error) {
    console.error('Error fetching recent meals:', error);
    return [];
  }
}

/**
 * Fetch activities from the last 48 hours
 */
export async function getRecentActivities(): Promise<RecentActivity[]> {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const fortyEightHoursAgo = Date.now() - 48 * 60 * 60 * 1000;
    const startDate = new Date(fortyEightHoursAgo).toISOString().split('T')[0];

    const q = query(
      collection(db, 'activities'),
      where('user_id', '==', user.uid),
      where('date', '>=', startDate),
      orderBy('completed_at', 'desc')
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      const completedAt = new Date(data.completed_at).getTime();
      return {
        id: doc.id,
        type: data.activity_type as ActivityType,
        duration: data.duration_minutes,
        intensity: data.intensity,
        caloriesBurned: data.calories_burned,
        timestamp: completedAt,
        date: data.date,
        timeAgo: getTimeAgo(completedAt),
      };
    });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return [];
  }
}

/**
 * Build comprehensive context for AI Coach
 */
export async function getCoachDataContext(): Promise<CoachDataContext> {
  const [meals, activities] = await Promise.all([getRecentMeals(), getRecentActivities()]);

  const totalCaloriesIn = meals.reduce((sum, m) => sum + m.calories, 0);
  const totalCaloriesOut = activities.reduce((sum, a) => sum + a.caloriesBurned, 0);
  const totalProtein = meals.reduce((sum, m) => sum + m.protein_grams, 0);

  // Build human-readable summary
  const summaryParts: string[] = [];

  if (meals.length === 0 && activities.length === 0) {
    summaryParts.push('No meals or workouts logged in the last 48 hours.');
  } else {
    if (meals.length > 0) {
      summaryParts.push(
        `${meals.length} meal${meals.length > 1 ? 's' : ''} logged (${totalCaloriesIn} cal, ${totalProtein}g protein)`
      );

      // Group by meal type
      const byType = meals.reduce((acc, m) => {
        acc[m.meal_type] = (acc[m.meal_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const mealBreakdown = Object.entries(byType)
        .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
        .join(', ');
      summaryParts.push(`  - ${mealBreakdown}`);

      // Most recent meal
      if (meals[0]) {
        summaryParts.push(`  - Latest: ${meals[0].meal_type} - ${meals[0].description} (${meals[0].timeAgo})`);
      }
    }

    if (activities.length > 0) {
      summaryParts.push(
        `${activities.length} workout${activities.length > 1 ? 's' : ''} completed (${totalCaloriesOut} cal burned)`
      );

      // Most recent activity
      if (activities[0]) {
        summaryParts.push(`  - Latest: ${activities[0].type} for ${activities[0].duration}min (${activities[0].timeAgo})`);
      }
    }

    // Energy balance
    const balance = totalCaloriesIn - totalCaloriesOut;
    summaryParts.push(`Net energy balance: ${balance > 0 ? '+' : ''}${balance} cal`);
  }

  return {
    meals,
    activities,
    totalCaloriesIn,
    totalCaloriesOut,
    totalProtein,
    mealCount: meals.length,
    workoutCount: activities.length,
    last48HoursSummary: summaryParts.join('\n'),
  };
}

/**
 * Generate proactive coach message based on current data
 */
export async function generateProactiveMessage(): Promise<string | null> {
  const context = await getCoachDataContext();
  const now = new Date();
  const hour = now.getHours();

  // Check if user hasn't logged any meals today
  const today = now.toISOString().split('T')[0];
  const todaysMeals = context.meals.filter((m) => m.date === today);

  // Morning: No breakfast
  if (hour >= 8 && hour < 12 && !todaysMeals.some((m) => m.meal_type === 'Breakfast')) {
    return "Good morning! I noticed you haven't logged breakfast yet. Want to start your day with some fuel? 🍳";
  }

  // Afternoon: No lunch
  if (hour >= 12 && hour < 16 && !todaysMeals.some((m) => m.meal_type === 'Lunch')) {
    return "Hey! Lunch time has passed and I don't see any logs. How are we doing on your protein goal today? 🥗";
  }

  // Evening: No dinner
  if (hour >= 18 && hour < 22 && !todaysMeals.some((m) => m.meal_type === 'Dinner')) {
    return "Evening check-in! Haven't seen dinner logged yet. What's on the menu tonight? 🍽️";
  }

  // Low protein day
  if (todaysMeals.length > 0 && context.totalProtein < 50) {
    return `I see you've logged some meals today, but your protein is at ${context.totalProtein}g. Want some budget-friendly tips to boost it? 💪`;
  }

  // No workouts in 48 hours
  if (context.workoutCount === 0 && hour >= 9 && hour < 20) {
    return "I notice you haven't logged a workout in the last 2 days. Feeling ready for a quick home session? 🏋️";
  }

  return null;
}
