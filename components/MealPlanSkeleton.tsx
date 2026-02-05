import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';
import ShimmerPlaceholder from './ShimmerPlaceholder';

export default function MealPlanSkeleton() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Generating Your Personalized Meal Plan...</Text>
        <Text style={styles.subtitle}>
          Our AI is crafting perfect meals based on your profile 🧑‍🍳
        </Text>
      </View>

      {[1, 2, 3].map((day) => (
        <View key={day} style={styles.daySection}>
          <ShimmerPlaceholder width={100} height={24} borderRadius={8} />

          <View style={styles.mealsGrid}>
            {[1, 2, 3].map((meal) => (
              <View key={meal} style={styles.mealCard}>
                <ShimmerPlaceholder width="100%" height={200} borderRadius={12} />
                <View style={styles.mealContent}>
                  <ShimmerPlaceholder width="70%" height={20} borderRadius={6} />
                  <View style={styles.mealMeta}>
                    <ShimmerPlaceholder width={80} height={16} borderRadius={6} />
                    <ShimmerPlaceholder width={60} height={16} borderRadius={6} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    color: Colors.accent,
    ...Fonts.heading,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    ...Fonts.body,
    textAlign: 'center',
  },
  daySection: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  mealsGrid: {
    gap: Spacing.md,
  },
  mealCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  mealContent: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  mealMeta: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});
