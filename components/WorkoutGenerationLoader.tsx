import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';

const WorkoutColors = {
  electricBlue: '#00D4FF',
  deepCharcoal: '#1A1A1A',
  neonLime: Colors.accent,
  darkBg: '#0F0F0F',
};

const loadingMessages = [
  'Analyzing your fitness profile...',
  'Consulting AI fitness trainer...',
  'Crafting perfect exercises...',
  'Optimizing workout intensity...',
  'Finalizing your custom plan...',
];

export default function WorkoutGenerationLoader() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [rotateAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Rotate animation
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );
    rotateAnimation.start();

    // Scale pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    // Cycle through messages
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2500);

    return () => {
      clearInterval(messageInterval);
      rotateAnimation.stop();
      pulseAnimation.stop();
    };
  }, [scaleAnim, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={[WorkoutColors.deepCharcoal, WorkoutColors.darkBg]} style={styles.gradient}>
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: scaleAnim }, { rotate: spin }],
            },
          ]}
        >
          <Ionicons name="flash" size={64} color={WorkoutColors.electricBlue} />
        </Animated.View>

        <Text style={styles.title}>GENERATING WORKOUT</Text>

        <View style={styles.messageContainer}>
          <Text style={styles.message}>{loadingMessages[messageIndex]}</Text>
        </View>

        <View style={styles.dotsContainer}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  opacity: scaleAnim.interpolate({
                    inputRange: [1, 1.1],
                    outputRange: [0.3, 1],
                  }),
                },
              ]}
            />
          ))}
        </View>

        <Text style={styles.subtitle}>This will only take a moment...</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.full,
    backgroundColor: `${WorkoutColors.electricBlue}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 28,
    color: WorkoutColors.electricBlue,
    ...Fonts.heading,
    letterSpacing: 3,
    marginBottom: Spacing.lg,
  },
  messageContainer: {
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  message: {
    fontSize: 16,
    color: Colors.textPrimary,
    ...Fonts.body,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: WorkoutColors.neonLime,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    ...Fonts.body,
  },
});
