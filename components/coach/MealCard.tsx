import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import { RecentMeal } from '../../services/coachDataService';
import * as Haptics from 'expo-haptics';

interface MealCardProps {
  meal: RecentMeal;
  onPress?: () => void;
}

const MEAL_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Breakfast: 'sunny',
  Lunch: 'restaurant',
  Dinner: 'moon',
  Snack: 'fast-food',
};

export default function MealCard({ meal, onPress }: MealCardProps) {
  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name={MEAL_ICONS[meal.meal_type] || 'restaurant'} size={20} color={Colors.accent} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.mealType}>{meal.meal_type}</Text>
          <Text style={styles.timeAgo}>{meal.timeAgo}</Text>
        </View>
        <View style={styles.caloriesBadge}>
          <Text style={styles.caloriesBadgeText}>{meal.calories}</Text>
          <Text style={styles.caloriesUnit}>cal</Text>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description} numberOfLines={2}>
        {meal.description}
      </Text>

      {/* Macros */}
      <View style={styles.macros}>
        <View style={styles.macro}>
          <Text style={styles.macroValue}>{meal.protein_grams}g</Text>
          <Text style={styles.macroLabel}>Protein</Text>
        </View>
        <View style={styles.macroDivider} />
        <View style={styles.macro}>
          <Text style={styles.macroValue}>{meal.carbs_grams}g</Text>
          <Text style={styles.macroLabel}>Carbs</Text>
        </View>
        <View style={styles.macroDivider} />
        <View style={styles.macro}>
          <Text style={styles.macroValue}>{meal.fats_grams}g</Text>
          <Text style={styles.macroLabel}>Fats</Text>
        </View>
      </View>

      {/* Analysis Method Badge */}
      {meal.analysis_method && (
        <View style={styles.methodBadge}>
          <Ionicons
            name={meal.analysis_method === 'vision' ? 'camera' : 'text'}
            size={10}
            color={Colors.textSecondary}
          />
          <Text style={styles.methodText}>
            {meal.analysis_method === 'vision' ? 'AI Vision' : 'AI Text'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: `${Colors.accent}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  mealType: {
    fontSize: 16,
    color: Colors.textPrimary,
    ...Fonts.heading,
  },
  timeAgo: {
    fontSize: 11,
    color: Colors.textSecondary,
    ...Fonts.body,
    marginTop: 2,
  },
  caloriesBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  caloriesBadgeText: {
    fontSize: 16,
    color: Colors.background,
    ...Fonts.heading,
  },
  caloriesUnit: {
    fontSize: 10,
    color: Colors.background,
    ...Fonts.body,
  },
  description: {
    fontSize: 14,
    color: Colors.textPrimary,
    ...Fonts.body,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  macros: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  macro: {
    alignItems: 'center',
    flex: 1,
  },
  macroValue: {
    fontSize: 15,
    color: Colors.textPrimary,
    ...Fonts.heading,
  },
  macroLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    ...Fonts.body,
    marginTop: 2,
  },
  macroDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
  },
  methodBadge: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  methodText: {
    fontSize: 9,
    color: Colors.textSecondary,
    ...Fonts.body,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
