import { supabase } from '../lib/supabase';
import { auth } from '../lib/firebase';
import { Activity, ActivityType } from '../types/activity';

/**
 * Log an activity with Verify & Lock pattern
 * Ensures every activity is saved to Supabase and verified
 */
export async function logActivity(
  type: ActivityType,
  duration: number,
  intensity: number,
  caloriesBurned: number
): Promise<{ success: boolean; activity?: Activity; error?: string }> {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  const today = new Date().toISOString().split('T')[0];

  try {
    // Insert activity with verification
    const { data, error } = await supabase
      .from('activity_completions')
      .insert({
        user_id: user.uid,
        activity_type: type,
        duration_minutes: duration,
        intensity,
        calories_burned: caloriesBurned,
        date: today,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error logging activity:', error);
      return { success: false, error: error.message };
    }

    // Verify the insert by reading back
    if (!data || !data.id) {
      return { success: false, error: 'Activity was not saved properly' };
    }

    // Success - transform to Activity type
    const activity: Activity = {
      id: data.id,
      type: data.activity_type as ActivityType,
      duration: data.duration_minutes,
      intensity: data.intensity,
      caloriesBurned: data.calories_burned,
      timestamp: new Date(data.completed_at).getTime(),
      date: data.date,
    };

    return { success: true, activity };
  } catch (error: any) {
    console.error('Error logging activity:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Get today's activities from Supabase
 */
export async function getTodayActivities(): Promise<Activity[]> {
  const user = auth.currentUser;
  if (!user) {
    return [];
  }

  const today = new Date().toISOString().split('T')[0];

  try {
    const { data, error } = await supabase
      .from('activity_completions')
      .select('*')
      .eq('user_id', user.uid)
      .eq('date', today)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error fetching activities:', error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      type: row.activity_type as ActivityType,
      duration: row.duration_minutes,
      intensity: row.intensity,
      caloriesBurned: row.calories_burned,
      timestamp: new Date(row.completed_at).getTime(),
      date: row.date,
    }));
  } catch (error) {
    console.error('Error fetching activities:', error);
    return [];
  }
}

/**
 * Get total calories burned today
 */
export async function getTodayCaloriesBurned(): Promise<number> {
  const activities = await getTodayActivities();
  return activities.reduce((sum, activity) => sum + activity.caloriesBurned, 0);
}

/**
 * Get activities for a date range
 */
export async function getActivitiesInRange(
  startDate: string,
  endDate: string
): Promise<Activity[]> {
  const user = auth.currentUser;
  if (!user) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('activity_completions')
      .select('*')
      .eq('user_id', user.uid)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error fetching activities in range:', error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      type: row.activity_type as ActivityType,
      duration: row.duration_minutes,
      intensity: row.intensity,
      caloriesBurned: row.calories_burned,
      timestamp: new Date(row.completed_at).getTime(),
      date: row.date,
    }));
  } catch (error) {
    console.error('Error fetching activities in range:', error);
    return [];
  }
}

/**
 * Delete an activity
 */
export async function deleteActivity(activityId: string): Promise<{ success: boolean; error?: string }> {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    const { error } = await supabase
      .from('activity_completions')
      .delete()
      .eq('id', activityId)
      .eq('user_id', user.uid);

    if (error) {
      console.error('Error deleting activity:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting activity:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}
