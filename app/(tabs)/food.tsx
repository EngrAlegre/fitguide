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
  Alert,
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
import { getUserProfile } from '../../utils/profile-storage';
import { UserProfile } from '../../types/profile';

export default function FoodScreen() {
  const router = useRouter();
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadMealPlan = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // First, check if user profile is complete
      const userProfile = await getUserProfile();
      setProfile(userProfile);

      if (!userProfile || !userProfile.age || !userProfile.weight || !userProfile.height || !userProfile.financialStatus) {
        setError('profile_incomplete');
        setIsLoading(false);
        return;
      }

      const plan = await getLatestMealPlan();

      if (!plan) {
        // No meal plan exists, generate one
        console.log('No existing plan found, generating new plan...');
        const newPlan = await generateMealPlan();
        setMealPlan(newPlan);
      } else {
        setMealPlan(plan);
      }
    } catch (error: any) {
      console.error('Error loading meal plan:', error);
      setError(error?.message || 'Failed to load meal plan');
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

    // Check if profile is complete
    if (error === 'profile_incomplete') {
      Alert.alert(
        'Profile Incomplete',
        'Please complete your profile first to generate a meal plan.',
        [{ text: 'Go to Profile', onPress: () => router.push('/(tabs)/profile') }]
      );
      return;
    }

    try {
      setIsRefreshing(true);
      setError(null);
      const newPlan = await generateMealPlan();
      setMealPlan(newPlan);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error: any) {
      console.error('Error refreshing meal plan:', error);
      setError(error?.message || 'Failed to generate meal plan');
      Alert.alert('Error', 'Failed to generate meal plan. Please try again.');
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

  if (error === 'profile_incomplete') {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.emptyState}>
          <View style={styles.iconCircle}>
            <Ionicons name="person" size={48} color={Colors.accent} />
          </View>
          <Text style={styles.emptyTitle}>Complete Your Profile</Text>
          <Text style={styles.emptyText}>
            To generate a personalized meal plan, we need your age, weight, height, and budget preference.
          </Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
              router.push('/(tabs)/profile');
            }}
          >
            <Text style={styles.ctaButtonText}>Complete Profile</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.background} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (error && error !== 'profile_incomplete') {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.emptyState}>
          <View style={styles.iconCircle}>
            <Ionicons name="alert-circle" size={48} color={Colors.error} />
          </View>
          <Text style={styles.emptyTitle}>Something Went Wrong</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
              loadMealPlan();
            }}
          >
            <Ionicons name="refresh" size={20} color={Colors.background} />
            <Text style={styles.ctaButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!mealPlan) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.emptyState}>
          <View style={styles.iconCircle}>
            <Ionicons name="restaurant" size={48} color={Colors.accent} />
          </View>
          <Text style={styles.emptyTitle}>No Meal Plan</Text>
          <Text style={styles.emptyText}>Generate your first personalized meal plan.</Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handleRefreshPlan}
          >
            <Ionicons name="sparkles" size={20} color={Colors.background} />
            <Text style={styles.ctaButtonText}>Generate Plan</Text>
          </TouchableOpacity>
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

        {/* Daily Calorie Goal */}
        {profile?.daily_calorie_goal && (
          <View style={styles.calorieGoalCard}>
            <View style={styles.calorieGoalHeader}>
              <Ionicons name="flame" size={24} color={Colors.accent} />
              <Text style={styles.calorieGoalTitle}>Daily Goal</Text>
            </View>
            <Text style={styles.calorieGoalValue}>{profile.daily_calorie_goal} cal</Text>
            <Text style={styles.calorieGoalSubtext}>
              Optimized for {profile.fitnessGoal?.replace('_', ' ')}
            </Text>
          </View>
        )}

        {/* Days */}
        {mealPlan.days.map((day: DayPlan) => {
          // Calculate total daily calories
          const totalCalories = day.breakfast.calories + day.lunch.calories + day.dinner.calories + day.snacks.calories;

          return (
            <View key={day.dayNumber} style={styles.daySection}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>Day {day.dayNumber}</Text>
                <View style={styles.dayCalories}>
                  <Ionicons name="flame-outline" size={16} color={Colors.accent} />
                  <Text style={styles.dayCaloriesText}>{totalCalories} cal</Text>
                </View>
              </View>

              {/* Meals */}
              <View style={styles.mealsGrid}>
                {(['breakfast', 'lunch', 'dinner', 'snacks'] as const).map((mealType) => {
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
                        <View style={styles.calorieOverlay}>
                          <Ionicons name="flame" size={14} color={Colors.background} />
                          <Text style={styles.calorieOverlayText}>{meal.calories} cal</Text>
                        </View>
                      </View>

                      {/* Meal Content */}
                      <View style={styles.mealContent}>
                        <Text style={styles.mealTypeLabel}>{MEAL_TYPE_LABELS[mealType]}</Text>
                        <Text style={styles.mealName} numberOfLines={2}>
                          {meal.name}
                        </Text>

                        {/* Macro Distribution */}
                        <View style={styles.macrosContainer}>
                          <View style={styles.macroItem}>
                            <Text style={styles.macroLabel}>P</Text>
                            <Text style={styles.macroValue}>{meal.protein}g</Text>
                          </View>
                          <View style={styles.macroDivider} />
                          <View style={styles.macroItem}>
                            <Text style={styles.macroLabel}>C</Text>
                            <Text style={styles.macroValue}>{meal.carbs}g</Text>
                          </View>
                          <View style={styles.macroDivider} />
                          <View style={styles.macroItem}>
                            <Text style={styles.macroLabel}>F</Text>
                            <Text style={styles.macroValue}>{meal.fats}g</Text>
                          </View>
                        </View>

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
          );
        })}
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
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${Colors.accent}15`,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: Spacing.xl,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  ctaButtonText: {
    fontSize: 16,
    color: Colors.background,
    ...Fonts.heading,
  },
  calorieGoalCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  calorieGoalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  calorieGoalTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    ...Fonts.data,
    letterSpacing: 1,
  },
  calorieGoalValue: {
    fontSize: 36,
    color: Colors.accent,
    ...Fonts.heading,
    marginBottom: Spacing.xs,
  },
  calorieGoalSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    ...Fonts.body,
    textTransform: 'capitalize',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  dayCalories: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: `${Colors.accent}15`,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  dayCaloriesText: {
    fontSize: 14,
    color: Colors.accent,
    ...Fonts.heading,
  },
  calorieOverlay: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${Colors.accent}CC`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  calorieOverlayText: {
    fontSize: 12,
    color: Colors.background,
    ...Fonts.heading,
  },
  macrosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    ...Fonts.data,
    marginBottom: 2,
  },
  macroValue: {
    fontSize: 14,
    color: Colors.accent,
    ...Fonts.heading,
  },
  macroDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
  },
});
