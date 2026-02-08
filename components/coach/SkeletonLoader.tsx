import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export default function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius = BorderRadius.sm,
  style,
}: SkeletonLoaderProps) {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Electric Lime pulse effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
}

export function MessageSkeletonLoader() {
  return (
    <View style={styles.messageSkeletonContainer}>
      <View style={styles.coachAvatarSkeleton}>
        <SkeletonLoader width={32} height={32} borderRadius={16} />
      </View>
      <View style={styles.messageBubbleSkeleton}>
        <SkeletonLoader height={16} style={{ marginBottom: Spacing.xs }} />
        <SkeletonLoader height={16} width="80%" style={{ marginBottom: Spacing.xs }} />
        <SkeletonLoader height={12} width="40%" />
      </View>
    </View>
  );
}

export function ChatHistorySkeletonLoader() {
  return (
    <View style={styles.chatHistoryContainer}>
      <MessageSkeletonLoader />
      <MessageSkeletonLoader />
      <MessageSkeletonLoader />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.accent,
  },
  messageSkeletonContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  coachAvatarSkeleton: {
    marginBottom: 4,
  },
  messageBubbleSkeleton: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    maxWidth: '75%',
  },
  chatHistoryContainer: {
    padding: Spacing.lg,
  },
});
