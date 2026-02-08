export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_type: string
          calories_burned: number
          created_at: string | null
          date: string
          duration_minutes: number
          id: string
          intensity: number
          user_id: string
        }
        Insert: {
          activity_type: string
          calories_burned: number
          created_at?: string | null
          date: string
          duration_minutes: number
          id?: string
          intensity: number
          user_id: string
        }
        Update: {
          activity_type?: string
          calories_burned?: number
          created_at?: string | null
          date?: string
          duration_minutes?: number
          id?: string
          intensity?: number
          user_id?: string
        }
        Relationships: []
      }
      activity_completions: {
        Row: {
          activity_type: string
          calories_burned: number
          completed_at: string | null
          created_at: string | null
          date: string
          duration_minutes: number
          id: string
          intensity: number
          user_id: string
        }
        Insert: {
          activity_type: string
          calories_burned: number
          completed_at?: string | null
          created_at?: string | null
          date: string
          duration_minutes: number
          id?: string
          intensity: number
          user_id: string
        }
        Update: {
          activity_type?: string
          calories_burned?: number
          completed_at?: string | null
          created_at?: string | null
          date?: string
          duration_minutes?: number
          id?: string
          intensity?: number
          user_id?: string
        }
        Relationships: []
      }
      coach_conversation_summaries: {
        Row: {
          created_at: string | null
          id: string
          summary: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          summary: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          summary?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      coach_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
          timestamp: number
          user_context: Json | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
          timestamp: number
          user_context?: Json | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          timestamp?: number
          user_context?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      meal_completions: {
        Row: {
          calories: number | null
          completed_at: string | null
          day_number: number
          id: string
          meal_plan_id: string
          meal_type: string
          user_id: string
        }
        Insert: {
          calories?: number | null
          completed_at?: string | null
          day_number: number
          id?: string
          meal_plan_id: string
          meal_type: string
          user_id: string
        }
        Update: {
          calories?: number | null
          completed_at?: string | null
          day_number?: number
          id?: string
          meal_plan_id?: string
          meal_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_completions_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          created_at: string | null
          days: Json | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          days?: Json | null
          id: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          days?: Json | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      meals: {
        Row: {
          analysis_method: string | null
          calories: number
          carbs_grams: number
          created_at: string | null
          date: string
          description: string
          fats_grams: number
          id: string
          meal_type: string
          protein_grams: number
          user_id: string
        }
        Insert: {
          analysis_method?: string | null
          calories: number
          carbs_grams?: number
          created_at?: string | null
          date: string
          description: string
          fats_grams?: number
          id?: string
          meal_type: string
          protein_grams?: number
          user_id: string
        }
        Update: {
          analysis_method?: string | null
          calories?: number
          carbs_grams?: number
          created_at?: string | null
          date?: string
          description?: string
          fats_grams?: number
          id?: string
          meal_type?: string
          protein_grams?: number
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          created_at: string | null
          daily_calorie_goal: number | null
          email: string | null
          financial_status: string | null
          fitness_goal: string | null
          gender: string | null
          height: number | null
          onboarding_completed: boolean | null
          uid: string
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          created_at?: string | null
          daily_calorie_goal?: number | null
          email?: string | null
          financial_status?: string | null
          fitness_goal?: string | null
          gender?: string | null
          height?: number | null
          onboarding_completed?: boolean | null
          uid: string
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          created_at?: string | null
          daily_calorie_goal?: number | null
          email?: string | null
          financial_status?: string | null
          fitness_goal?: string | null
          gender?: string | null
          height?: number | null
          onboarding_completed?: boolean | null
          uid?: string
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      workout_exercises: {
        Row: {
          created_at: string | null
          equipment_needed: string[] | null
          exercise_description: string | null
          exercise_name: string
          exercise_order: number
          id: string
          image_url: string | null
          muscle_groups: string[] | null
          rest_seconds: number
          target_reps: number
          target_sets: number
          workout_plan_id: string
        }
        Insert: {
          created_at?: string | null
          equipment_needed?: string[] | null
          exercise_description?: string | null
          exercise_name: string
          exercise_order: number
          id?: string
          image_url?: string | null
          muscle_groups?: string[] | null
          rest_seconds?: number
          target_reps: number
          target_sets: number
          workout_plan_id: string
        }
        Update: {
          created_at?: string | null
          equipment_needed?: string[] | null
          exercise_description?: string | null
          exercise_name?: string
          exercise_order?: number
          id?: string
          image_url?: string | null
          muscle_groups?: string[] | null
          rest_seconds?: number
          target_reps?: number
          target_sets?: number
          workout_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_workout_plan_id_fkey"
            columns: ["workout_plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_plans: {
        Row: {
          created_at: string | null
          difficulty_level: string
          fitness_goal: string
          id: string
          metadata: Json | null
          plan_description: string | null
          plan_name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          difficulty_level: string
          fitness_goal: string
          id: string
          metadata?: Json | null
          plan_description?: string | null
          plan_name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          difficulty_level?: string
          fitness_goal?: string
          id?: string
          metadata?: Json | null
          plan_description?: string | null
          plan_name?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          date: string
          id: string
          started_at: string
          total_duration_minutes: number | null
          total_volume_kg: number | null
          user_id: string
          workout_plan_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          date: string
          id?: string
          started_at: string
          total_duration_minutes?: number | null
          total_volume_kg?: number | null
          user_id: string
          workout_plan_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          date?: string
          id?: string
          started_at?: string
          total_duration_minutes?: number | null
          total_volume_kg?: number | null
          user_id?: string
          workout_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_workout_plan_id_fkey"
            columns: ["workout_plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_set_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          date: string
          exercise_id: string
          id: string
          reps_completed: number
          set_number: number
          user_id: string
          weight_used: number | null
          workout_plan_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          date: string
          exercise_id: string
          id?: string
          reps_completed: number
          set_number: number
          user_id: string
          weight_used?: number | null
          workout_plan_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          date?: string
          exercise_id?: string
          id?: string
          reps_completed?: number
          set_number?: number
          user_id?: string
          weight_used?: number | null
          workout_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_set_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_set_logs_workout_plan_id_fkey"
            columns: ["workout_plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_firebase_user_id: { Args: never; Returns: string }
      set_user_id: { Args: { user_id: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
