import { generateText } from '@fastshot/ai';
import { auth, db } from '../lib/firebase';
import { collection, addDoc, doc, getDoc, getDocs, query, where, orderBy, updateDoc, Timestamp } from 'firebase/firestore';
import { getUserProfile } from '../utils/profile-storage';
import {
  WorkoutPlan,
  WorkoutExercise,
  WorkoutSetLog,
  WorkoutSession,
  WorkoutProgress,
  WorkoutStreak,
} from '../types/workout';

/**
 * Generate a personalized workout plan using Newell AI
 */
export async function generateWorkoutPlan(): Promise<WorkoutPlan> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get user profile
  const profile = await getUserProfile();
  if (!profile) {
    throw new Error('User profile not found');
  }

  // Map profile fitness goal to workout fitness goal
  const fitnessGoalMap: Record<string, 'weight_loss' | 'muscle_gain' | 'endurance' | 'general_fitness'> = {
    lose_weight: 'weight_loss',
    build_muscle: 'muscle_gain',
    maintain: 'general_fitness',
  };

  const fitnessGoal = profile.fitnessGoal ? fitnessGoalMap[profile.fitnessGoal] || 'general_fitness' : 'general_fitness';
  const activityLevel = profile.activityLevel || 'lightly_active';

  // Determine difficulty level
  const difficultyLevel =
    activityLevel === 'sedentary'
      ? 'beginner'
      : activityLevel === 'very_active'
      ? 'advanced'
      : 'intermediate';

  // Create the AI prompt
  const prompt = `You are a certified personal trainer and fitness expert. Create a personalized workout routine for home/bodyweight training based on the following user profile:

Age: ${profile.age}
Gender: ${profile.gender}
Activity Level: ${activityLevel}
Fitness Goal: ${fitnessGoal}
Difficulty: ${difficultyLevel}

Create a COMPLETE workout routine with 6-8 exercises that can be done at home with minimal or no equipment. Focus on bodyweight exercises, but you can include basic equipment like dumbbells if helpful.

Return a JSON object with this EXACT structure:
{
  "planName": "Creative workout plan name",
  "planDescription": "Brief motivational description",
  "exercises": [
    {
      "exerciseName": "Exercise Name",
      "exerciseDescription": "Clear, detailed description of how to perform the exercise with proper form",
      "targetSets": 3,
      "targetReps": 12,
      "restSeconds": 60,
      "equipmentNeeded": ["bodyweight"] or ["dumbbells", "mat"],
      "muscleGroups": ["chest", "triceps"],
      "exerciseOrder": 1
    }
  ]
}

Requirements:
1. Include 6-8 exercises in a logical order (warm-up → main exercises → cool-down)
2. Target multiple muscle groups for balanced development
3. For weight_loss: Higher reps (12-15), shorter rest (45-60s), include cardio movements
4. For muscle_gain: Lower reps (6-10), longer rest (90-120s), focus on compound movements
5. For endurance: Moderate reps (10-12), shorter rest (45s), circuit-style
6. For general_fitness: Balanced approach (8-12 reps, 60s rest)
7. Adjust difficulty based on ${difficultyLevel} level
8. Use ONLY equipment commonly available at home
9. exerciseOrder should go from 1 to N sequentially

Return ONLY valid JSON, no extra text.`;

  console.log('🤖 Generating workout plan with Newell AI...');

  // Generate the workout plan using Newell AI
  const response = await generateText({
    prompt,
    temperature: 0.7,
    injectBranding: false,
  });

  console.log('✅ Received AI response');

  // Parse the AI response
  let workoutData: any;
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }
    workoutData = JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    throw new Error('Failed to parse workout plan from AI');
  }

  // Validate exercises
  if (!workoutData.exercises || !Array.isArray(workoutData.exercises)) {
    throw new Error('Invalid workout plan structure');
  }

  console.log('📊 Parsed workout plan data');

  // Create the workout plan object
  const workoutPlanId = `${user.uid}_workout_${Date.now()}`;

  // Save workout plan to Firestore
  const planDocRef = await addDoc(collection(db, 'workout_plans'), {
    user_id: user.uid,
    plan_name: workoutData.planName,
    plan_description: workoutData.planDescription,
    fitness_goal: fitnessGoal,
    difficulty_level: difficultyLevel,
    created_at: Timestamp.now(),
    metadata: {
      totalExercises: workoutData.exercises.length,
      estimatedDuration: workoutData.exercises.reduce(
        (sum: number, ex: any) => sum + (ex.targetSets * ex.targetReps * 3 + ex.restSeconds * ex.targetSets) / 60,
        0
      ),
      targetMuscleGroups: [...new Set(workoutData.exercises.flatMap((ex: any) => ex.muscleGroups))],
    },
  });

  const insertedExercises = [];

  // Insert exercises
  for (const ex of workoutData.exercises) {
    const exerciseDocRef = await addDoc(collection(db, 'workout_exercises'), {
      workout_plan_id: planDocRef.id,
      exercise_name: ex.exerciseName,
      exercise_description: ex.exerciseDescription,
      target_sets: ex.targetSets,
      target_reps: ex.targetReps,
      rest_seconds: ex.restSeconds,
      equipment_needed: ex.equipmentNeeded,
      muscle_groups: ex.muscleGroups,
      exercise_order: ex.exerciseOrder,
      created_at: Timestamp.now(),
    });

    insertedExercises.push({
      id: exerciseDocRef.id,
      workout_plan_id: planDocRef.id,
      exercise_name: ex.exerciseName,
      exercise_description: ex.exerciseDescription,
      target_sets: ex.targetSets,
      target_reps: ex.targetReps,
      rest_seconds: ex.restSeconds,
      equipment_needed: ex.equipmentNeeded,
      muscle_groups: ex.muscleGroups,
      exercise_order: ex.exerciseOrder,
      created_at: new Date().toISOString(),
    });
  }

  console.log('✅ Workout plan saved to Firestore');

  // Construct and return the complete workout plan
  const exercises: WorkoutExercise[] = (insertedExercises || []).map((ex) => ({
    id: ex.id,
    workoutPlanId: ex.workout_plan_id,
    exerciseName: ex.exercise_name,
    exerciseDescription: ex.exercise_description,
    targetSets: ex.target_sets,
    targetReps: ex.target_reps,
    restSeconds: ex.rest_seconds,
    equipmentNeeded: ex.equipment_needed,
    muscleGroups: ex.muscle_groups,
    exerciseOrder: ex.exercise_order,
    createdAt: ex.created_at,
    completedSets: 0,
    isCompleted: false,
  }));

  return {
    id: planDocRef.id,
    userId: user.uid,
    planName: workoutData.planName,
    planDescription: workoutData.planDescription,
    fitnessGoal,
    difficultyLevel,
    exercises: exercises.sort((a, b) => a.exerciseOrder - b.exerciseOrder),
    createdAt: new Date().toISOString(),
    metadata: {
      totalExercises: exercises.length,
      estimatedDuration: exercises.reduce(
        (sum, ex) => sum + (ex.targetSets * ex.targetReps * 3 + ex.restSeconds * ex.targetSets) / 60,
        0
      ),
      targetMuscleGroups: [...new Set(exercises.flatMap((ex) => ex.muscleGroups))],
    },
  };
}

