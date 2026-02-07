import { supabase } from '../lib/supabase';
import { auth } from '../lib/firebase';
import { ActivityLevel, FinancialStatus, OnboardingData } from '../types/profile';
import { getUserProfile } from './profile-storage';

/**
 * Calculate daily calorie goal based on user profile data
 */
function calculateCalorieGoal(data: {
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number;
  weight: number;
  activityLevel: ActivityLevel;
  fitnessGoal: 'lose_weight' | 'build_muscle' | 'maintain';
}): number {
  const { age, gender, height, weight, activityLevel, fitnessGoal } = data;

  // Calculate BMR using Mifflin-St Jeor Equation
  let bmr: number;
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else if (gender === 'female') {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  } else {
    // Average for 'other'
    bmr = 10 * weight + 6.25 * height - 5 * age - 78;
  }

  // Apply activity multiplier
  let tdee: number;
  switch (activityLevel) {
    case 'sedentary':
      tdee = bmr * 1.2;
      break;
    case 'lightly_active':
      tdee = bmr * 1.375;
      break;
    case 'very_active':
      tdee = bmr * 1.725;
      break;
    default:
      tdee = bmr * 1.375;
  }

  // Adjust for fitness goal
  let calorieGoal: number;
  switch (fitnessGoal) {
    case 'lose_weight':
      calorieGoal = tdee - 500; // 500 calorie deficit
      break;
    case 'build_muscle':
      calorieGoal = tdee + 300; // 300 calorie surplus
      break;
    case 'maintain':
      calorieGoal = tdee;
      break;
    default:
      calorieGoal = tdee;
  }

  return Math.round(calorieGoal);
}

/**
 * Update user profile metrics (age, weight, height) and recalculate calorie goal
 */
export async function updateProfileMetrics(updates: {
  age?: number;
  weight?: number;
  height?: number;
}): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    console.error('updateProfileMetrics: No authenticated user');
    throw new Error('No authenticated user');
  }

  console.log('updateProfileMetrics: Fetching current profile for user:', user.uid);
  const profile = await getUserProfile();
  if (!profile) {
    console.error('updateProfileMetrics: Profile not found for user:', user.uid);
    throw new Error('Profile not found');
  }

  const updateData: any = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  // Recalculate calorie goal if we have all necessary data
  if (profile.gender && profile.activityLevel && profile.fitnessGoal) {
    const newAge = updates.age ?? profile.age;
    const newWeight = updates.weight ?? profile.weight;
    const newHeight = updates.height ?? profile.height;

    if (newAge && newWeight && newHeight) {
      const newCalorieGoal = calculateCalorieGoal({
        age: newAge,
        gender: profile.gender,
        height: newHeight,
        weight: newWeight,
        activityLevel: profile.activityLevel,
        fitnessGoal: profile.fitnessGoal,
      });

      updateData.daily_calorie_goal = newCalorieGoal;
      console.log('updateProfileMetrics: Recalculated calorie goal:', newCalorieGoal);
    }
  }

  console.log('updateProfileMetrics: Updating profile with data:', updateData);
  try {
    const { data: updatedData, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', user.uid)
      .select();

    if (error) {
      console.error('updateProfileMetrics: Failed to update profile:', error);
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    if (!updatedData || updatedData.length === 0) {
      console.error('updateProfileMetrics: No rows were updated');
      throw new Error('Failed to update profile: No rows affected');
    }

    console.log('updateProfileMetrics: Successfully updated profile:', updatedData[0]);
  } catch (error) {
    console.error('updateProfileMetrics: Unexpected error:', error);
    throw error;
  }
}

/**
 * Update user activity level and recalculate calorie goal
 */
export async function updateActivityLevel(activityLevel: ActivityLevel): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    console.error('updateActivityLevel: No authenticated user');
    throw new Error('No authenticated user');
  }

  console.log('updateActivityLevel: Fetching current profile for user:', user.uid);
  const profile = await getUserProfile();
  if (!profile) {
    console.error('updateActivityLevel: Profile not found for user:', user.uid);
    throw new Error('Profile not found');
  }

  const updateData: any = {
    activity_level: activityLevel,
    updated_at: new Date().toISOString(),
  };

  // Recalculate calorie goal if we have all necessary data
  if (
    profile.age &&
    profile.gender &&
    profile.height &&
    profile.weight &&
    profile.fitnessGoal
  ) {
    const newCalorieGoal = calculateCalorieGoal({
      age: profile.age,
      gender: profile.gender,
      height: profile.height,
      weight: profile.weight,
      activityLevel,
      fitnessGoal: profile.fitnessGoal,
    });

    updateData.daily_calorie_goal = newCalorieGoal;
    console.log('updateActivityLevel: Recalculated calorie goal:', newCalorieGoal);
  }

  console.log('updateActivityLevel: Updating profile with data:', updateData);
  try {
    const { data: updatedData, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', user.uid)
      .select();

    if (error) {
      console.error('updateActivityLevel: Failed to update profile:', error);
      throw new Error(`Failed to update activity level: ${error.message}`);
    }

    if (!updatedData || updatedData.length === 0) {
      console.error('updateActivityLevel: No rows were updated');
      throw new Error('Failed to update activity level: No rows affected');
    }

    console.log('updateActivityLevel: Successfully updated profile:', updatedData[0]);
  } catch (error) {
    console.error('updateActivityLevel: Unexpected error:', error);
    throw error;
  }
}

