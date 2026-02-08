import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { OnboardingData, UserProfile } from '../types/profile';

// In-memory cache for profile data to prevent flickering
let profileCache: UserProfile | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
 * Save user profile data after onboarding to Firestore
 */
export async function saveUserProfile(data: OnboardingData): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    console.error('saveUserProfile: No authenticated user');
    throw new Error('No authenticated user');
  }

  const calorieGoal = calculateCalorieGoal(data);

  const profileData = {
    uid: user.uid,
    email: user.email || '',
    age: data.age,
    gender: data.gender,
    height: data.height,
    weight: data.weight,
    activityLevel: data.activityLevel,
    financialStatus: data.financialStatus,
    fitnessGoal: data.fitnessGoal,
    daily_calorie_goal: calorieGoal,
    onboarding_completed: true,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  };

  console.log('saveUserProfile: Saving profile for user:', user.uid);

  try {
    // Save to Firestore
    await setDoc(doc(db, 'user_profiles', user.uid), profileData);

    // Update cache with current timestamp
    profileCache = {
      uid: user.uid,
      email: user.email || '',
      age: data.age,
      gender: data.gender,
      height: data.height,
      weight: data.weight,
      activityLevel: data.activityLevel,
      financialStatus: data.financialStatus,
      fitnessGoal: data.fitnessGoal,
      daily_calorie_goal: calorieGoal,
      onboarding_completed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    cacheTimestamp = Date.now();

    console.log('saveUserProfile: Profile saved successfully');
  } catch (error: any) {
    console.error('saveUserProfile: Error saving profile:', error);
    throw new Error(`Failed to save profile: ${error.message}`);
  }
}

/**
 * Get user profile from Firestore with caching
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const user = auth.currentUser;
  if (!user) {
    console.log('getUserProfile: No authenticated user');
    return null;
  }

  // Return cached profile if still valid
  const now = Date.now();
  if (profileCache && profileCache.uid === user.uid && now - cacheTimestamp < CACHE_TTL) {
    console.log('getUserProfile: Returning cached profile');
    return profileCache;
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
      uid: data.uid,
      email: data.email || '',
      age: data.age || undefined,
      gender: data.gender || undefined,
      height: data.height || undefined,
      weight: data.weight || undefined,
      activityLevel: data.activityLevel || undefined,
      financialStatus: data.financialStatus || undefined,
      fitnessGoal: data.fitnessGoal || undefined,
      daily_calorie_goal: data.daily_calorie_goal || 2500,
      onboarding_completed: data.onboarding_completed || false,
      created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
      updated_at: data.updated_at?.toDate?.()?.toISOString() || new Date().toISOString(),
    };

    // Update cache
    profileCache = profile;
    cacheTimestamp = Date.now();

    console.log('getUserProfile: Profile retrieved successfully:', {
      age: profile.age,
      weight: profile.weight,
      height: profile.height,
      activityLevel: profile.activityLevel,
      financialStatus: profile.financialStatus,
      daily_calorie_goal: profile.daily_calorie_goal,
      onboarding_completed: profile.onboarding_completed,
    });
    return profile;
  } catch (error: any) {
    console.error('getUserProfile: Unexpected error:', error);
    return null;
  }
}

/**
 * Check if user has completed onboarding
 * Uses cached data when available to prevent flicker
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const profile = await getUserProfile();
    const completed = profile?.onboarding_completed === true;
    console.log('hasCompletedOnboarding:', completed);
    return completed;
  } catch (error: any) {
    console.warn('hasCompletedOnboarding: Error checking onboarding status:', error);
    // If we can't check, assume onboarding not completed to be safe
    return false;
  }
}

/**
 * Clear the profile cache (useful for logout)
 */
export function clearProfileCache(): void {
  profileCache = null;
  cacheTimestamp = 0;
  console.log('clearProfileCache: Cache cleared');
}
