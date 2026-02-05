import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import { MealPlan, Meal, DayPlan, BUDGET_CATEGORY_LABELS, MEAL_TYPE_LABELS } from '../../types/mealPlan';
import { generateMealPlan, getLatestMealPlan, markMealAsCompleted } from '../../services/mealPlanService';
import MealPlanSkeleton from '../../components/MealPlanSkeleton';

export default function FoodScreen() {
  const router = useRouter();
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadMealPlan = async () => {
    try {
      setIsLoading(true);
      const plan = await getLatestMealPlan();

      if (!plan) {
        // No meal plan exists, generate one
        const newPlan = await generateMealPlan();
        setMealPlan(newPlan);
      } else {
        setMealPlan(plan);
      }
    } catch (error) {
      console.error('Error loading meal plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMealPlan();
  }, []);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const refreshPlan = async () => {
        const plan = await getLatestMealPlan();
        if (plan) {
          setMealPlan(plan);
        }
      };
      refreshPlan();
    }, [])
  );

  const handleRefreshPlan = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      setIsRefreshing(true);
      const newPlan = await generateMealPlan();
      setMealPlan(newPlan);
    } catch (error) {
      console.error('Error refreshing meal plan:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleMealPress = (meal: Meal) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push({
      pathname: '/(tabs)/meal-detail',
      params: { meal: JSON.stringify(meal) },
    });
  };

  const handleCheckOffMeal = async (dayNumber: number, mealType: string, meal: Meal) => {
    if (!mealPlan) return;

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    try {
      await markMealAsCompleted(mealPlan.id, dayNumber, mealType as any);

      // Update local state
      const updatedPlan = { ...mealPlan };
      const day = updatedPlan.days.find((d) => d.dayNumber === dayNumber);
      if (day) {
        (day as any)[mealType].isCompleted = true;
        setMealPlan(updatedPlan);
      }
    } catch (error) {
      console.error('Error marking meal as completed:', error);
    }
  };

  if (isLoading) {
    return <MealPlanSkeleton />;
  }

  if (!mealPlan) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.emptyState}>
          <Ionicons name="restaurant" size={64} color={Colors.accent} />
          <Text style={styles.emptyTitle}>No Meal Plan</Text>
          <Text style={styles.emptyText}>Something went wrong. Please try again.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>MEAL PLAN</Text>
        <Text style={styles.subtitle}>AI-Powered • Personalized • Budget-Friendly</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefreshPlan}
            tintColor={Colors.accent}
          />
        }
      >
        {/* Refresh Button */}
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefreshPlan}>
          <Ionicons name="refresh" size={20} color={Colors.background} />
          <Text style={styles.refreshButtonText}>Generate New Plan</Text>
        </TouchableOpacity>

        {/* Days */}
        {mealPlan.days.map((day: DayPlan) => (
          <View key={day.dayNumber} style={styles.daySection}>
            <Text style={styles.dayTitle}>Day {day.dayNumber}</Text>

            {/* Meals */}
            <View style={styles.mealsGrid}>
              {(['breakfast', 'lunch', 'dinner'] as const).map((mealType) => {
                const meal = day[mealType];
                return (
                  <TouchableOpacity
                    key={mealType}
                    style={[styles.mealCard, meal.isCompleted && styles.mealCardCompleted]}
                    onPress={() => handleMealPress(meal)}
                    activeOpacity={0.7}
                  >
                    {/* Meal Image */}
                    <View style={styles.mealImageContainer}>
                      <Image source={{ uri: meal.imageUrl }} style={styles.mealImage} resizeMode="cover" />
                      {meal.isCompleted && (
                        <View style={styles.completedOverlay}>
                          <Ionicons name="checkmark-circle" size={48} color={Colors.accent} />
                        </View>
                      )}
                    </View>

                    {/* Meal Content */}
                    <View style={styles.mealContent}>
                      <Text style={styles.mealTypeLabel}>{MEAL_TYPE_LABELS[mealType]}</Text>
                      <Text style={styles.mealName} numberOfLines={2}>
                        {meal.name}
                      </Text>

                      <View style={styles.mealMeta}>
                        <View style={styles.mealMetaItem}>
                          <Ionicons name="time" size={16} color={Colors.textSecondary} />
                          <Text style={styles.mealMetaText}>{meal.cookingTime} min</Text>
                        </View>
                        <Text style={styles.budgetBadge}>
                          {BUDGET_CATEGORY_LABELS[meal.budgetCategory]}
                        </Text>
                      </View>

                      {/* Check Off Button */}
                      {!meal.isCompleted && (
                        <TouchableOpacity
                          style={styles.checkOffButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleCheckOffMeal(day.dayNumber, mealType, meal);
                          }}
                        >
                          <Ionicons name="checkmark" size={16} color={Colors.background} />
                          <Text style={styles.checkOffButtonText}>Mark Complete</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
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
  logo: {
    fontSize: 28,
    color: Colors.accent,
    ...Fonts.heading,
    letterSpacing: 2,
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
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  refreshButtonText: {
    fontSize: 16,
    color: Colors.background,
    ...Fonts.heading,
  },
  daySection: {
    marginBottom: Spacing.xl,
  },
  dayTitle: {
    fontSize: 24,
    color: Colors.textPrimary,
    ...Fonts.heading,
    marginBottom: Spacing.md,
  },
  mealsGrid: {
    gap: Spacing.md,
  },
  mealCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  mealCardCompleted: {
    borderColor: Colors.accent,
    opacity: 0.8,
  },
  mealImageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  mealImage: {
    width: '100%',
    height: '100%',
  },
  completedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: `${Colors.background}AA`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealContent: {
    padding: Spacing.md,
  },
  mealTypeLabel: {
    fontSize: 12,
    color: Colors.accent,
    ...Fonts.data,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  mealName: {
    fontSize: 20,
    color: Colors.textPrimary,
    ...Fonts.heading,
    marginBottom: Spacing.sm,
  },
  mealMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  mealMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  mealMetaText: {
    fontSize: 14,
    color: Colors.textSecondary,
    ...Fonts.body,
  },
  budgetBadge: {
    fontSize: 12,
    color: Colors.textPrimary,
    ...Fonts.body,
    backgroundColor: `${Colors.accent}20`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  checkOffButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
  },
  checkOffButtonText: {
    fontSize: 14,
    color: Colors.background,
    ...Fonts.heading,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 24,
    color: Colors.textPrimary,
    ...Fonts.heading,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    ...Fonts.body,
    textAlign: 'center',
  },
});
