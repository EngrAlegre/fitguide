import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Activity } from '../types/activity';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';

interface ActivityCardProps {
  activity: Activity;
}

const ACTIVITY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Running: 'walk',
  Cycling: 'bicycle',
  Weightlifting: 'barbell',
  Yoga: 'body',
  Swimming: 'water',
  Walking: 'footsteps',
};

export default function ActivityCard({ activity }: ActivityCardProps) {
  const icon = ACTIVITY_ICONS[activity.type] || 'fitness';

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={24} color={Colors.accent} />
      </View>
      <View style={styles.info}>
        <Text style={styles.activityType}>{activity.type}</Text>
        <Text style={styles.details}>
          {activity.duration} min • Intensity {activity.intensity}/10
        </Text>
        <Text style={styles.time}>{formatTime(activity.timestamp)}</Text>
      </View>
      <View style={styles.caloriesContainer}>
        <Text style={styles.calories}>{activity.caloriesBurned}</Text>
        <Text style={styles.caloriesLabel}>CALS</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    backgroundColor: `${Colors.accent}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  info: {
    flex: 1,
  },
  activityType: {
    fontSize: 16,
    color: Colors.textPrimary,
    ...Fonts.heading,
    marginBottom: 4,
  },
  details: {
    fontSize: 13,
    color: Colors.textSecondary,
    ...Fonts.body,
    marginBottom: 2,
  },
  time: {
    fontSize: 12,
    color: Colors.textSecondary,
    ...Fonts.body,
  },
  caloriesContainer: {
    alignItems: 'flex-end',
  },
  calories: {
    fontSize: 24,
    color: Colors.accent,
    ...Fonts.data,
  },
  caloriesLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    ...Fonts.data,
    letterSpacing: 1,
  },
});
