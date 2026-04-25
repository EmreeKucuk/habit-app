/**
 * CircularProgress — Animated circular progress indicator.
 * Pure React Native implementation using rotating half-circles (no SVG dependency).
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import Typography from '@/components/ui/Typography';
import { Colors, FontFamily } from '@/constants/theme';

interface CircularProgressProps {
  completed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
}

export default function CircularProgress({
  completed,
  total,
  size = 160,
  strokeWidth = 14,
  color = Colors.accent,
  bgColor = Colors.overlayLight,
}: CircularProgressProps) {
  const progress = useSharedValue(0);
  const percentage = total > 0 ? Math.min(completed / total, 1) : 0;

  useEffect(() => {
    progress.value = withTiming(percentage, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
  }, [completed, total]);

  const halfSize = size / 2;
  const innerSize = size - strokeWidth * 2;

  // Right half rotation (0% to 50%)
  const rightHalfStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      progress.value,
      [0, 0.5, 1],
      [0, 180, 180],
    );
    return {
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  // Left half rotation (50% to 100%)
  const leftHalfStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      progress.value,
      [0, 0.5, 1],
      [0, 0, 180],
    );
    return {
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background circle */}
      <View
        style={[
          styles.bgCircle,
          {
            width: size,
            height: size,
            borderRadius: halfSize,
            borderWidth: strokeWidth,
            borderColor: bgColor,
          },
        ]}
      />

      {/* Right half (0-50%) */}
      <View
        style={[
          styles.halfContainer,
          {
            width: halfSize,
            height: size,
            left: halfSize,
            overflow: 'hidden',
          },
        ]}
      >
        <Animated.View
          style={[
            styles.halfCircle,
            {
              width: size,
              height: size,
              borderRadius: halfSize,
              borderWidth: strokeWidth,
              borderColor: color,
              left: -halfSize,
            },
            rightHalfStyle,
          ]}
        />
      </View>

      {/* Left half (50-100%) */}
      <View
        style={[
          styles.halfContainer,
          {
            width: halfSize,
            height: size,
            left: 0,
            overflow: 'hidden',
          },
        ]}
      >
        <Animated.View
          style={[
            styles.halfCircle,
            {
              width: size,
              height: size,
              borderRadius: halfSize,
              borderWidth: strokeWidth,
              borderColor: color,
              left: 0,
            },
            leftHalfStyle,
          ]}
        />
      </View>

      {/* Inner white circle (creates the ring effect) */}
      <View
        style={[
          styles.innerCircle,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
          },
        ]}
      />

      {/* Center text */}
      <View style={styles.center}>
        <Typography
          variant="h1"
          align="center"
          color={Colors.text}
          style={styles.ratio}
        >
          {completed}/{total}
        </Typography>
        <Typography
          variant="caption"
          align="center"
          color={Colors.textMuted}
        >
          completed
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bgCircle: {
    position: 'absolute',
  },
  halfContainer: {
    position: 'absolute',
    top: 0,
  },
  halfCircle: {
    position: 'absolute',
    top: 0,
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
    transformOrigin: 'center center',
  },
  innerCircle: {
    position: 'absolute',
    backgroundColor: Colors.white,
  },
  center: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratio: {
    fontFamily: FontFamily.extraBold,
  },
});
