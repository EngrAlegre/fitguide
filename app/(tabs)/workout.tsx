import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import {
  generateWorkoutPlan,
  getLatestWorkoutPlan,
  logWorkoutSet,
  startWorkoutSession,
  completeWorkoutSession,
  getWorkoutStreak,
} from '../../services/workoutService';
import { WorkoutPlan, WorkoutExercise, WorkoutStreak } from '../../types/workout';
import WorkoutGenerationLoader from '../../components/WorkoutGenerationLoader';
import ExerciseCard from '../../components/ExerciseCard';
import WorkoutHeatmap from '../../components/WorkoutHeatmap';
import RestTimer from '../../components/RestTimer';

// Workout-specific colors
const WorkoutColors = {
  electricBlue: '#00D4FF',
  deepCharcoal: '#1A1A1A',
  neonLime: Colors.accent,
  darkBg: '#0F0F0F',
};

export default function WorkoutScreen() {
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [workoutStreak, setWorkoutStreak] = useState<WorkoutStreak | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restDuration, setRestDuration] = useState(60);

  const loadWorkoutData = async () => {
    try {
      setIsLoading(true);
      const [plan, streak] = await Promise.all([getLatestWorkoutPlan(), getWorkoutStreak()]);

      setWorkoutPlan(plan);
      setWorkoutStreak(streak);
    } catch (error) {
      console.error('Error loading workout data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkoutData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadWorkoutData();
    }, [])
  );

  const handleGenerateWorkout = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      setIsGenerating(true);
      const newPlan = await generateWorkoutPlan();
      setWorkoutPlan(newPlan);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error: any) {
      console.error('Error generating workout:', error);
      Alert.alert('Error', error.message || 'Failed to generate workout plan');

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartWorkout = async () => {
    if (!workoutPlan) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    const sessionId = await startWorkoutSession(workoutPlan.id);
    if (sessionId) {
      setActiveSessionId(sessionId);
      Alert.alert('Workout Started!', 'Let\'s crush this workout! 💪');
    }
  };

  const handleLogSet = async (exercise: WorkoutExercise, setNumber: number) => {
    if (!workoutPlan || !activeSessionId) {
      Alert.alert('Start Workout', 'Please start your workout session first');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const result = await logWorkoutSet(
      workoutPlan.id,
      exercise.id,
      setNumber,
      exercise.targetReps
    );

    if (result.success) {
      // Update local state
      const updatedPlan = { ...workoutPlan };
      const exerciseIndex = updatedPlan.exercises.findIndex((ex) => ex.id === exercise.id);
      if (exerciseIndex !== -1) {
        updatedPlan.exercises[exerciseIndex].completedSets = setNumber;
        updatedPlan.exercises[exerciseIndex].isCompleted = setNumber >= exercise.targetSets;
        setWorkoutPlan(updatedPlan);
      }

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Start rest timer
      if (setNumber < exercise.targetSets) {
        setRestDuration(exercise.restSeconds);
        setShowRestTimer(true);
      }
    } else {
      Alert.alert('Error', result.error || 'Failed to log set');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  const handleCompleteWorkout = async () => {
    if (!activeSessionId) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    const success = await completeWorkoutSession(activeSessionId, 0);

    if (success) {
      Alert.alert('Workout Complete!', '🎉 Amazing work! You crushed it!');
      setActiveSessionId(null);
      await loadWorkoutData();

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadWorkoutData();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading Workout...</Text>
        </View>
      </View>
    );
  }

  if (isGenerating) {
    return <WorkoutGenerationLoader />;
  }

  if (!workoutPlan) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <LinearGradient colors={[WorkoutColors.deepCharcoal, WorkoutColors.darkBg]} style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="barbell" size={64} color={WorkoutColors.electricBlue} />
          </View>
          <Text style={styles.emptyTitle}>No Workout Plan</Text>
          <Text style={styles.emptyText}>
            Generate your first AI-powered workout plan tailored to your fitness goals.
          </Text>
          <TouchableOpacity style={styles.generateButton} onPress={handleGenerateWorkout}>
            <Ionicons name="flash" size={24} color={WorkoutColors.darkBg} />
            <Text style={styles.generateButtonText}>Generate Workout</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  const completedExercises = workoutPlan.exercises.filter((ex) => ex.isCompleted).length;
  const totalExercises = workoutPlan.exercises.length;
  const progressPercentage = (completedExercises / totalExercises) * 100;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <LinearGradient colors={[WorkoutColors.deepCharcoal, WorkoutColors.darkBg]} style={styles.header}>
        <Text style={styles.logo}>WORKOUT</Text>
        <Text style={styles.subtitle}>AI-Powered • High Energy • Results</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={WorkoutColors.electricBlue} />}
      >
        {/* Streak Card */}
        {workoutStreak && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.streakCard}>
            <LinearGradient
              colors={[WorkoutColors.electricBlue + '30', WorkoutColors.deepCharcoal]}
              style={styles.streakGradient}
            >
              <View style={styles.streakHeader}>
                <Ionicons name="flame" size={32} color={WorkoutColors.neonLime} />
                <Text style={styles.streakTitle}>WORKOUT STREAK</Text>
              </View>
              <View style={styles.streakStats}>
                <View style={styles.streakStatItem}>
                  <Text style={styles.streakStatValue}>{workoutStreak.currentStreak}</Text>
                  <Text style={styles.streakStatLabel}>Current</Text>
                </View>
                <View style={styles.streakDivider} />
                <View style={styles.streakStatItem}>
                  <Text style={styles.streakStatValue}>{workoutStreak.longestStreak}</Text>
                  <Text style={styles.streakStatLabel}>Best</Text>
                </View>
                <View style={styles.streakDivider} />
                <View style={styles.streakStatItem}>
                  <Text style={styles.streakStatValue}>{workoutStreak.totalWorkouts}</Text>
                  <Text style={styles.streakStatLabel}>Total</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Workout Plan Card */}
        <View style={styles.planCard}>
          <View style={styles.planHeader}>
            <View>
              <Text style={styles.planName}>{workoutPlan.planName}</Text>
              <Text style={styles.planDescription}>{workoutPlan.planDescription}</Text>
            </View>
            <TouchableOpacity style={styles.refreshPlanButton} onPress={handleGenerateWorkout}>
              <Ionicons name="refresh" size={24} color={WorkoutColors.electricBlue} />
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Today&apos;s Progress</Text>
              <Text style={styles.progressText}>
                {completedExercises}/{totalExercises} exercises
              </Text>
            </View>
            <View style={styles.progressBarBg}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${progressPercentage}%`,
                  },
                ]}
              />
            </View>
          </View>

          {/* Start/Complete Workout Button */}
          {!activeSessionId ? (
            <TouchableOpacity style={styles.startWorkoutButton} onPress={handleStartWorkout}>
              <Ionicons name="play" size={24} color={WorkoutColors.darkBg} />
              <Text style={styles.startWorkoutButtonText}>START WORKOUT</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.completeWorkoutButton} onPress={handleCompleteWorkout}>
              <Ionicons name="checkmark-circle" size={24} color={WorkoutColors.neonLime} />
              <Text style={styles.completeWorkoutButtonText}>COMPLETE WORKOUT</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Exercises */}
        <View style={styles.exercisesSection}>
          <Text style={styles.sectionTitle}>EXERCISES</Text>
          <View style={styles.exercisesList}>
            {workoutPlan.exercises.map((exercise, index) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                index={index}
                onLogSet={handleLogSet}
                isWorkoutActive={!!activeSessionId}
              />
            ))}
          </View>
        </View>

        {/* Heatmap */}
        {workoutStreak && workoutStreak.workoutDates.length > 0 && (
          <View style={styles.heatmapSection}>
            <Text style={styles.sectionTitle}>CONSISTENCY HEATMAP</Text>
            <WorkoutHeatmap workoutDates={workoutStreak.workoutDates} />
          </View>
        )}
      </ScrollView>

      {/* Rest Timer Modal */}
      {showRestTimer && (
        <RestTimer duration={restDuration} onComplete={() => setShowRestTimer(false)} onSkip={() => setShowRestTimer(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WorkoutColors.darkBg,
  },
  header: {
    paddingTop: Spacing.xxl + 20,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  logo: {
    fontSize: 32,
    color: WorkoutColors.electricBlue,
    ...Fonts.heading,
    letterSpacing: 3,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    ...Fonts.body,
    marginTop: Spacing.xs,
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: Colors.textPrimary,
    ...Fonts.body,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.full,
    backgroundColor: `${WorkoutColors.electricBlue}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 28,
    color: Colors.textPrimary,
    ...Fonts.heading,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    ...Fonts.body,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: WorkoutColors.electricBlue,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  generateButtonText: {
    fontSize: 18,
    color: WorkoutColors.darkBg,
    ...Fonts.heading,
    letterSpacing: 1,
  },
  streakCard: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  streakGradient: {
    padding: Spacing.lg,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  streakTitle: {
    fontSize: 16,
    color: Colors.textPrimary,
    ...Fonts.heading,
    letterSpacing: 1.5,
  },
  streakStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  streakStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  streakStatValue: {
    fontSize: 36,
    color: WorkoutColors.neonLime,
    ...Fonts.heading,
    marginBottom: Spacing.xs,
  },
  streakStatLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    ...Fonts.body,
  },
  streakDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  planCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  planName: {
    fontSize: 24,
    color: Colors.textPrimary,
    ...Fonts.heading,
    marginBottom: Spacing.xs,
  },
  planDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    ...Fonts.body,
    lineHeight: 20,
  },
  refreshPlanButton: {
    padding: Spacing.xs,
  },
  progressContainer: {
    marginBottom: Spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  progressLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    ...Fonts.data,
    letterSpacing: 1,
  },
  progressText: {
    fontSize: 14,
    color: WorkoutColors.electricBlue,
    ...Fonts.heading,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: WorkoutColors.electricBlue,
    borderRadius: BorderRadius.full,
  },
  startWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: WorkoutColors.electricBlue,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  startWorkoutButtonText: {
    fontSize: 16,
    color: WorkoutColors.darkBg,
    ...Fonts.heading,
    letterSpacing: 1.5,
  },
  completeWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: WorkoutColors.neonLime,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  completeWorkoutButtonText: {
    fontSize: 16,
    color: WorkoutColors.neonLime,
    ...Fonts.heading,
    letterSpacing: 1.5,
  },
  exercisesSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    ...Fonts.data,
    letterSpacing: 2,
    marginBottom: Spacing.md,
  },
  exercisesList: {
    gap: Spacing.md,
  },
  heatmapSection: {
    marginBottom: Spacing.lg,
  },
});
