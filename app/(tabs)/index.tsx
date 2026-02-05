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
import { useFirebaseAuth } from '../../lib/firebase-auth-provider';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import ActivityCard from '../../components/ActivityCard';
import LogActivityModal from '../../components/LogActivityModal';
import { Activity, ActivityType } from '../../types/activity';
import { EnergyBalance } from '../../types/nutrition';
import {
  getTodayActivitiesFromFirestore,
  addActivityToFirestore,
  getEnergyBalanceFromFirestore,
} from '../../utils/firebase-storage';

export default function HomeScreen() {
  const { user } = useFirebaseAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [todayActivities, setTodayActivities] = useState<Activity[]>([]);
  const [energyBalance, setEnergyBalance] = useState<EnergyBalance>({
    caloriesIn: 0,
    caloriesOut: 0,
    balance: 0,
    date: new Date().toISOString().split('T')[0],
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [todaySummary, balance] = await Promise.all([
        getTodayActivitiesFromFirestore(),
        getEnergyBalanceFromFirestore(),
      ]);

      setTodayActivities(todaySummary.activities);
      setEnergyBalance(balance);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadData();
      }
    }, [user])
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
    try {
      await addActivityToFirestore({
        type,
        duration,
        intensity,
        caloriesBurned: calories,
        date: new Date().toISOString().split('T')[0],
      });

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

  const isFirstTime = todayActivities.length === 0 && energyBalance.caloriesIn === 0;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>FITGUIDE</Text>
        <Text style={styles.subtitle}>Home Workouts • Budget Nutrition</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
        }
      >
        {/* Energy Balance Card */}
        <View style={styles.energyBalanceCard}>
          <Text style={styles.energyBalanceTitle}>ENERGY BALANCE</Text>

          <View style={styles.energyBalanceRow}>
            <View style={styles.energyBalanceItem}>
              <View style={[styles.energyIcon, { backgroundColor: `${Colors.success}20` }]}>
                <Ionicons name="restaurant" size={24} color={Colors.success} />
              </View>
              <Text style={styles.energyLabel}>Calories In</Text>
              <Text style={styles.energyValue}>{energyBalance.caloriesIn}</Text>
            </View>

            <View style={styles.energyBalanceDivider}>
              <Ionicons name="remove" size={24} color={Colors.textSecondary} />
            </View>

            <View style={styles.energyBalanceItem}>
              <View style={[styles.energyIcon, { backgroundColor: `${Colors.accent}20` }]}>
                <Ionicons name="fitness" size={24} color={Colors.accent} />
              </View>
              <Text style={styles.energyLabel}>Calories Out</Text>
              <Text style={styles.energyValue}>{energyBalance.caloriesOut}</Text>
            </View>

            <View style={styles.energyBalanceDivider}>
              <Ionicons name="arrow-forward" size={24} color={Colors.textSecondary} />
            </View>

            <View style={styles.energyBalanceItem}>
              <View style={[styles.energyIcon, { backgroundColor: `${Colors.textSecondary}20` }]}>
                <Ionicons name="analytics" size={24} color={Colors.textPrimary} />
              </View>
              <Text style={styles.energyLabel}>Net Balance</Text>
              <Text style={[styles.energyValue, energyBalance.balance > 0 && styles.energyPositive]}>
                {energyBalance.balance > 0 ? '+' : ''}
                {energyBalance.balance}
              </Text>
            </View>
          </View>

          <View style={styles.energyBalanceFooter}>
            <Text style={styles.energyBalanceFooterText}>
              {energyBalance.balance > 0
                ? 'Caloric surplus - building energy'
                : energyBalance.balance < 0
                ? 'Caloric deficit - burning stored energy'
                : 'Perfect balance - maintaining weight'}
            </Text>
          </View>
        </View>

        {/* First Time Guide */}
        {isFirstTime && (
          <View style={styles.guideCard}>
            <View style={styles.guideHeader}>
              <Ionicons name="information-circle" size={28} color={Colors.accent} />
              <Text style={styles.guideTitle}>Welcome to Fitguide!</Text>
            </View>
            <Text style={styles.guideText}>
              Start your fitness journey with bodyweight exercises you can do at home. No expensive
              equipment needed - just your body and determination!
            </Text>
            <View style={styles.guideActions}>
              <TouchableOpacity style={styles.guideButton} onPress={handleAddActivity}>
                <Ionicons name="fitness" size={18} color={Colors.background} />
                <Text style={styles.guideButtonText}>Log First Workout</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Activities Section */}
        <View style={styles.activitiesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>TODAY&apos;S WORKOUTS</Text>
            <Ionicons name="body" size={18} color={Colors.accent} />
          </View>

          {todayActivities.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="barbell" size={48} color={Colors.accent} />
              </View>
              <Text style={styles.emptyText}>No workouts yet today</Text>
              <Text style={styles.emptySubtext}>Try push-ups, squats, or a quick home HIIT!</Text>
            </View>
          ) : (
            <View style={styles.activitiesList}>
              {todayActivities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </View>
          )}
        </View>

        {/* Budget-Friendly Tip */}
        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Ionicons name="bulb" size={24} color={Colors.accent} />
            <Text style={styles.tipTitle}>SMART TIP</Text>
          </View>
          <Text style={styles.tipText}>
            <Text style={styles.tipTextBold}>Bodyweight Circuit:</Text> 20 push-ups, 30 squats, 15
            lunges (each leg), 30-sec plank. Repeat 3x. Zero equipment, maximum results! 💪
          </Text>
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
  subtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    ...Fonts.body,
    marginTop: Spacing.xs,
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  energyBalanceCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  energyBalanceTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    ...Fonts.data,
    letterSpacing: 1.5,
    marginBottom: Spacing.lg,
  },
  energyBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  energyBalanceItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  energyIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  energyLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    ...Fonts.body,
    textAlign: 'center',
  },
  energyValue: {
    fontSize: 20,
    color: Colors.textPrimary,
    ...Fonts.heading,
  },
  energyPositive: {
    color: Colors.success,
  },
  energyBalanceDivider: {
    marginHorizontal: Spacing.xs,
  },
  energyBalanceFooter: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  energyBalanceFooterText: {
    fontSize: 12,
    color: Colors.textSecondary,
    ...Fonts.body,
    textAlign: 'center',
    lineHeight: 18,
  },
  guideCard: {
    backgroundColor: `${Colors.accent}15`,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: `${Colors.accent}40`,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  guideTitle: {
    fontSize: 18,
    color: Colors.accent,
    ...Fonts.heading,
  },
  guideText: {
    fontSize: 14,
    color: Colors.textPrimary,
    ...Fonts.body,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  guideActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  guideButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
  },
  guideButtonText: {
    fontSize: 14,
    color: Colors.background,
    ...Fonts.heading,
  },
  activitiesSection: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    ...Fonts.data,
    letterSpacing: 1.5,
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
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    ...Fonts.body,
    textAlign: 'center',
  },
  activitiesList: {
    gap: Spacing.sm,
  },
  tipCard: {
    backgroundColor: `${Colors.accent}15`,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: `${Colors.accent}40`,
    padding: Spacing.lg,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  tipTitle: {
    fontSize: 14,
    color: Colors.accent,
    ...Fonts.heading,
    letterSpacing: 1,
  },
  tipText: {
    fontSize: 14,
    color: Colors.textPrimary,
    ...Fonts.body,
    lineHeight: 20,
  },
  tipTextBold: {
    ...Fonts.heading,
    color: Colors.accent,
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
