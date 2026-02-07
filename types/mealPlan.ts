// Meal Plan Types

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';
export type BudgetCategory = 'budget' | 'moderate' | 'premium';

export interface MealIngredient {
  name: string;
  amount: string;
  isPantry: boolean; // true for pantry items, false for items to buy
}

export interface Meal {
  id: string;
  type: MealType;
  name: string;
  description: string;
  imageUrl: string;
  cookingTime: number; // in minutes
  budgetCategory: BudgetCategory;
  ingredients: MealIngredient[];
  preparationSteps: string[];
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  isCompleted: boolean;
}

export interface DayPlan {
  dayNumber: number;
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  snacks: Meal;
}

export interface MealPlan {
  id: string;
  userId: string;
  days: DayPlan[];
  createdAt: string;
  metadata: {
    age: number;
    gender: string;
    activityLevel: string;
    financialStatus: string;
    fitnessGoal: string;
  };
}

export const BUDGET_CATEGORY_LABELS: Record<BudgetCategory, string> = {
  budget: '💰 Budget',
  moderate: '💳 Moderate',
  premium: '💎 Premium',
};

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
};
