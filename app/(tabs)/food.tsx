import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import { DailyNutritionSummary, MealType } from '../../types/nutrition';
import { getTodayMealsFromFirestore } from '../../utils/firebase-storage';
import MacroProgressBar from '../../components/MacroProgressBar';
import MealCard from '../../components/MealCard';
import LogMealModal from '../../components/LogMealModal';

export default function FoodScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('Breakfast');
  const [nutritionSummary, setNutritionSummary] = useState<DailyNutritionSummary>({
    date: new Date().toISOString().split('T')[0],
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFats: 0,
    meals: [],
    mealsByType: {
      Breakfast: [],
      Lunch: [],
      Dinner: [],
      Snack: [],
    },
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const summary = await getTodayMealsFromFirestore();
      setNutritionSummary(summary);
    } catch (error) {
      console.error('Error loading nutrition data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddMeal = (mealType: MealType) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSelectedMealType(mealType);
    setModalVisible(true);
  };

  const handleMealSaved = async () => {
    await loadData();
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const mealTypes: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

  // Calculate macro targets (simple ratio: 30% protein, 40% carbs, 30% fats)
  const calorieGoal = 2000; // This should come from user profile
  const proteinTarget = (calorieGoal * 0.3) / 4; // 4 cal/gram
  const carbsTarget = (calorieGoal * 0.4) / 4;
  const fatsTarget = (calorieGoal * 0.3) / 9; // 9 cal/gram

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>FOOD LOG</Text>
        <Text style={styles.subtitle}>Track your nutrition</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
        }
      >
        {/* Calorie Summary */}
        <View style={styles.calorieCard}>
          <View style={styles.calorieHeader}>
            <Text style={styles.calorieLabel}>CALORIES TODAY</Text>
          </View>
          <Text style={styles.calorieValue}>{nutritionSummary.totalCalories.toLocaleString()}</Text>
          <View style={styles.calorieProgress}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min((nutritionSummary.totalCalories / calorieGoal) * 100, 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.calorieTarget}>Goal: {calorieGoal.toLocaleString()} cal</Text>
          </View>
        </View>

        {/* Macros */}
        <View style={styles.macrosSection}>
          <Text style={styles.sectionTitle}>MACRONUTRIENTS</Text>
          <View style={styles.macrosGrid}>
            <MacroProgressBar
              label="PROTEIN"
              current={Math.round(nutritionSummary.totalProtein)}
              target={Math.round(proteinTarget)}
              color={Colors.accent}
              unit="g"
            />
            <MacroProgressBar
              label="CARBS"
              current={Math.round(nutritionSummary.totalCarbs)}
              target={Math.round(carbsTarget)}
              color="#00D9FF"
              unit="g"
            />
            <MacroProgressBar
              label="FATS"
              current={Math.round(nutritionSummary.totalFats)}
              target={Math.round(fatsTarget)}
              color="#FFB800"
              unit="g"
            />
          </View>
        </View>

        {/* Meals by Type */}
        <View style={styles.mealsSection}>
          <Text style={styles.sectionTitle}>TODAY&apos;S MEALS</Text>
          {mealTypes.map((mealType) => (
            <View key={mealType} style={styles.mealTypeSection}>
              <View style={styles.mealTypeHeader}>
                <View style={styles.mealTypeTitleRow}>
                  <Ionicons
                    name={
                      mealType === 'Breakfast'
                        ? 'sunny'
                        : mealType === 'Lunch'
                        ? 'partly-sunny'
                        : mealType === 'Dinner'
                        ? 'moon'
                        : 'fast-food'
                    }
                    size={20}
                    color={Colors.accent}
                  />
                  <Text style={styles.mealTypeTitle}>{mealType.toUpperCase()}</Text>
                </View>
                <TouchableOpacity
                  style={styles.addMealButton}
                  onPress={() => handleAddMeal(mealType)}
                >
                  <Ionicons name="add" size={20} color={Colors.accent} />
                </TouchableOpacity>
              </View>

              {nutritionSummary.mealsByType[mealType].length === 0 ? (
                <View style={styles.emptyMealState}>
                  <Text style={styles.emptyMealText}>No {mealType.toLowerCase()} logged</Text>
                </View>
              ) : (
                <View style={styles.mealsList}>
                  {nutritionSummary.mealsByType[mealType].map((meal) => (
                    <MealCard key={meal.id} meal={meal} />
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Smart Tips Banner */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb" size={24} color={Colors.accent} />
            <Text style={styles.tipsTitle}>SMART TIP</Text>
          </View>
          <Text style={styles.tipsText}>
            Try eggs, lentils, and beans for budget-friendly protein. These staples cost less than
            $2/lb and provide excellent nutrition!
          </Text>
        </View>
      </ScrollView>

      {/* Log Meal Modal */}
      <LogMealModal
        visible={modalVisible}
        mealType={selectedMealType}
        onClose={() => setModalVisible(false)}
        onSave={handleMealSaved}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: Spacing.xxl + 20,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    color: Colors.textPrimary,
    ...Fonts.heading,
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    ...Fonts.body,
    marginTop: Spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  calorieCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  calorieHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  calorieLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    ...Fonts.data,
    letterSpacing: 1,
  },
  calorieValue: {
    fontSize: 48,
    color: Colors.accent,
    ...Fonts.heading,
    marginBottom: Spacing.md,
  },
  calorieProgress: {
    gap: Spacing.sm,
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
  },
  calorieTarget: {
    fontSize: 12,
    color: Colors.textSecondary,
    ...Fonts.body,
  },
  macrosSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    ...Fonts.data,
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
  },
  macrosGrid: {
    gap: Spacing.md,
  },
  mealsSection: {
    marginBottom: Spacing.lg,
  },
  mealTypeSection: {
    marginBottom: Spacing.lg,
  },
  mealTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  mealTypeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  mealTypeTitle: {
    fontSize: 14,
    color: Colors.textPrimary,
    ...Fonts.heading,
    letterSpacing: 1,
  },
  addMealButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: `${Colors.accent}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMealState: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyMealText: {
    fontSize: 14,
    color: Colors.textSecondary,
    ...Fonts.body,
  },
  mealsList: {
    gap: Spacing.sm,
  },
  tipsCard: {
    backgroundColor: `${Colors.accent}15`,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: `${Colors.accent}40`,
    padding: Spacing.lg,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  tipsTitle: {
    fontSize: 14,
    color: Colors.accent,
    ...Fonts.heading,
    letterSpacing: 1,
  },
  tipsText: {
    fontSize: 14,
    color: Colors.textPrimary,
    ...Fonts.body,
    lineHeight: 20,
  },
});
