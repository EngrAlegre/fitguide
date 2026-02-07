import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { OnboardingData, UserProfile } from '../types/profile';

/**
 * Calculate daily calorie goal based on user profile data
 */
function calculateCalorieGoal(data: OnboardingData): number {
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
 * Save user profile data after onboarding
 */
export async function saveUserProfile(data: OnboardingData): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    console.error('saveUserProfile: No authenticated user');
    throw new Error('No authenticated user');
  }

  const calorieGoal = calculateCalorieGoal(data);

  const profileData = {
    age: data.age,
    gender: data.gender,
    height: data.height,
    weight: data.weight,
    activity_level: data.activityLevel,
    financial_status: data.financialStatus,
    fitness_goal: data.fitnessGoal,
    daily_calorie_goal: calorieGoal,
    onboarding_completed: true,
    updated_at: Timestamp.now(),
    created_at: Timestamp.now(),
  };

  console.log('saveUserProfile: Saving profile for user:', user.uid);

  try {
    const docRef = doc(db, 'user_profiles', user.uid);
    await setDoc(docRef, profileData, { merge: true });
    console.log('saveUserProfile: Profile saved successfully');
  } catch (error: any) {
    console.error('saveUserProfile: Error saving profile:', error);
    throw new Error(`Failed to save profile: ${error.message}`);
  }
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const user = auth.currentUser;
  if (!user) {
    console.log('getUserProfile: No authenticated user');
    return null;
  }

  console.log('getUserProfile: Fetching profile for user:', user.uid);
  try {
    const docRef = doc(db, 'user_profiles', user.uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log('getUserProfile: Profile does not exist');
      return null;
    }

    const data = docSnap.data();

    // Map Firestore data to UserProfile
    const profile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      age: data.age,
      gender: data.gender,
      height: data.height,
      weight: data.weight,
      activityLevel: data.activity_level,
      financialStatus: data.financial_status,
      fitnessGoal: data.fitness_goal,
      daily_calorie_goal: data.daily_calorie_goal,
      onboarding_completed: data.onboarding_completed,
      created_at: data.created_at?.toDate().toISOString(),
      updated_at: data.updated_at?.toDate().toISOString(),
    };

    console.log('getUserProfile: Profile retrieved successfully:', {
      age: profile.age,
      weight: profile.weight,
      height: profile.height,
      activityLevel: profile.activityLevel,
      financialStatus: profile.financialStatus,
      daily_calorie_goal: profile.daily_calorie_goal,
    });
    return profile;
  } catch (error) {
    console.error('getUserProfile: Unexpected error:', error);
    throw error;
  }
}

/**
 * Check if user has completed onboarding
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  const profile = await getUserProfile();
  return profile?.onboarding_completed === true;
}