/**
 * Get the latest workout plan for the current user
 */
export async function getLatestWorkoutPlan(): Promise<WorkoutPlan | null> {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }

  try {
    // Get latest workout plan
    const plansQuery = query(
      collection(db, 'workout_plans'),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc')
    );

    const plansSnapshot = await getDocs(plansQuery);

    if (plansSnapshot.empty) {
      return null;
    }

    const planDoc = plansSnapshot.docs[0];
    const plan = { id: planDoc.id, ...planDoc.data() } as any;

    // Get exercises for this plan
    const exercisesQuery = query(
      collection(db, 'workout_exercises'),
      where('workout_plan_id', '==', plan.id),
      orderBy('exercise_order', 'asc')
    );

    const exercisesSnapshot = await getDocs(exercisesQuery);

    // Get today's set logs to calculate completion
    const today = new Date().toISOString().split('T')[0];
    const logsQuery = query(
      collection(db, 'workout_set_logs'),
      where('user_id', '==', user.uid),
      where('workout_plan_id', '==', plan.id),
      where('date', '==', today)
    );

    const logsSnapshot = await getDocs(logsQuery);

    const completedSetsMap = new Map<string, number>();
    logsSnapshot.docs.forEach((logDoc) => {
      const log = logDoc.data();
      const count = completedSetsMap.get(log.exercise_id) || 0;
      completedSetsMap.set(log.exercise_id, Math.max(count, log.set_number));
    });

    const exerciseList: WorkoutExercise[] = exercisesSnapshot.docs.map((exDoc) => {
      const ex = { id: exDoc.id, ...exDoc.data() } as any;
      const completedSets = completedSetsMap.get(ex.id) || 0;
      return {
        id: ex.id,
        workoutPlanId: ex.workout_plan_id,
        exerciseName: ex.exercise_name,
        exerciseDescription: ex.exercise_description,
        targetSets: ex.target_sets,
        targetReps: ex.target_reps,
        restSeconds: ex.rest_seconds,
        equipmentNeeded: ex.equipment_needed,
        muscleGroups: ex.muscle_groups,
        exerciseOrder: ex.exercise_order,
        createdAt: ex.created_at?.toDate?.().toISOString() || new Date().toISOString(),
        completedSets,
        isCompleted: completedSets >= ex.target_sets,
      };
    });

    return {
      id: plan.id,
      userId: plan.user_id,
      planName: plan.plan_name,
      planDescription: plan.plan_description,
      fitnessGoal: plan.fitness_goal,
      difficultyLevel: plan.difficulty_level,
      exercises: exerciseList,
      createdAt: plan.created_at?.toDate?.().toISOString() || new Date().toISOString(),
      metadata: plan.metadata,
    };
  } catch (error) {
    console.error('Error fetching workout plan:', error);
    return null;
  }
}

