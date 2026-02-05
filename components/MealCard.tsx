import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';
import { Meal } from '../types/nutrition';

interface MealCardProps {
  meal: Meal;
}

export default function MealCard({ meal }: MealCardProps) {
  const getAnalysisIcon = () => {
    switch (meal.analysis_method) {
      case 'vision':
        return 'camera';
      case 'text':
        return 'chatbubble-ellipses';
      default:
        return 'create';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.description}>{meal.description}</Text>
          {meal.analysis_method && (
            <View style={styles.analysisTag}>
              <Ionicons name={getAnalysisIcon()} size={12} color={Colors.accent} />
            </View>
          )}
        </View>
      </View>

      <View style={styles.nutritionRow}>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>{meal.calories}</Text>
          <Text style={styles.nutritionLabel}>cal</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>{Math.round(meal.protein_grams)}g</Text>
          <Text style={styles.nutritionLabel}>protein</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>{Math.round(meal.carbs_grams)}g</Text>
          <Text style={styles.nutritionLabel}>carbs</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>{Math.round(meal.fats_grams)}g</Text>
          <Text style={styles.nutritionLabel}>fats</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  header: {
    marginBottom: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  description: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    ...Fonts.body,
  },
  analysisTag: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    backgroundColor: `${Colors.accent}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nutritionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  nutritionItem: {
    flex: 1,
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 16,
    color: Colors.textPrimary,
    ...Fonts.heading,
  },
  nutritionLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    ...Fonts.body,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
  },
});
