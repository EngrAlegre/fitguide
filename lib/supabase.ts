import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string | null;
          daily_calorie_goal: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          daily_calorie_goal?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          daily_calorie_goal?: number;
          updated_at?: string;
        };
      };
      activities: {
        Row: {
          id: string;
          user_id: string;
          activity_type: string;
          duration_minutes: number;
          intensity: number;
          calories_burned: number;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_type: string;
          duration_minutes: number;
          intensity: number;
          calories_burned: number;
          date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          activity_type?: string;
          duration_minutes?: number;
          intensity?: number;
          calories_burned?: number;
          date?: string;
        };
      };
      meals: {
        Row: {
          id: string;
          user_id: string;
          meal_type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
          description: string;
          calories: number;
          protein_grams: number;
          carbs_grams: number;
          fats_grams: number;
          date: string;
          analysis_method: 'text' | 'vision' | 'manual' | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          meal_type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
          description: string;
          calories: number;
          protein_grams?: number;
          carbs_grams?: number;
          fats_grams?: number;
          date: string;
          analysis_method?: 'text' | 'vision' | 'manual' | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          meal_type?: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
          description?: string;
          calories?: number;
          protein_grams?: number;
          carbs_grams?: number;
          fats_grams?: number;
          date?: string;
          analysis_method?: 'text' | 'vision' | 'manual' | null;
        };
      };
    };
  };
};
