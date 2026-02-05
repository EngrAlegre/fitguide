import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';

interface MacroProgressBarProps {
  label: string;
  current: number;
  target: number;
  color: string;
  unit: string;
}

export default function MacroProgressBar({
  label,
  current,
  target,
  color,
  unit,
}: MacroProgressBarProps) {
  const percentage = Math.min((current / target) * 100, 100);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {current}
          <Text style={styles.target}> / {target}{unit}</Text>
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${percentage}%`,
              backgroundColor: color,
            },
          ]}
        />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: 12,
    color: Colors.textSecondary,
    ...Fonts.data,
    letterSpacing: 1,
  },
  value: {
    fontSize: 16,
    color: Colors.textPrimary,
    ...Fonts.heading,
  },
  target: {
    fontSize: 12,
    color: Colors.textSecondary,
    ...Fonts.body,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
});
