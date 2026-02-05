import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import ProgressBar from '../../components/ProgressBar';
import OnboardingCard, { OptionCard } from '../../components/OnboardingCard';
import {
  OnboardingData,
  Gender,
  ActivityLevel,
  FinancialStatus,
  FitnessGoal,
  ACTIVITY_LEVEL_LABELS,
  FINANCIAL_STATUS_LABELS,
  FITNESS_GOAL_LABELS,
  GENDER_LABELS,
} from '../../types/profile';
import { saveUserProfile } from '../../utils/profile-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TOTAL_STEPS = 7;

type Step =
  | 'welcome'
  | 'age'
  | 'gender'
  | 'height_weight'
  | 'activity_level'
  | 'financial_status'
  | 'fitness_goal';

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<Partial<OnboardingData>>({});

  const getStepNumber = (): number => {
    const steps: Step[] = [
      'welcome',
      'age',
      'gender',
      'height_weight',
      'activity_level',
      'financial_status',
      'fitness_goal',
    ];
    return steps.indexOf(currentStep) + 1;
  };

  const progress = getStepNumber() / TOTAL_STEPS;

  const handleNext = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const stepOrder: Step[] = [
      'welcome',
      'age',
      'gender',
      'height_weight',
      'activity_level',
      'financial_status',
      'fitness_goal',
    ];
    const currentIndex = stepOrder.indexOf(currentStep);

    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    } else {
      // Complete onboarding
      await handleComplete();
    }
  };

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const stepOrder: Step[] = [
      'welcome',
      'age',
      'gender',
      'height_weight',
      'activity_level',
      'financial_status',
      'fitness_goal',
    ];
    const currentIndex = stepOrder.indexOf(currentStep);

    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleComplete = async () => {
    try {
      setIsLoading(true);

      // Save profile to Firestore
      await saveUserProfile(formData as OnboardingData);

      // Navigate to tabs
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'welcome':
        return true;
      case 'age':
        return !!formData.age && formData.age > 0 && formData.age < 120;
      case 'gender':
        return !!formData.gender;
      case 'height_weight':
        return !!formData.height && formData.height > 0 && !!formData.weight && formData.weight > 0;
      case 'activity_level':
        return !!formData.activityLevel;
      case 'financial_status':
        return !!formData.financialStatus;
      case 'fitness_goal':
        return !!formData.fitnessGoal;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <OnboardingCard
            title="Welcome to FitGuide! 💪"
            description="Let's personalize your fitness and nutrition journey. We'll create a custom meal plan tailored just for you."
          >
            <View style={styles.welcomeContent}>
              <View style={styles.featureItem}>
                <Ionicons name="restaurant" size={32} color={Colors.accent} />
                <Text style={styles.featureText}>Personalized 3-day meal plans</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="fitness" size={32} color={Colors.accent} />
                <Text style={styles.featureText}>AI-powered nutrition guidance</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="trending-up" size={32} color={Colors.accent} />
                <Text style={styles.featureText}>Track your progress effortlessly</Text>
              </View>
            </View>
          </OnboardingCard>
        );

      case 'age':
        return (
          <OnboardingCard
            title="How old are you?"
            description="This helps us calculate your nutritional needs."
          >
            <TextInput
              style={styles.input}
              placeholder="Enter your age"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="numeric"
              value={formData.age?.toString() || ''}
              onChangeText={(text) => {
                const age = parseInt(text) || 0;
                setFormData({ ...formData, age });
              }}
              maxLength={3}
            />
          </OnboardingCard>
        );

      case 'gender':
        return (
          <OnboardingCard
            title="What's your gender?"
            description="This affects your caloric needs and meal recommendations."
          >
            <View>
              {(Object.keys(GENDER_LABELS) as Gender[]).map((gender) => (
                <OptionCard
                  key={gender}
                  label={GENDER_LABELS[gender]}
                  selected={formData.gender === gender}
                  onPress={() => setFormData({ ...formData, gender })}
                />
              ))}
            </View>
          </OnboardingCard>
        );

      case 'height_weight':
        return (
          <OnboardingCard
            title="Your measurements"
            description="We need these to calculate your ideal calorie intake."
          >
            <View>
              <Text style={styles.inputLabel}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 175"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="numeric"
                value={formData.height?.toString() || ''}
                onChangeText={(text) => {
                  const height = parseInt(text) || 0;
                  setFormData({ ...formData, height });
                }}
                maxLength={3}
              />

              <Text style={[styles.inputLabel, { marginTop: Spacing.lg }]}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 70"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="numeric"
                value={formData.weight?.toString() || ''}
                onChangeText={(text) => {
                  const weight = parseInt(text) || 0;
                  setFormData({ ...formData, weight });
                }}
                maxLength={3}
              />
            </View>
          </OnboardingCard>
        );

      case 'activity_level':
        return (
          <OnboardingCard
            title="Activity level"
            description="How active are you on a typical day?"
          >
            <View>
              {(Object.keys(ACTIVITY_LEVEL_LABELS) as ActivityLevel[]).map((level) => (
                <OptionCard
                  key={level}
                  label={ACTIVITY_LEVEL_LABELS[level]}
                  description={
                    level === 'sedentary'
                      ? 'Little to no exercise'
                      : level === 'lightly_active'
                      ? 'Light exercise 1-3 days/week'
                      : 'Hard exercise 4-7 days/week'
                  }
                  selected={formData.activityLevel === level}
                  onPress={() => setFormData({ ...formData, activityLevel: level })}
                />
              ))}
            </View>
          </OnboardingCard>
        );

      case 'financial_status':
        return (
          <OnboardingCard
            title="Budget preference"
            description="What's your meal budget preference?"
          >
            <View>
              {(Object.keys(FINANCIAL_STATUS_LABELS) as FinancialStatus[]).map((status) => (
                <OptionCard
                  key={status}
                  label={FINANCIAL_STATUS_LABELS[status]}
                  description={
                    status === 'budget_conscious'
                      ? 'Simple, affordable meals'
                      : status === 'balanced'
                      ? 'Quality meets value'
                      : 'Premium ingredients & flavors'
                  }
                  selected={formData.financialStatus === status}
                  onPress={() => setFormData({ ...formData, financialStatus: status })}
                />
              ))}
            </View>
          </OnboardingCard>
        );

      case 'fitness_goal':
        return (
          <OnboardingCard
            title="Fitness goal"
            description="What would you like to achieve?"
          >
            <View>
              {(Object.keys(FITNESS_GOAL_LABELS) as FitnessGoal[]).map((goal) => (
                <OptionCard
                  key={goal}
                  label={FITNESS_GOAL_LABELS[goal]}
                  description={
                    goal === 'lose_weight'
                      ? 'Caloric deficit, fat loss focus'
                      : goal === 'build_muscle'
                      ? 'Protein-rich, muscle building'
                      : 'Balanced nutrition for maintenance'
                  }
                  selected={formData.fitnessGoal === goal}
                  onPress={() => setFormData({ ...formData, fitnessGoal: goal })}
                />
              ))}
            </View>
          </OnboardingCard>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header with Progress */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        {currentStep !== 'welcome' && (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        )}
        <View style={styles.progressContainer}>
          <Text style={styles.stepText}>
            Step {getStepNumber()} of {TOTAL_STEPS}
          </Text>
          <ProgressBar progress={progress} height={6} />
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderStep()}
      </ScrollView>

      {/* Footer with Continue Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <TouchableOpacity
          style={[styles.continueButton, !canProceed() && styles.continueButtonDisabled]}
          onPress={handleNext}
          disabled={!canProceed() || isLoading}
        >
          <Text style={styles.continueButtonText}>
            {currentStep === 'fitness_goal' ? 'Complete' : 'Continue'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.background} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  progressContainer: {
    gap: Spacing.sm,
  },
  stepText: {
    fontSize: 14,
    color: Colors.textSecondary,
    ...Fonts.data,
  },
  scrollView: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.lg,
  },
  continueButtonDisabled: {
    opacity: 0.4,
  },
  continueButtonText: {
    fontSize: 18,
    color: Colors.background,
    ...Fonts.heading,
  },
  welcomeContent: {
    gap: Spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  featureText: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    ...Fonts.body,
  },
  inputLabel: {
    fontSize: 16,
    color: Colors.textPrimary,
    ...Fonts.heading,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: Spacing.lg,
    fontSize: 18,
    color: Colors.textPrimary,
    ...Fonts.body,
  },
});
