export type ActivityType = 'Running' | 'Weightlifting' | 'Cycling' | 'Yoga' | 'Swimming' | 'Walking';

export interface Activity {
  id: string;
  type: ActivityType;
  duration: number; // in minutes
  intensity: number; // 1-10 scale
  caloriesBurned: number;
  timestamp: number; // Unix timestamp
  date: string; // YYYY-MM-DD format
}

export interface DailySummary {
  date: string;
  totalCalories: number;
  activities: Activity[];
}

export interface WeeklySummary {
  totalCalories: number;
  bestDay: {
    date: string;
    calories: number;
  } | null;
  dailyTotals: { date: string; calories: number }[];
}
