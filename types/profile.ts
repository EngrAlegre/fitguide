// User Profile Types for Onboarding

export type ActivityLevel = 'sedentary' | 'lightly_active' | 'very_active';
export type FinancialStatus = 'budget_conscious' | 'balanced' | 'premium_gourmet';
export type FitnessGoal = 'lose_weight' | 'build_muscle' | 'maintain';
export type Gender = 'male' | 'female' | 'other';

export interface UserProfile {
  uid: string;
  email: string;

  // Onboarding data
  age?: number;
  gender?: Gender;
  height?: number; // in cm
  weight?: number; // in kg
  activityLevel?: ActivityLevel;
  financialStatus?: FinancialStatus;
  fitnessGoal?: FitnessGoal;

  // App data
  daily_calorie_goal: number;

  // Meta
  created_at: string;
  updated_at: string;
  onboarding_completed: boolean;
}

export interface OnboardingData {
  age: number;
  gender: Gender;
  height: number;
  weight: number;
  activityLevel: ActivityLevel;
  financialStatus: FinancialStatus;
  fitnessGoal: FitnessGoal;
}

export const ACTIVITY_LEVEL_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary',
  lightly_active: 'Lightly Active',
  very_active: 'Very Active',
};

export const FINANCIAL_STATUS_LABELS: Record<FinancialStatus, string> = {
  budget_conscious: 'Budget-Conscious',
  balanced: 'Balanced',
  premium_gourmet: 'Premium/Gourmet',
};

export const FITNESS_GOAL_LABELS: Record<FitnessGoal, string> = {
  lose_weight: 'Lose Weight',
  build_muscle: 'Build Muscle',
  maintain: 'Maintain',
};

export const GENDER_LABELS: Record<Gender, string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
};
