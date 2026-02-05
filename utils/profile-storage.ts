import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
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
    throw new Error('No authenticated user');
  }

  const calorieGoal = calculateCalorieGoal(data);

  const profileData: Partial<UserProfile> = {
    age: data.age,
    gender: data.gender,
    height: data.height,
    weight: data.weight,
    activityLevel: data.activityLevel,
    financialStatus: data.financialStatus,
    fitnessGoal: data.fitnessGoal,
    daily_calorie_goal: calorieGoal,
    onboarding_completed: true,
    updated_at: new Date().toISOString(),
  };

  await updateDoc(doc(db, 'user_profiles', user.uid), profileData);
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }

  const docRef = doc(db, 'user_profiles', user.uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }

  return null;
}

/**
 * Check if user has completed onboarding
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  const profile = await getUserProfile();
  return profile?.onboarding_completed === true;
}
