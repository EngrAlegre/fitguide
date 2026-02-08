import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import { getRecentMeals, getRecentActivities, RecentMeal, RecentActivity } from '../../services/coachDataService';
import MealCard from './MealCard';
import ActivityCard from './ActivityCard';
import * as Haptics from 'expo-haptics';

interface ShareToCoachSheetProps {
  visible: boolean;
  onClose: () => void;
  onShareMeal: (meal: RecentMeal) => void;
  onShareActivity: (activity: RecentActivity) => void;
}

export default function ShareToCoachSheet({
  visible,
  onClose,
  onShareMeal,
  onShareActivity,
}: ShareToCoachSheetProps) {
  const [activeTab, setActiveTab] = useState<'meals' | 'activities'>('meals');
  const [meals, setMeals] = useState<RecentMeal[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mealsData, activitiesData] = await Promise.all([getRecentMeals(), getRecentActivities()]);
      setMeals(mealsData);
      setActivities(activitiesData);
    } catch (error) {
      console.error('Error loading data for share sheet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: 'meals' | 'activities') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  const handleShareMeal = (meal: RecentMeal) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onShareMeal(meal);
    onClose();
  };

  const handleShareActivity = (activity: RecentActivity) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onShareActivity(activity);
    onClose();
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <Text style={styles.title}>Share to Coach</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'meals' && styles.activeTab]}
              onPress={() => handleTabChange('meals')}
            >
              <Ionicons
                name="restaurant"
                size={20}
                color={activeTab === 'meals' ? Colors.accent : Colors.textSecondary}
              />
              <Text style={[styles.tabText, activeTab === 'meals' && styles.activeTabText]}>
                Meals ({meals.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'activities' && styles.activeTab]}
              onPress={() => handleTabChange('activities')}
            >
              <Ionicons
                name="barbell"
                size={20}
                color={activeTab === 'activities' ? Colors.accent : Colors.textSecondary}
              />
              <Text style={[styles.tabText, activeTab === 'activities' && styles.activeTabText]}>
                Workouts ({activities.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.accent} />
                <Text style={styles.loadingText}>Loading your recent logs...</Text>
              </View>
            ) : activeTab === 'meals' ? (
              meals.length > 0 ? (
                meals.map((meal) => (
                  <MealCard key={meal.id} meal={meal} onPress={() => handleShareMeal(meal)} />
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="restaurant-outline" size={48} color={Colors.textSecondary} />
                  <Text style={styles.emptyText}>No meals logged in the last 48 hours</Text>
                  <Text style={styles.emptySubtext}>Start logging meals to share them with your coach</Text>
                </View>
              )
            ) : activities.length > 0 ? (
              activities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} onPress={() => handleShareActivity(activity)} />
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="barbell-outline" size={48} color={Colors.textSecondary} />
                <Text style={styles.emptyText}>No workouts logged in the last 48 hours</Text>
                <Text style={styles.emptySubtext}>Complete a workout to share it with your coach</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '80%',
    paddingBottom: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 20,
    color: Colors.textPrimary,
    ...Fonts.heading,
  },
  closeButton: {
    position: 'absolute',
    right: Spacing.lg,
    top: Spacing.md,
    padding: Spacing.xs,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeTab: {
    backgroundColor: `${Colors.accent}20`,
    borderColor: Colors.accent,
  },
  tabText: {
    fontSize: 14,
    color: Colors.textSecondary,
    ...Fonts.body,
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.accent,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  loadingContainer: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    ...Fonts.body,
  },
  emptyContainer: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textPrimary,
    ...Fonts.heading,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    ...Fonts.body,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
});
