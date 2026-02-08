import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import { RecentActivity } from '../../services/coachDataService';
import * as Haptics from 'expo-haptics';

interface ActivityCardProps {
  activity: RecentActivity;
  onPress?: () => void;
}

const ACTIVITY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Cardio: 'bicycle',
  Strength: 'barbell',
  Flexibility: 'body',
  Sports: 'basketball',
};

const INTENSITY_COLORS: Record<number, string> = {
  1: Colors.success,
  2: Colors.warning,
  3: Colors.error,
};

export default function ActivityCard({ activity, onPress }: ActivityCardProps) {
  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const intensityColor = INTENSITY_COLORS[activity.intensity] || Colors.textSecondary;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${intensityColor}20` }]}>
          <Ionicons name={ACTIVITY_ICONS[activity.type] || 'fitness'} size={20} color={intensityColor} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.activityType}>{activity.type}</Text>
          <Text style={styles.timeAgo}>{activity.timeAgo}</Text>
        </View>
        <View style={[styles.caloriesBadge, { backgroundColor: intensityColor }]}>
          <Ionicons name="flame" size={14} color={Colors.background} />
          <Text style={styles.caloriesBadgeText}>{activity.caloriesBurned}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Ionicons name="time" size={16} color={Colors.textSecondary} />
          <Text style={styles.statValue}>{activity.duration} min</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Ionicons name="speedometer" size={16} color={intensityColor} />
          <Text style={styles.statValue}>
            {activity.intensity === 1 ? 'Light' : activity.intensity === 2 ? 'Moderate' : 'Intense'}
          </Text>
        </View>
      </View>

      {/* Intensity Indicator */}
      <View style={styles.intensityContainer}>
        {[1, 2, 3].map((level) => (
          <View
            key={level}
            style={[
              styles.intensityDot,
              {
                backgroundColor: level <= activity.intensity ? intensityColor : Colors.border,
              },
            ]}
          />
        ))}
      </View>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  activityType: {
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
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  caloriesBadgeText: {
    fontSize: 14,
    color: Colors.background,
    ...Fonts.heading,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    ...Fonts.body,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
  },
  intensityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  intensityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
