import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFirebaseAuth } from '../../lib/firebase-auth-provider';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import {
  UserProfile,
  ActivityLevel,
  FinancialStatus,
  FitnessGoal,
  ACTIVITY_LEVEL_LABELS,
  FINANCIAL_STATUS_LABELS,
  FITNESS_GOAL_LABELS,
} from '../../types/profile';
import { getUserProfile } from '../../utils/profile-storage';
import {
  updateProfileMetrics,
  updateFinancialStatus,
  updateActivityLevel,
} from '../../utils/profile-updates';
import { updatePassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';

type EditMode = 'age' | 'weight' | 'height' | 'activityLevel' | 'financialStatus' | null;
type SavingField = 'age' | 'weight' | 'height' | 'activityLevel' | 'financialStatus' | null;

export default function ProfileScreen() {
  const { user, signOut } = useFirebaseAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [savingField, setSavingField] = useState<SavingField>(null);
  const [savedField, setSavedField] = useState<SavingField>(null);
  const [previousCalories, setPreviousCalories] = useState<number | null>(null);

  // Temporary edit values
  const [tempAge, setTempAge] = useState('');
  const [tempWeight, setTempWeight] = useState('');
  const [tempHeight, setTempHeight] = useState('');

  // Password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profileData = await getUserProfile();
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handleEditAge = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setTempAge(profile?.age?.toString() || '');
    setEditMode('age');
  };

  const handleEditWeight = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setTempWeight(profile?.weight?.toString() || '');
    setEditMode('weight');
  };

  const handleEditHeight = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setTempHeight(profile?.height?.toString() || '');
    setEditMode('height');
  };

  const handleSaveAge = async () => {
    const age = parseInt(tempAge, 10);
    if (isNaN(age) || age <= 0 || age > 120) {
      Alert.alert('Invalid Age', 'Please enter a valid age (1-120)');
      return;
    }

    setSavingField('age');
    setPreviousCalories(profile?.daily_calorie_goal || null);
    try {
      await updateProfileMetrics({ age });
      const updatedProfile = await getUserProfile();
      setProfile(updatedProfile);
      setEditMode(null);
      setSavingField(null);
      setSavedField('age');

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Show calorie update notification if changed
      if (previousCalories && updatedProfile?.daily_calorie_goal &&
          previousCalories !== updatedProfile.daily_calorie_goal) {
        Alert.alert(
          'Calories Updated',
          `Your daily calorie goal has been recalculated to ${updatedProfile.daily_calorie_goal} calories based on your updated metrics.`
        );
      }

      // Clear saved indicator after 2 seconds
      setTimeout(() => {
        setSavedField(null);
        setPreviousCalories(null);
      }, 2000);
    } catch (error: any) {
      console.error('Error updating age:', error);
      setSavingField(null);
      const errorMessage = error?.message || 'Failed to save age. Please check your connection and try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleSaveWeight = async () => {
    const weight = parseFloat(tempWeight);
    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight');
      return;
    }

    setSavingField('weight');
    setPreviousCalories(profile?.daily_calorie_goal || null);
    try {
      await updateProfileMetrics({ weight });
      const updatedProfile = await getUserProfile();
      setProfile(updatedProfile);
      setEditMode(null);
      setSavingField(null);
      setSavedField('weight');

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Show calorie update notification if changed
      if (previousCalories && updatedProfile?.daily_calorie_goal &&
          previousCalories !== updatedProfile.daily_calorie_goal) {
        Alert.alert(
          'Calories Updated',
          `Your daily calorie goal has been recalculated to ${updatedProfile.daily_calorie_goal} calories based on your updated metrics.`
        );
      }

      // Clear saved indicator after 2 seconds
      setTimeout(() => {
        setSavedField(null);
        setPreviousCalories(null);
      }, 2000);
    } catch (error: any) {
      console.error('Error updating weight:', error);
      setSavingField(null);
      const errorMessage = error?.message || 'Failed to save weight. Please check your connection and try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleSaveHeight = async () => {
    const height = parseFloat(tempHeight);
    if (isNaN(height) || height <= 0) {
      Alert.alert('Invalid Height', 'Please enter a valid height');
      return;
    }

    setSavingField('height');
    setPreviousCalories(profile?.daily_calorie_goal || null);
    try {
      await updateProfileMetrics({ height });
      const updatedProfile = await getUserProfile();
      setProfile(updatedProfile);
      setEditMode(null);
      setSavingField(null);
      setSavedField('height');

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Show calorie update notification if changed
      if (previousCalories && updatedProfile?.daily_calorie_goal &&
          previousCalories !== updatedProfile.daily_calorie_goal) {
        Alert.alert(
          'Calories Updated',
          `Your daily calorie goal has been recalculated to ${updatedProfile.daily_calorie_goal} calories based on your updated metrics.`
        );
      }

      // Clear saved indicator after 2 seconds
      setTimeout(() => {
        setSavedField(null);
        setPreviousCalories(null);
      }, 2000);
    } catch (error: any) {
      console.error('Error updating height:', error);
      setSavingField(null);
      const errorMessage = error?.message || 'Failed to save height. Please check your connection and try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleUpdateActivityLevel = async (level: ActivityLevel) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setSavingField('activityLevel');
    setPreviousCalories(profile?.daily_calorie_goal || null);
    try {
      await updateActivityLevel(level);
      const updatedProfile = await getUserProfile();
      setProfile(updatedProfile);
      setEditMode(null);
      setSavingField(null);
      setSavedField('activityLevel');

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Show calorie update notification if changed
      if (previousCalories && updatedProfile?.daily_calorie_goal &&
          previousCalories !== updatedProfile.daily_calorie_goal) {
        Alert.alert(
          'Calories Updated',
          `Your daily calorie goal has been recalculated to ${updatedProfile.daily_calorie_goal} calories based on your updated activity level.`
        );
      }

      // Clear saved indicator after 2 seconds
      setTimeout(() => {
        setSavedField(null);
        setPreviousCalories(null);
      }, 2000);
    } catch (error: any) {
      console.error('Error updating activity level:', error);
      setSavingField(null);
      const errorMessage = error?.message || 'Failed to save activity level. Please check your connection and try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleUpdateFinancialStatus = async (status: FinancialStatus) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setSavingField('financialStatus');
    try {
      await updateFinancialStatus(status);
      const updatedProfile = await getUserProfile();
      setProfile(updatedProfile);
      setEditMode(null);
      setSavingField(null);
      setSavedField('financialStatus');

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Clear saved indicator after 2 seconds
      setTimeout(() => setSavedField(null), 2000);
    } catch (error: any) {
      console.error('Error updating financial status:', error);
      setSavingField(null);
      const errorMessage = error?.message || 'Failed to save budget preference. Please check your connection and try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return;
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      await updatePassword(currentUser, newPassword);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert('Success', 'Password updated successfully');
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Password update error:', error);
      if (error.code === 'auth/requires-recent-login') {
        Alert.alert(
          'Authentication Required',
          'For security, please sign out and sign in again before changing your password.'
        );
      } else {
        Alert.alert('Error', 'Failed to update password. Please try again.');
      }
    }
  };

  const handleLogout = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  const getBudgetLabel = (status?: FinancialStatus): string => {
    if (!status) return 'Not set';
    return FINANCIAL_STATUS_LABELS[status];
  };

  const getGoalLabel = (goal?: FitnessGoal): string => {
    if (!goal) return 'Not set';
    return FITNESS_GOAL_LABELS[goal];
  };

  const getBudgetDescription = (status?: FinancialStatus): string => {
    switch (status) {
      case 'budget_conscious':
        return '$30-40/week • Focus on affordable staples';
      case 'balanced':
        return '$50-70/week • Mix of quality and value';
      case 'premium_gourmet':
        return '$80+/week • Premium ingredients';
      default:
        return 'Not configured';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={Colors.accent} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PROFILE</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info Card */}
        <View style={styles.card}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={80} color={Colors.accent} />
          </View>
          <Text style={styles.userName}>{user?.email?.split('@')[0] || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.goalBadge}>
            <Ionicons name="trophy" size={16} color={Colors.background} />
            <Text style={styles.goalBadgeText}>Goal: {getGoalLabel(profile?.fitnessGoal)}</Text>
          </View>
        </View>

        {/* Coach's Lens Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Ionicons name="eye" size={24} color={Colors.accent} />
            </View>
            <Text style={styles.cardTitle}>COACH&apos;S LENS</Text>
          </View>
          <Text style={styles.coachText}>
            Your AI Coach is optimizing for{' '}
            <Text style={styles.coachHighlight}>{getBudgetLabel(profile?.financialStatus)}</Text>{' '}
            budget and{' '}
            <Text style={styles.coachHighlight}>{getGoalLabel(profile?.fitnessGoal)}</Text> at{' '}
            <Text style={styles.coachHighlight}>{profile?.daily_calorie_goal || 2500} calories</Text>.
          </Text>
        </View>

        {/* Personal Metrics Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Ionicons name="body" size={24} color={Colors.accent} />
            </View>
            <Text style={styles.cardTitle}>PERSONAL METRICS</Text>
          </View>

          {/* Age */}
          <View style={styles.metricRow}>
            <View style={styles.metricLabel}>
              <Ionicons name="calendar" size={20} color={Colors.textSecondary} />
              <Text style={styles.metricLabelText}>Age</Text>
              {savingField === 'age' && (
                <Text style={styles.savingText}>Saving...</Text>
              )}
              {savedField === 'age' && (
                <View style={styles.savedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.savedText}>Saved</Text>
                </View>
              )}
            </View>
            {editMode === 'age' ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.input}
                  value={tempAge}
                  onChangeText={setTempAge}
                  keyboardType="numeric"
                  placeholder="years"
                  placeholderTextColor={Colors.textSecondary}
                  autoFocus
                  editable={savingField !== 'age'}
                />
                <TouchableOpacity
                  style={[styles.saveButton, savingField === 'age' && styles.buttonDisabled]}
                  onPress={handleSaveAge}
                  disabled={savingField === 'age'}
                >
                  <Ionicons name="checkmark" size={20} color={Colors.background} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setEditMode(null)}
                  disabled={savingField === 'age'}
                >
                  <Ionicons name="close" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.metricValue} onPress={handleEditAge} disabled={savingField !== null}>
                <Text style={styles.metricValueText}>{profile?.age || '—'} years</Text>
                <Ionicons name="create-outline" size={18} color={Colors.accent} />
              </TouchableOpacity>
            )}
          </View>

          {/* Weight */}
          <View style={styles.metricRow}>
            <View style={styles.metricLabel}>
              <Ionicons name="scale" size={20} color={Colors.textSecondary} />
              <Text style={styles.metricLabelText}>Weight</Text>
              {savingField === 'weight' && (
                <Text style={styles.savingText}>Saving...</Text>
              )}
              {savedField === 'weight' && (
                <View style={styles.savedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.savedText}>Saved</Text>
                </View>
              )}
            </View>
            {editMode === 'weight' ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.input}
                  value={tempWeight}
                  onChangeText={setTempWeight}
                  keyboardType="numeric"
                  placeholder="kg"
                  placeholderTextColor={Colors.textSecondary}
                  autoFocus
                  editable={savingField !== 'weight'}
                />
                <TouchableOpacity
                  style={[styles.saveButton, savingField === 'weight' && styles.buttonDisabled]}
                  onPress={handleSaveWeight}
                  disabled={savingField === 'weight'}
                >
                  <Ionicons name="checkmark" size={20} color={Colors.background} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setEditMode(null)}
                  disabled={savingField === 'weight'}
                >
                  <Ionicons name="close" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.metricValue} onPress={handleEditWeight} disabled={savingField !== null}>
                <Text style={styles.metricValueText}>{profile?.weight || '—'} kg</Text>
                <Ionicons name="create-outline" size={18} color={Colors.accent} />
              </TouchableOpacity>
            )}
          </View>

          {/* Height */}
          <View style={styles.metricRow}>
            <View style={styles.metricLabel}>
              <Ionicons name="resize" size={20} color={Colors.textSecondary} />
              <Text style={styles.metricLabelText}>Height</Text>
              {savingField === 'height' && (
                <Text style={styles.savingText}>Saving...</Text>
              )}
              {savedField === 'height' && (
                <View style={styles.savedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.savedText}>Saved</Text>
                </View>
              )}
            </View>
            {editMode === 'height' ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.input}
                  value={tempHeight}
                  onChangeText={setTempHeight}
                  keyboardType="numeric"
                  placeholder="cm"
                  placeholderTextColor={Colors.textSecondary}
                  autoFocus
                  editable={savingField !== 'height'}
                />
                <TouchableOpacity
                  style={[styles.saveButton, savingField === 'height' && styles.buttonDisabled]}
                  onPress={handleSaveHeight}
                  disabled={savingField === 'height'}
                >
                  <Ionicons name="checkmark" size={20} color={Colors.background} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setEditMode(null)}
                  disabled={savingField === 'height'}
                >
                  <Ionicons name="close" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.metricValue} onPress={handleEditHeight} disabled={savingField !== null}>
                <Text style={styles.metricValueText}>{profile?.height || '—'} cm</Text>
                <Ionicons name="create-outline" size={18} color={Colors.accent} />
              </TouchableOpacity>
            )}
          </View>

          {/* Activity Level */}
          <View style={styles.metricRow}>
            <View style={styles.metricLabel}>
              <Ionicons name="fitness" size={20} color={Colors.textSecondary} />
              <Text style={styles.metricLabelText}>Activity Level</Text>
              {savingField === 'activityLevel' && (
                <Text style={styles.savingText}>Saving...</Text>
              )}
              {savedField === 'activityLevel' && (
                <View style={styles.savedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.savedText}>Saved</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.metricValue}
              onPress={() =>
                setEditMode(editMode === 'activityLevel' ? null : 'activityLevel')
              }
              disabled={savingField !== null}
            >
              <Text style={styles.metricValueText}>
                {profile?.activityLevel ? ACTIVITY_LEVEL_LABELS[profile.activityLevel] : '—'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={Colors.accent} />
            </TouchableOpacity>
          </View>

          {/* Activity Level Picker */}
          {editMode === 'activityLevel' && (
            <View style={styles.pickerContainer}>
              {(['sedentary', 'lightly_active', 'very_active'] as ActivityLevel[]).map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.pickerOption,
                    profile?.activityLevel === level && styles.pickerOptionActive,
                  ]}
                  onPress={() => handleUpdateActivityLevel(level)}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      profile?.activityLevel === level && styles.pickerOptionTextActive,
                    ]}
                  >
                    {ACTIVITY_LEVEL_LABELS[level]}
                  </Text>
                  {profile?.activityLevel === level && (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Budget Management Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Ionicons name="wallet" size={24} color={Colors.accent} />
            </View>
            <Text style={styles.cardTitle}>BUDGET PREFERENCE</Text>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricLabel}>
              <Ionicons name="cash" size={20} color={Colors.textSecondary} />
              <Text style={styles.metricLabelText}>Financial Status</Text>
              {savingField === 'financialStatus' && (
                <Text style={styles.savingText}>Saving...</Text>
              )}
              {savedField === 'financialStatus' && (
                <View style={styles.savedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.savedText}>Saved</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.metricValue}
              onPress={() =>
                setEditMode(editMode === 'financialStatus' ? null : 'financialStatus')
              }
              disabled={savingField !== null}
            >
              <Text style={styles.metricValueText}>
                {getBudgetLabel(profile?.financialStatus)}
              </Text>
              <Ionicons name="chevron-down" size={18} color={Colors.accent} />
            </TouchableOpacity>
          </View>

          {/* Financial Status Picker */}
          {editMode === 'financialStatus' && (
            <View style={styles.pickerContainer}>
              {(['budget_conscious', 'balanced', 'premium_gourmet'] as FinancialStatus[]).map(
                (status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.pickerOption,
                      profile?.financialStatus === status && styles.pickerOptionActive,
                    ]}
                    onPress={() => handleUpdateFinancialStatus(status)}
                  >
                    <View style={styles.pickerOptionContent}>
                      <Text
                        style={[
                          styles.pickerOptionText,
                          profile?.financialStatus === status && styles.pickerOptionTextActive,
                        ]}
                      >
                        {FINANCIAL_STATUS_LABELS[status]}
                      </Text>
                      <Text
                        style={[
                          styles.pickerOptionSubtext,
                          profile?.financialStatus === status && styles.pickerOptionSubtextActive,
                        ]}
                      >
                        {getBudgetDescription(status)}
                      </Text>
                    </View>
                    {profile?.financialStatus === status && (
                      <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />
                    )}
                  </TouchableOpacity>
                )
              )}
            </View>
          )}
        </View>

        {/* Account Security Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Ionicons name="shield-checkmark" size={24} color={Colors.accent} />
            </View>
            <Text style={styles.cardTitle}>ACCOUNT & SECURITY</Text>
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowPasswordModal(true)}
          >
            <View style={styles.actionButtonContent}>
              <Ionicons name="key" size={20} color={Colors.textPrimary} />
              <Text style={styles.actionButtonText}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
            <View style={styles.actionButtonContent}>
              <Ionicons name="log-out" size={20} color={Colors.error} />
              <Text style={[styles.actionButtonText, styles.logoutText]}>Sign Out</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.error} />
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <Text style={styles.versionText}>Fitguide v1.0.0</Text>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtext}>
              For security, you may need to sign in again after changing your password.
            </Text>

            <View style={styles.modalInputContainer}>
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.modalInput}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="Enter new password"
                placeholderTextColor={Colors.textSecondary}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.modalInputContainer}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <TextInput
                style={styles.modalInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="Confirm new password"
                placeholderTextColor={Colors.textSecondary}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity style={styles.modalButton} onPress={handleChangePassword}>
              <Text style={styles.modalButtonText}>Update Password</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowPasswordModal(false)}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    ...Fonts.body,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    color: Colors.accent,
    ...Fonts.heading,
    letterSpacing: 2,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  userName: {
    fontSize: 24,
    color: Colors.textPrimary,
    ...Fonts.heading,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    ...Fonts.body,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
    alignSelf: 'center',
  },
  goalBadgeText: {
    fontSize: 12,
    color: Colors.background,
    ...Fonts.heading,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: `${Colors.accent}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    ...Fonts.data,
    letterSpacing: 1.5,
  },
  coachText: {
    fontSize: 14,
    color: Colors.textPrimary,
    ...Fonts.body,
    lineHeight: 22,
  },
  coachHighlight: {
    color: Colors.accent,
    ...Fonts.heading,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  metricLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  metricLabelText: {
    fontSize: 14,
    color: Colors.textPrimary,
    ...Fonts.body,
  },
  metricValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  metricValueText: {
    fontSize: 14,
    color: Colors.accent,
    ...Fonts.heading,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.background,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.accent,
    width: 80,
    fontSize: 14,
    ...Fonts.body,
  },
  saveButton: {
    backgroundColor: Colors.accent,
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerContainer: {
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickerOptionActive: {
    borderColor: Colors.accent,
    backgroundColor: `${Colors.accent}15`,
  },
  pickerOptionContent: {
    flex: 1,
  },
  pickerOptionText: {
    fontSize: 14,
    color: Colors.textPrimary,
    ...Fonts.body,
  },
  pickerOptionTextActive: {
    color: Colors.accent,
    ...Fonts.heading,
  },
  pickerOptionSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    ...Fonts.body,
    marginTop: Spacing.xs,
  },
  pickerOptionSubtextActive: {
    color: Colors.textSecondary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionButtonText: {
    fontSize: 14,
    color: Colors.textPrimary,
    ...Fonts.body,
  },
  logoutText: {
    color: Colors.error,
  },
  versionText: {
    fontSize: 12,
    color: Colors.textSecondary,
    ...Fonts.body,
    textAlign: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContainer: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    color: Colors.textPrimary,
    ...Fonts.heading,
  },
  modalSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    ...Fonts.body,
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  modalInputContainer: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    ...Fonts.data,
    marginBottom: Spacing.xs,
    letterSpacing: 0.5,
  },
  modalInput: {
    backgroundColor: Colors.background,
    color: Colors.textPrimary,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 14,
    ...Fonts.body,
  },
  modalButton: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  modalButtonText: {
    fontSize: 14,
    color: Colors.background,
    ...Fonts.heading,
  },
  modalCancelButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  modalCancelButtonText: {
    fontSize: 14,
    color: Colors.textSecondary,
    ...Fonts.body,
  },
  savingText: {
    fontSize: 11,
    color: Colors.textSecondary,
    ...Fonts.body,
    marginLeft: Spacing.xs,
    fontStyle: 'italic',
  },
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: Spacing.xs,
    backgroundColor: `${Colors.success}20`,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  savedText: {
    fontSize: 11,
    color: Colors.success,
    ...Fonts.heading,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
