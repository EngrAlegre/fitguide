import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
}

export default function ProgressBar({ progress, height = 4 }: ProgressBarProps) {
  return (
    <View style={[styles.container, { height }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${Math.min(Math.max(progress, 0), 1) * 100}%`,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: Colors.border,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 9999,
  },
});
