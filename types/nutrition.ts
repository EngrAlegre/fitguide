export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
export type AnalysisMethod = 'text' | 'vision' | 'manual';

export interface Meal {
  id: string;
  user_id: string;
  meal_type: MealType;
  description: string;
  calories: number;
  protein_grams: number;
  carbs_grams: number;
  fats_grams: number;
  date: string;
  analysis_method: AnalysisMethod | null;
  created_at: string;
}

export interface MacroNutrients {
  protein: number;
  carbs: number;
  fats: number;
}

export interface DailyNutritionSummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  meals: Meal[];
  mealsByType: {
    Breakfast: Meal[];
    Lunch: Meal[];
    Dinner: Meal[];
    Snack: Meal[];
  };
}

export interface EnergyBalance {
  caloriesIn: number;
  caloriesOut: number;
  balance: number;
  date: string;
}
