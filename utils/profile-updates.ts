import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
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
    throw new Error('No authenticated user');
  }

  const profile = await getUserProfile();
  if (!profile) {
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
    }
  }

  await updateDoc(doc(db, 'user_profiles', user.uid), updateData);
}

/**
 * Update user activity level and recalculate calorie goal
 */
export async function updateActivityLevel(activityLevel: ActivityLevel): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No authenticated user');
  }

  const profile = await getUserProfile();
  if (!profile) {
    throw new Error('Profile not found');
  }

  const updateData: any = {
    activityLevel,
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
  }

  await updateDoc(doc(db, 'user_profiles', user.uid), updateData);
}

/**
 * Update user financial status (budget preference)
 */
export async function updateFinancialStatus(financialStatus: FinancialStatus): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No authenticated user');
  }

  await updateDoc(doc(db, 'user_profiles', user.uid), {
    financialStatus,
    updated_at: new Date().toISOString(),
  });
}

/**
 * Update user fitness goal and recalculate calorie goal
 */
export async function updateFitnessGoal(
  fitnessGoal: 'lose_weight' | 'build_muscle' | 'maintain'
): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No authenticated user');
  }

  const profile = await getUserProfile();
  if (!profile) {
    throw new Error('Profile not found');
  }

  const updateData: any = {
    fitnessGoal,
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
  }

  await updateDoc(doc(db, 'user_profiles', user.uid), updateData);
}