/**
 * Update user financial status (budget preference)
 */
export async function updateFinancialStatus(financialStatus: FinancialStatus): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    console.error('updateFinancialStatus: No authenticated user');
    throw new Error('No authenticated user');
  }

  const updateData = {
    financial_status: financialStatus,
    updated_at: new Date().toISOString(),
  };

  console.log('updateFinancialStatus: Updating profile with data:', updateData);
  try {
    const { data: updatedData, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', user.uid)
      .select();

    if (error) {
      console.error('updateFinancialStatus: Failed to update profile:', error);
      throw new Error(`Failed to update financial status: ${error.message}`);
    }

    if (!updatedData || updatedData.length === 0) {
      console.error('updateFinancialStatus: No rows were updated');
      throw new Error('Failed to update financial status: No rows affected');
    }

    console.log('updateFinancialStatus: Successfully updated profile:', updatedData[0]);
  } catch (error) {
    console.error('updateFinancialStatus: Unexpected error:', error);
    throw error;
  }
}

/**
 * Update user fitness goal and recalculate calorie goal
 */
export async function updateFitnessGoal(
  fitnessGoal: 'lose_weight' | 'build_muscle' | 'maintain'
): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    console.error('updateFitnessGoal: No authenticated user');
    throw new Error('No authenticated user');
  }

  console.log('updateFitnessGoal: Fetching current profile for user:', user.uid);
  const profile = await getUserProfile();
  if (!profile) {
    console.error('updateFitnessGoal: Profile not found for user:', user.uid);
    throw new Error('Profile not found');
  }

  const updateData: any = {
    fitness_goal: fitnessGoal,
    updated_at: new Date().toISOString(),
  };

  // Recalculate calorie goal if we have all necessary data
  if (
    profile.age &&
    profile.gender &&
    profile.height &&
    profile.weight &&
    profile.activityLevel
  ) {
    const newCalorieGoal = calculateCalorieGoal({
      age: profile.age,
      gender: profile.gender,
      height: profile.height,
      weight: profile.weight,
      activityLevel: profile.activityLevel,
      fitnessGoal,
    });

    updateData.daily_calorie_goal = newCalorieGoal;
    console.log('updateFitnessGoal: Recalculated calorie goal:', newCalorieGoal);
  }

  console.log('updateFitnessGoal: Updating profile with data:', updateData);
  try {
    const { data: updatedData, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', user.uid)
      .select();

    if (error) {
      console.error('updateFitnessGoal: Failed to update profile:', error);
      throw new Error(`Failed to update fitness goal: ${error.message}`);
    }

    if (!updatedData || updatedData.length === 0) {
      console.error('updateFitnessGoal: No rows were updated');
      throw new Error('Failed to update fitness goal: No rows affected');
    }

    console.log('updateFitnessGoal: Successfully updated profile:', updatedData[0]);
  } catch (error) {
    console.error('updateFitnessGoal: Unexpected error:', error);
    throw error;
  }
}
