import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';

interface DailyProgressBarProps {
  completed: number;
  total: number;
  consumedCalories: number;
  goalCalories: number;
}

export default function DailyProgressBar({
  completed,
  total,
  consumedCalories,
  goalCalories,
}: DailyProgressBarProps) {
  const progressPercentage = (completed / total) * 100;
  const caloriePercentage = Math.min((consumedCalories / goalCalories) * 100, 100);

  return (
    <View style={styles.container}>
      {/* Meals Progress */}
      <View style={styles.section}>
        <View style={styles.header}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />
          <Text style={styles.label}>Meals Completed</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
        </View>
        <Text style={styles.value}>
          {completed} / {total} meals
        </Text>
      </View>

      {/* Calories Progress */}
      <View style={[styles.section, styles.sectionLast]}>
        <View style={styles.header}>
          <Ionicons name="flame" size={20} color={Colors.accent} />
          <Text style={styles.label}>Calories</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${caloriePercentage}%`,
                backgroundColor: caloriePercentage > 100 ? Colors.error : Colors.accent,
              },
            ]}
          />
        </View>
        <Text style={styles.value}>
          {consumedCalories} / {goalCalories} cal
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionLast: {
    marginBottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
    ...Fonts.data,
    letterSpacing: 0.5,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
  },
  value: {
    fontSize: 16,
    color: Colors.textPrimary,
    ...Fonts.heading,
  },
});
