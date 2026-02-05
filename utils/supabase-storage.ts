import { supabase } from '../lib/supabase';
import { Activity, DailySummary, WeeklySummary } from '../types/activity';
import { Meal, DailyNutritionSummary, EnergyBalance } from '../types/nutrition';

// ============ Activities ============

export async function addActivityToSupabase(activity: Omit<Activity, 'id' | 'timestamp'>): Promise<Activity | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('activities')
      .insert({
        user_id: user.id,
        activity_type: activity.type,
        duration_minutes: activity.duration,
        intensity: activity.intensity,
        calories_burned: activity.caloriesBurned,
        date: activity.date,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      type: data.activity_type as any,
      duration: data.duration_minutes,
      intensity: data.intensity,
      caloriesBurned: data.calories_burned,
      timestamp: new Date(data.created_at).getTime(),
      date: data.date,
    };
  } catch (error) {
    console.error('Error adding activity:', error);
    return null;
  }
}

export async function getTodayActivitiesFromSupabase(): Promise<DailySummary> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const activities: Activity[] = (data || []).map((row) => ({
      id: row.id,
      type: row.activity_type as any,
      duration: row.duration_minutes,
      intensity: row.intensity,
      caloriesBurned: row.calories_burned,
      timestamp: new Date(row.created_at).getTime(),
      date: row.date,
    }));

    const totalCalories = activities.reduce((sum, a) => sum + a.caloriesBurned, 0);

    return {
      date: today,
      totalCalories,
      activities,
    };
  } catch (error) {
    console.error('Error fetching today activities:', error);
    return {
      date: new Date().toISOString().split('T')[0],
      totalCalories: 0,
      activities: [],
    };
  }
}

export async function getWeeklySummaryFromSupabase(): Promise<WeeklySummary> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const { data, error } = await supabase
      .from('activities')
      .select('date, calories_burned')
      .eq('user_id', user.id)
      .gte('date', last7Days[0])
      .lte('date', last7Days[6]);

    if (error) throw error;

    const dailyTotals = last7Days.map((date) => {
      const dayActivities = (data || []).filter((row) => row.date === date);
      const calories = dayActivities.reduce((sum, row) => sum + row.calories_burned, 0);
      return { date, calories };
    });

    const bestDay = dailyTotals.reduce<{ date: string; calories: number } | null>((best, day) => {
      if (day.calories === 0) return best;
      if (!best || day.calories > best.calories) return day;
      return best;
    }, null);

    const totalCalories = dailyTotals.reduce((sum, day) => sum + day.calories, 0);

    return {
      totalCalories,
      bestDay,
      dailyTotals,
    };
  } catch (error) {
    console.error('Error fetching weekly summary:', error);
    return {
      totalCalories: 0,
      bestDay: null,
      dailyTotals: Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return { date: date.toISOString().split('T')[0], calories: 0 };
      }),
    };
  }
}

// ============ Meals & Nutrition ============

export async function addMealToSupabase(meal: Omit<Meal, 'id' | 'user_id' | 'created_at'>): Promise<Meal | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('meals')
      .insert({
        user_id: user.id,
        meal_type: meal.meal_type,
        description: meal.description,
        calories: meal.calories,
        protein_grams: meal.protein_grams,
        carbs_grams: meal.carbs_grams,
        fats_grams: meal.fats_grams,
        date: meal.date,
        analysis_method: meal.analysis_method,
      })
      .select()
      .single();

    if (error) throw error;

    return data as Meal;
  } catch (error) {
    console.error('Error adding meal:', error);
    return null;
  }
}

export async function getTodayMealsFromSupabase(): Promise<DailyNutritionSummary> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const meals: Meal[] = (data || []) as Meal[];

    const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
    const totalProtein = meals.reduce((sum, m) => sum + m.protein_grams, 0);
    const totalCarbs = meals.reduce((sum, m) => sum + m.carbs_grams, 0);
    const totalFats = meals.reduce((sum, m) => sum + m.fats_grams, 0);

    const mealsByType = {
      Breakfast: meals.filter((m) => m.meal_type === 'Breakfast'),
      Lunch: meals.filter((m) => m.meal_type === 'Lunch'),
      Dinner: meals.filter((m) => m.meal_type === 'Dinner'),
      Snack: meals.filter((m) => m.meal_type === 'Snack'),
    };

    return {
      date: today,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFats,
      meals,
      mealsByType,
    };
  } catch (error) {
    console.error('Error fetching today meals:', error);
    return {
      date: new Date().toISOString().split('T')[0],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFats: 0,
      meals: [],
      mealsByType: {
        Breakfast: [],
        Lunch: [],
        Dinner: [],
        Snack: [],
      },
    };
  }
}

export async function getEnergyBalanceFromSupabase(date?: string): Promise<EnergyBalance> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const targetDate = date || new Date().toISOString().split('T')[0];

    // Get calories burned from activities
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('calories_burned')
      .eq('user_id', user.id)
      .eq('date', targetDate);

    if (activitiesError) throw activitiesError;

    const caloriesOut = (activities || []).reduce((sum, row) => sum + row.calories_burned, 0);

    // Get calories consumed from meals
    const { data: meals, error: mealsError } = await supabase
      .from('meals')
      .select('calories')
      .eq('user_id', user.id)
      .eq('date', targetDate);

    if (mealsError) throw mealsError;

    const caloriesIn = (meals || []).reduce((sum, row) => sum + row.calories, 0);

    return {
      caloriesIn,
      caloriesOut,
      balance: caloriesIn - caloriesOut,
      date: targetDate,
    };
  } catch (error) {
    console.error('Error fetching energy balance:', error);
    return {
      caloriesIn: 0,
      caloriesOut: 0,
      balance: 0,
      date: date || new Date().toISOString().split('T')[0],
    };
  }
}

// ============ User Profile ============

export async function getDailyGoalFromSupabase(): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 2500;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('daily_calorie_goal')
      .eq('id', user.id)
      .single();

    if (error) throw error;

    return data?.daily_calorie_goal || 2500;
  } catch (error) {
    console.error('Error fetching daily goal:', error);
    return 2500;
  }
}

export async function updateDailyGoalInSupabase(goal: number): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_profiles')
      .update({ daily_calorie_goal: goal, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating daily goal:', error);
  }
}
