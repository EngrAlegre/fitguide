import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';

const WorkoutColors = {
  electricBlue: '#00D4FF',
  neonLime: Colors.accent,
  darkBg: '#0F0F0F',
};

interface RestTimerProps {
  duration: number; // in seconds
  onComplete: () => void;
  onSkip: () => void;
}

export default function RestTimer({ duration, onComplete, onSkip }: RestTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration);

  useEffect(() => {
    if (timeRemaining <= 0) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, onComplete]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const percentage = ((duration - timeRemaining) / duration) * 100;

  const handleSkip = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onSkip();
  };

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.overlay}>
        <LinearGradient
          colors={[WorkoutColors.darkBg, WorkoutColors.electricBlue + '40']}
          style={styles.container}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="timer" size={64} color={WorkoutColors.electricBlue} />
          </View>

          <Text style={styles.title}>REST TIME</Text>

          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${percentage}%` }]} />
            </View>
          </View>

          <Text style={styles.subtitle}>Take a breather, you&apos;re crushing it!</Text>

          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Ionicons name="play-skip-forward" size={20} color={WorkoutColors.darkBg} />
            <Text style={styles.skipButtonText}>SKIP REST</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
    backgroundColor: `${WorkoutColors.electricBlue}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 20,
    color: Colors.textPrimary,
    ...Fonts.heading,
    letterSpacing: 2,
    marginBottom: Spacing.md,
  },
  timerContainer: {
    marginBottom: Spacing.lg,
  },
  timerText: {
    fontSize: 64,
    color: WorkoutColors.electricBlue,
    ...Fonts.heading,
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: WorkoutColors.electricBlue,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    ...Fonts.body,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: WorkoutColors.electricBlue,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  skipButtonText: {
    fontSize: 16,
    color: WorkoutColors.darkBg,
    ...Fonts.heading,
    letterSpacing: 1,
  },
});