/**
 * Log a workout set with verification
 */
export async function logWorkoutSet(
  workoutPlanId: string,
  exerciseId: string,
  setNumber: number,
  repsCompleted: number,
  weightUsed?: number
): Promise<{ success: boolean; error?: string }> {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  const today = new Date().toISOString().split('T')[0];

  try {
    const docRef = await addDoc(collection(db, 'workout_set_logs'), {
      user_id: user.uid,
      workout_plan_id: workoutPlanId,
      exercise_id: exerciseId,
      set_number: setNumber,
      reps_completed: repsCompleted,
      weight_used: weightUsed,
      completed_at: new Date().toISOString(),
      date: today,
      created_at: Timestamp.now(),
    });

    // Verify the insert by reading back
    const verifySnap = await getDoc(docRef);
    if (!verifySnap.exists()) {
      return { success: false, error: 'Set was not saved properly' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error logging workout set:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Start a workout session
 */
export async function startWorkoutSession(workoutPlanId: string): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }

  const today = new Date().toISOString().split('T')[0];

  try {
    const docRef = await addDoc(collection(db, 'workout_sessions'), {
      user_id: user.uid,
      workout_plan_id: workoutPlanId,
      started_at: new Date().toISOString(),
      date: today,
      created_at: Timestamp.now(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Error starting workout session:', error);
    return null;
  }
}

/**
 * Complete a workout session
 */
export async function completeWorkoutSession(
  sessionId: string,
  totalVolume: number
): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) {
    return false;
  }

  try {
    const docRef = doc(db, 'workout_sessions', sessionId);

    // Verify ownership
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().user_id !== user.uid) {
      console.error('Session not found or unauthorized');
      return false;
    }

    await updateDoc(docRef, {
      completed_at: new Date().toISOString(),
      total_volume_kg: totalVolume,
    });

    return true;
  } catch (error) {
    console.error('Error completing workout session:', error);
    return false;
  }
}

/**
 * Get workout streak data
 */
export async function getWorkoutStreak(): Promise<WorkoutStreak> {
  const user = auth.currentUser;
  if (!user) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastWorkoutDate: '',
      totalWorkouts: 0,
      workoutDates: [],
    };
  }

  try {
    const sessionsQuery = query(
      collection(db, 'workout_sessions'),
      where('user_id', '==', user.uid),
      where('completed_at', '!=', null),
      orderBy('completed_at'),
      orderBy('date', 'desc')
    );

    const sessionsSnapshot = await getDocs(sessionsQuery);

    if (sessionsSnapshot.empty) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastWorkoutDate: '',
        totalWorkouts: 0,
        workoutDates: [],
      };
    }

    const sessions = sessionsSnapshot.docs.map(doc => doc.data());
    const uniqueDates = [...new Set(sessions.map((s: any) => s.date))].sort().reverse();

    if (uniqueDates.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastWorkoutDate: '',
        totalWorkouts: 0,
        workoutDates: [],
      };
    }

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    let checkDate = today;

    for (const date of uniqueDates) {
      if (date === checkDate) {
        currentStreak++;
        const prevDate = new Date(checkDate);
        prevDate.setDate(prevDate.getDate() - 1);
        checkDate = prevDate.toISOString().split('T')[0];
      } else {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 1;

    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const current = new Date(uniqueDates[i]);
      const next = new Date(uniqueDates[i + 1]);
      const diffDays = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      currentStreak,
      longestStreak,
      lastWorkoutDate: uniqueDates[0],
      totalWorkouts: sessions.length,
      workoutDates: uniqueDates,
    };
  } catch (error) {
    console.error('Error fetching workout streak:', error);
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastWorkoutDate: '',
      totalWorkouts: 0,
      workoutDates: [],
    };
  }
}
