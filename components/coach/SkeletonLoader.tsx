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
  const pulseAnim = useRef(new Animated.Value(0.2)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Electric Lime pulse effect - more premium timing
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.2,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Shimmer effect for premium feel
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, [pulseAnim, shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  return (
    <View
      style={[
        styles.skeletonContainer,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.skeleton,
          {
            opacity: pulseAnim,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
}

export function MessageSkeletonLoader({ delay = 0 }: { delay?: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, fadeAnim]);

  return (
    <Animated.View style={[styles.messageSkeletonContainer, { opacity: fadeAnim }]}>
      <View style={styles.coachAvatarSkeleton}>
        <SkeletonLoader width={32} height={32} borderRadius={16} />
      </View>
      <View style={styles.messageBubbleSkeleton}>
        <SkeletonLoader height={16} style={{ marginBottom: Spacing.xs }} />
        <SkeletonLoader height={16} width="85%" style={{ marginBottom: Spacing.xs }} />
        <SkeletonLoader height={14} width="60%" style={{ marginBottom: Spacing.sm }} />
        <SkeletonLoader height={12} width="30%" />
      </View>
    </Animated.View>
  );
}

export function ChatHistorySkeletonLoader() {
  return (
    <View style={styles.chatHistoryContainer}>
      {/* Date separator skeleton */}
      <View style={styles.dateSeparatorSkeleton}>
        <SkeletonLoader width={100} height={12} />
      </View>

      {/* Multiple message skeletons with staggered animation */}
      <MessageSkeletonLoader delay={0} />
      <MessageSkeletonLoader delay={150} />
      <MessageSkeletonLoader delay={300} />
      <MessageSkeletonLoader delay={450} />
      <MessageSkeletonLoader delay={600} />

      {/* Another date separator */}
      <View style={styles.dateSeparatorSkeleton}>
        <SkeletonLoader width={80} height={12} />
      </View>

      <MessageSkeletonLoader delay={750} />
      <MessageSkeletonLoader delay={900} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonContainer: {
    overflow: 'hidden',
    backgroundColor: Colors.cardBg,
  },
  skeleton: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.accent,
    position: 'absolute',
  },
  shimmer: {
    width: 100,
    height: '100%',
    backgroundColor: 'rgba(204, 255, 0, 0.3)',
    position: 'absolute',
  },
  messageSkeletonContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  coachAvatarSkeleton: {
    marginBottom: 4,
  },
  messageBubbleSkeleton: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    borderBottomLeftRadius: 4,
    padding: Spacing.md,
    maxWidth: '75%',
    borderWidth: 1,
    borderColor: `${Colors.accent}30`,
  },
  chatHistoryContainer: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  dateSeparatorSkeleton: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
});
