import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';
import * as Haptics from 'expo-haptics';

interface OnboardingCardProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export default function OnboardingCard({ title, description, children }: OnboardingCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

interface OptionCardProps {
  label: string;
  description?: string;
  icon?: string;
  selected: boolean;
  onPress: () => void;
}

export function OptionCard({ label, description, selected, onPress }: OptionCardProps) {
  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Pressable
      style={[styles.optionCard, selected && styles.optionCardSelected]}
      onPress={handlePress}
    >
      <View style={styles.optionContent}>
        <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{label}</Text>
        {description && (
          <Text style={[styles.optionDescription, selected && styles.optionDescriptionSelected]}>
            {description}
          </Text>
        )}
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioDot} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
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
  },
  content: {
    flex: 1,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  optionCardSelected: {
    borderColor: Colors.accent,
    backgroundColor: `${Colors.accent}15`,
  },
  optionContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  optionLabel: {
    fontSize: 18,
    color: Colors.textPrimary,
    ...Fonts.heading,
    marginBottom: Spacing.xs,
  },
  optionLabelSelected: {
    color: Colors.accent,
  },
  optionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    ...Fonts.body,
    lineHeight: 20,
  },
  optionDescriptionSelected: {
    color: Colors.textPrimary,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: Colors.accent,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.accent,
  },
});
