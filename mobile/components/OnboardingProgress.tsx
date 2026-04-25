/**
 * OnboardingProgress — Animated dot progress indicator for onboarding flow.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors, Spacing } from '@/constants/theme';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export default function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <Dot key={i} active={i <= currentStep} isCurrent={i === currentStep} />
      ))}
    </View>
  );
}

function Dot({ active, isCurrent }: { active: boolean; isCurrent: boolean }) {
  const width = useSharedValue(8);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    width.value = withSpring(isCurrent ? 28 : 8, { damping: 15, stiffness: 200 });
    opacity.value = withSpring(active ? 1 : 0.3, { damping: 15, stiffness: 200 });
  }, [active, isCurrent]);

  const animStyle = useAnimatedStyle(() => ({
    width: width.value,
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.dot,
        active && styles.dotActive,
        animStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.cardDark,
  },
  dotActive: {
    backgroundColor: Colors.accent,
  },
});
