import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';

interface WeeklyChartProps {
  data: { date: string; calories: number }[];
}

const CHART_HEIGHT = 200;
const BAR_WIDTH = 32;

export default function WeeklyChart({ data }: WeeklyChartProps) {
  const maxCalories = Math.max(...data.map((d) => d.calories), 1);

  const getDayLabel = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return days[date.getDay()];
  };

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        {data.map((day, index) => {
          const heightPercentage = maxCalories > 0 ? (day.calories / maxCalories) * 100 : 0;
          const barHeight = (CHART_HEIGHT * heightPercentage) / 100;

          return (
            <View key={day.date} style={styles.barContainer}>
              <View style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(barHeight, day.calories > 0 ? 4 : 0),
                      backgroundColor: day.calories > 0 ? Colors.accent : Colors.cardBg,
                    },
                  ]}
                />
              </View>
              <Text style={styles.dayLabel}>{getDayLabel(day.date)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: CHART_HEIGHT + 30,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    height: CHART_HEIGHT,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: BorderRadius.xs,
    minHeight: 4,
  },
  dayLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    ...Fonts.data,
    letterSpacing: 0.5,
  },
});
