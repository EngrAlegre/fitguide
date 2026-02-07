import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';

const WorkoutColors = {
  electricBlue: '#00D4FF',
  neonLime: Colors.accent,
};

interface WorkoutHeatmapProps {
  workoutDates: string[]; // Array of dates in YYYY-MM-DD format
}

export default function WorkoutHeatmap({ workoutDates }: WorkoutHeatmapProps) {
  // Get last 12 weeks
  const today = new Date();
  const weeks: { date: Date; workoutCount: number }[][] = [];

  for (let weekOffset = 11; weekOffset >= 0; weekOffset--) {
    const week: { date: Date; workoutCount: number }[] = [];
    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
      const date = new Date(today);
      date.setDate(date.getDate() - (weekOffset * 7 + dayOffset));

      const dateStr = date.toISOString().split('T')[0];
      const workoutCount = workoutDates.filter((d) => d === dateStr).length;

      week.push({ date, workoutCount });
    }
    weeks.push(week);
  }

  const getColor = (count: number): string => {
    if (count === 0) return Colors.border;
    if (count === 1) return `${WorkoutColors.electricBlue}40`;
    if (count === 2) return `${WorkoutColors.electricBlue}80`;
    return WorkoutColors.electricBlue;
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.week}>
            {week.map((day, dayIndex) => (
              <View
                key={dayIndex}
                style={[
                  styles.day,
                  {
                    backgroundColor: getColor(day.workoutCount),
                  },
                ]}
              />
            ))}
          </View>
        ))}
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendText}>Less</Text>
        <View style={[styles.legendBox, { backgroundColor: Colors.border }]} />
        <View style={[styles.legendBox, { backgroundColor: `${WorkoutColors.electricBlue}40` }]} />
        <View style={[styles.legendBox, { backgroundColor: `${WorkoutColors.electricBlue}80` }]} />
        <View style={[styles.legendBox, { backgroundColor: WorkoutColors.electricBlue }]} />
        <Text style={styles.legendText}>More</Text>
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
  grid: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: Spacing.md,
  },
  week: {
    flexDirection: 'column',
    gap: 3,
  },
  day: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  legendText: {
    fontSize: 11,
    color: Colors.textSecondary,
    ...Fonts.body,
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
});
