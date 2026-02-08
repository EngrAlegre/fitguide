import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';
import { WorkoutExercise } from '../types/workout';

const WorkoutColors = {
  electricBlue: '#00D4FF',
  neonLime: Colors.accent,
  darkBg: '#0F0F0F',
};

interface ExerciseCardProps {
  exercise: WorkoutExercise;
  index: number;
  onLogSet: (exercise: WorkoutExercise, setNumber: number) => void;
  isWorkoutActive: boolean;
}

export default function ExerciseCard({ exercise, index, onLogSet, isWorkoutActive }: ExerciseCardProps) {
  const completedSets = exercise.completedSets || 0;

  const handleLogSet = (setNumber: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onLogSet(exercise, setNumber);
  };

  return (
    <View style={[styles.card, exercise.isCompleted && styles.cardCompleted]}>
      {/* Exercise Header */}
      <View style={styles.header}>
        <View style={styles.exerciseNumberBadge}>
          <Text style={styles.exerciseNumber}>{index + 1}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
          {exercise.isCompleted && (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={WorkoutColors.neonLime} />
              <Text style={styles.completedText}>COMPLETED</Text>
            </View>
          )}
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description}>{exercise.exerciseDescription}</Text>

      {/* Target Info */}
      <View style={styles.targetInfo}>
        <View style={styles.targetItem}>
          <Ionicons name="repeat" size={16} color={WorkoutColors.electricBlue} />
          <Text style={styles.targetText}>
            {exercise.targetSets} sets × {exercise.targetReps} reps
          </Text>
        </View>
        <View style={styles.targetItem}>
          <Ionicons name="timer" size={16} color={Colors.textSecondary} />
          <Text style={styles.targetText}>{exercise.restSeconds}s rest</Text>
        </View>
      </View>

      {/* Muscle Groups */}
      <View style={styles.muscleGroups}>
        {exercise.muscleGroups.map((muscle, idx) => (
          <View key={idx} style={styles.muscleBadge}>
            <Text style={styles.muscleText}>{muscle}</Text>
          </View>
        ))}
      </View>

      {/* Set Logging Buttons */}
      {isWorkoutActive && (
        <View style={styles.setsContainer}>
          <Text style={styles.setsLabel}>TAP TO LOG SET:</Text>
          <View style={styles.setsGrid}>
            {Array.from({ length: exercise.targetSets }, (_, i) => i + 1).map((setNumber) => {
              const isCompleted = setNumber <= completedSets;
              return (
                <TouchableOpacity
                  key={setNumber}
                  style={[styles.setButton, isCompleted && styles.setButtonCompleted]}
                  onPress={() => handleLogSet(setNumber)}
                  disabled={isCompleted}
                >
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={20} color={WorkoutColors.darkBg} />
                  ) : (
                    <Text style={styles.setButtonText}>{setNumber}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardCompleted: {
    borderColor: WorkoutColors.neonLime,
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  exerciseNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: WorkoutColors.electricBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseNumber: {
    fontSize: 16,
    color: WorkoutColors.darkBg,
    ...Fonts.heading,
  },
  headerText: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 18,
    color: Colors.textPrimary,
    ...Fonts.heading,
    marginBottom: Spacing.xs,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completedText: {
    fontSize: 11,
    color: WorkoutColors.neonLime,
    ...Fonts.heading,
    letterSpacing: 1,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    ...Fonts.body,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  targetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  targetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  targetText: {
    fontSize: 13,
    color: Colors.textSecondary,
    ...Fonts.body,
  },
  muscleGroups: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  muscleBadge: {
    backgroundColor: `${WorkoutColors.electricBlue}20`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  muscleText: {
    fontSize: 11,
    color: WorkoutColors.electricBlue,
    ...Fonts.heading,
    textTransform: 'capitalize',
  },
  setsContainer: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  setsLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    ...Fonts.data,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  setsGrid: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  setButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: WorkoutColors.electricBlue,
  },
  setButtonCompleted: {
    backgroundColor: WorkoutColors.electricBlue,
    borderColor: WorkoutColors.electricBlue,
  },
  setButtonText: {
    fontSize: 16,
    color: WorkoutColors.electricBlue,
    ...Fonts.heading,
  },
});
