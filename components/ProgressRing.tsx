import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Fonts } from '../constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  current: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
}

export default function ProgressRing({
  current,
  goal,
  size = 240,
  strokeWidth = 20,
}: ProgressRingProps) {
  const progress = useSharedValue(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    const targetProgress = Math.min(current / goal, 1);
    progress.value = withTiming(targetProgress, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [current, goal, progress]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - progress.value);
    return {
      strokeDashoffset,
    };
  });

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.cardBg}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.accent}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeLinecap="round"
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.textContainer}>
        <Text style={styles.currentValue}>{current.toLocaleString()}</Text>
        <Text style={styles.goalValue}>/ {goal.toLocaleString()} CALS</Text>
        <Text style={styles.label}>DAILY GOAL</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  currentValue: {
    fontSize: 56,
    color: Colors.textPrimary,
    ...Fonts.heading,
    lineHeight: 60,
  },
  goalValue: {
    fontSize: 16,
    color: Colors.textSecondary,
    ...Fonts.data,
    marginTop: 4,
  },
  label: {
    fontSize: 12,
    color: Colors.textSecondary,
    ...Fonts.data,
    marginTop: 8,
    letterSpacing: 1,
  },
});
