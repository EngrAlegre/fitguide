export interface WorkoutPlan {
  id: string;
  userId: string;
  planName: string;
  planDescription: string;
  fitnessGoal: 'weight_loss' | 'muscle_gain' | 'endurance' | 'general_fitness';
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  exercises: WorkoutExercise[];
  createdAt: string;
  metadata?: {
    totalExercises: number;
    estimatedDuration: number;
    targetMuscleGroups: string[];
  };
}

export interface WorkoutExercise {
  id: string;
  workoutPlanId: string;
  exerciseName: string;
  exerciseDescription: string;
  targetSets: number;
  targetReps: number;
  restSeconds: number;
  equipmentNeeded: string[];
  muscleGroups: string[];
  exerciseOrder: number;
  imageUrl?: string;
  createdAt: string;

  // Client-side tracking state
  completedSets?: number;
  isCompleted?: boolean;
}

export interface WorkoutSetLog {
  id: string;
  userId: string;
  workoutPlanId: string;
  exerciseId: string;
  setNumber: number;
  repsCompleted: number;
  weightUsed?: number;
  completedAt: string;
  date: string;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  workoutPlanId: string;
  startedAt: string;
  completedAt?: string;
  totalDurationMinutes?: number;
  totalVolumeKg?: number;
  date: string;
  createdAt: string;
}

export interface WorkoutProgress {
  exerciseId: string;
  exerciseName: string;
  history: {
    date: string;
    sets: WorkoutSetLog[];
    totalVolume: number;
    maxWeight: number;
  }[];
}

export interface WorkoutStreak {
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: string;
  totalWorkouts: number;
  workoutDates: string[];
}
