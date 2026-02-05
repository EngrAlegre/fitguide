import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import { BUDGET_CATEGORY_LABELS, MEAL_TYPE_LABELS } from '../../types/mealPlan';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MealDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  // Parse meal data from params
  const meal = params.meal ? JSON.parse(params.meal as string) : null;

  if (!meal) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Meal not found</Text>
      </View>
    );
  }

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const pantryIngredients = meal.ingredients.filter((i: any) => i.isPantry);
  const buyIngredients = meal.ingredients.filter((i: any) => !i.isPantry);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header Image */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: meal.imageUrl }} style={styles.image} resizeMode="cover" />

        {/* Back Button */}
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + Spacing.md }]}
          onPress={handleBack}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        {/* Gradient Overlay */}
        <View style={styles.gradient} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Meal Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.mealType}>{MEAL_TYPE_LABELS[meal.type as keyof typeof MEAL_TYPE_LABELS]}</Text>
            <Text style={styles.budgetBadge}>
              {BUDGET_CATEGORY_LABELS[meal.budgetCategory as keyof typeof BUDGET_CATEGORY_LABELS]}
            </Text>
          </View>
          <Text style={styles.title}>{meal.name}</Text>
          <Text style={styles.description}>{meal.description}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="time" size={20} color={Colors.accent} />
              <Text style={styles.metaText}>{meal.cookingTime} min</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="flame" size={20} color={Colors.accent} />
              <Text style={styles.metaText}>{meal.calories} cal</Text>
            </View>
          </View>

          {/* Macros */}
          <View style={styles.macrosRow}>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{meal.protein}g</Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{meal.carbs}g</Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{meal.fats}g</Text>
              <Text style={styles.macroLabel}>Fats</Text>
            </View>
          </View>
        </View>

        {/* Ingredients Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INGREDIENTS</Text>

          {pantryIngredients.length > 0 && (
            <View style={styles.ingredientGroup}>
              <View style={styles.ingredientGroupHeader}>
                <Ionicons name="basket" size={20} color={Colors.accent} />
                <Text style={styles.ingredientGroupTitle}>From Pantry</Text>
              </View>
              {pantryIngredients.map((ingredient: any, index: number) => (
                <View key={index} style={styles.ingredientItem}>
                  <View style={styles.ingredientDot} />
                  <Text style={styles.ingredientText}>{ingredient.name}</Text>
                </View>
              ))}
            </View>
          )}

          {buyIngredients.length > 0 && (
            <View style={styles.ingredientGroup}>
              <View style={styles.ingredientGroupHeader}>
                <Ionicons name="cart" size={20} color={Colors.success} />
                <Text style={styles.ingredientGroupTitle}>To Buy</Text>
              </View>
              {buyIngredients.map((ingredient: any, index: number) => (
                <View key={index} style={styles.ingredientItem}>
                  <View style={styles.ingredientDot} />
                  <Text style={styles.ingredientText}>{ingredient.name}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Preparation Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PREPARATION</Text>
          {meal.preparationSteps.map((step: string, index: number) => (
            <View key={index} style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    left: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.background}CC`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: Colors.background,
    opacity: 0.8,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  mealType: {
    fontSize: 14,
    color: Colors.accent,
    ...Fonts.data,
    letterSpacing: 1,
  },
  budgetBadge: {
    fontSize: 12,
    color: Colors.textPrimary,
    ...Fonts.body,
    backgroundColor: Colors.cardBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  title: {
    fontSize: 28,
    color: Colors.textPrimary,
    ...Fonts.heading,
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    ...Fonts.body,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metaText: {
    fontSize: 16,
    color: Colors.textPrimary,
    ...Fonts.body,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  macroItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  macroValue: {
    fontSize: 24,
    color: Colors.accent,
    ...Fonts.heading,
  },
  macroLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    ...Fonts.body,
  },
  section: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    ...Fonts.data,
    letterSpacing: 1.5,
    marginBottom: Spacing.lg,
  },
  ingredientGroup: {
    marginBottom: Spacing.lg,
  },
  ingredientGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  ingredientGroupTitle: {
    fontSize: 16,
    color: Colors.textPrimary,
    ...Fonts.heading,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  ingredientDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  ingredientText: {
    fontSize: 16,
    color: Colors.textPrimary,
    ...Fonts.body,
  },
  stepItem: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    color: Colors.background,
    ...Fonts.heading,
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    ...Fonts.body,
    lineHeight: 24,
  },
  errorText: {
    fontSize: 18,
    color: Colors.error,
    ...Fonts.body,
    textAlign: 'center',
    marginTop: 100,
  },
});
