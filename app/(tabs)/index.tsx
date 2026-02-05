import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import ProgressRing from '../../components/ProgressRing';
import ActivityCard from '../../components/ActivityCard';
import LogActivityModal from '../../components/LogActivityModal';
import { Activity, ActivityType } from '../../types/activity';
import { getTodayActivities, addActivity, loadDailyGoal } from '../../utils/storage';

export default function HomeScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [todayActivities, setTodayActivities] = useState<Activity[]>([]);
  const [totalCalories, setTotalCalories] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(2500);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [todaySummary, goal] = await Promise.all([
        getTodayActivities(),
        loadDailyGoal(),
      ]);

      setTodayActivities(todaySummary.activities);
      setTotalCalories(todaySummary.totalCalories);
      setDailyGoal(goal);
    } catch (error) {
      console.error('Error loading data:', error);
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

  const handleSaveActivity = async (
    type: ActivityType,
    duration: number,
    intensity: number,
    calories: number
  ) => {
    const newActivity: Activity = {
      id: Date.now().toString(),
      type,
      duration,
      intensity,
      caloriesBurned: calories,
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0],
    };

    try {
      await addActivity(newActivity);
      await loadData();

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error saving activity:', error);
    }
  };

  const handleAddActivity = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>FITGUIDE</Text>
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
        {/* Progress Ring */}
        <View style={styles.progressSection}>
          <ProgressRing current={totalCalories} goal={dailyGoal} />
        </View>

        {/* Activities Section */}
        <View style={styles.activitiesSection}>
          <Text style={styles.sectionTitle}>TODAY&apos;S ACTIVITIES</Text>

          {todayActivities.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="fitness" size={48} color={Colors.accent} />
              </View>
              <Text style={styles.emptyText}>No activities yet.</Text>
              <Text style={styles.emptySubtext}>Let&apos;s get moving!</Text>
            </View>
          ) : (
            <View style={styles.activitiesList}>
              {todayActivities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAddActivity}>
        <Ionicons name="add" size={32} color={Colors.background} />
      </TouchableOpacity>

      {/* Log Activity Modal */}
      <LogActivityModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveActivity}
      />
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  progressSection: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  activitiesSection: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    ...Fonts.data,
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
  },
  emptyState: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: `${Colors.accent}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.textPrimary,
    ...Fonts.heading,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    ...Fonts.body,
  },
  activitiesList: {
    gap: Spacing.sm,
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: Spacing.lg,
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
