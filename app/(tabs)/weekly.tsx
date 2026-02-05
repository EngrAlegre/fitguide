import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import WeeklyChart from '../../components/WeeklyChart';
import { WeeklySummary } from '../../types/activity';
import { getWeeklySummary } from '../../utils/storage';

export default function WeeklyScreen() {
  const router = useRouter();
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary>({
    totalCalories: 0,
    bestDay: null,
    dailyTotals: [],
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const summary = await getWeeklySummary();
      setWeeklySummary(summary);
    } catch (error) {
      console.error('Error loading weekly summary:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  const hasData = weeklySummary.totalCalories > 0;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>WEEKLY PROGRESS</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
          />
        }
      >
        {hasData ? (
          <>
            {/* Chart */}
            <View style={styles.chartSection}>
              <WeeklyChart data={weeklySummary.dailyTotals} />
            </View>

            {/* Stats */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>BEST DAY</Text>
                <Text style={styles.statValue}>
                  {weeklySummary.bestDay?.calories.toLocaleString() || 0} CALS
                </Text>
                <Text style={styles.statSubtext}>
                  {weeklySummary.bestDay ? formatDate(weeklySummary.bestDay.date) : 'No Data'}
                </Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statLabel}>TOTAL WEEKLY BURN</Text>
                <Text style={styles.statValue}>
                  {weeklySummary.totalCalories.toLocaleString()} CALS
                </Text>
                <Text style={styles.statSubtext}>
                  {weeklySummary.dailyTotals.filter((d) => d.calories > 0).length} active days
                </Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyContent}>
              <View style={styles.emptyChartPlaceholder}>
                {Array.from({ length: 7 }).map((_, i) => (
                  <View key={i} style={styles.emptyBar} />
                ))}
              </View>
              <Text style={styles.emptyTitle}>Log your first activity to see</Text>
              <Text style={styles.emptyTitle}>your weekly summary.</Text>
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={() => router.push('/(tabs)' as any)}
              >
                <Text style={styles.ctaButtonText}>ADD FIRST ACTIVITY</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  title: {
    fontSize: 20,
    color: Colors.textPrimary,
    ...Fonts.heading,
    letterSpacing: 1.5,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  chartSection: {
    marginBottom: Spacing.lg,
  },
  statsGrid: {
    gap: Spacing.md,
  },
  statCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    ...Fonts.data,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: 32,
    color: Colors.textPrimary,
    ...Fonts.heading,
    marginBottom: Spacing.xs,
  },
  statSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    ...Fonts.body,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyContent: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    width: '100%',
  },
  emptyChartPlaceholder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    width: '100%',
    marginBottom: Spacing.xl,
  },
  emptyBar: {
    flex: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
    height: '40%',
    borderRadius: BorderRadius.xs,
  },
  emptyTitle: {
    fontSize: 16,
    color: Colors.textPrimary,
    ...Fonts.body,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
  },
  ctaButtonText: {
    fontSize: 14,
    color: Colors.background,
    ...Fonts.heading,
    letterSpacing: 1,
  },
});
