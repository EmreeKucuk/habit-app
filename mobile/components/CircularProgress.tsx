/**
 * CircularProgress — Animated circular progress indicator.
 * Uses react-native-svg for accurate arc rendering.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Typography from '@/components/ui/Typography';
import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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
  color,
  bgColor,
}: CircularProgressProps) {
  const { Colors } = useTheme();
  const resolvedColor = color || Colors.accent;
  const resolvedBgColor = bgColor || Colors.overlayLight;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = total > 0 ? Math.min(completed / total, 1) : 0;

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(percentage, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
  }, [completed, total]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={resolvedBgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={resolvedColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>

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
  center: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratio: {
    fontFamily: FontFamily.extraBold,
  },
});
