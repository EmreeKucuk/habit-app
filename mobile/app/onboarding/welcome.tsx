/**
 * Onboarding Step 1 — Welcome Screen
 * The mascot greets the user and introduces HabitFlow.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import Mascot from '@/components/Mascot';
import OnboardingProgress from '@/components/OnboardingProgress';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import { Colors, Spacing } from '@/constants/theme';

export default function WelcomeScreen() {
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(20);
  const bubbleOpacity = useSharedValue(0);
  const bubbleScale = useSharedValue(0.8);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(20);

  useEffect(() => {
    // Staggered entrance animations
    titleOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    titleTranslateY.value = withDelay(400, withSpring(0, { damping: 15 }));

    bubbleOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));
    bubbleScale.value = withDelay(700, withSpring(1, { damping: 12 }));

    subtitleOpacity.value = withDelay(1000, withTiming(1, { duration: 600 }));
    subtitleTranslateY.value = withDelay(1000, withSpring(0, { damping: 15 }));

    buttonOpacity.value = withDelay(1300, withTiming(1, { duration: 500 }));
    buttonTranslateY.value = withDelay(1300, withSpring(0, { damping: 15 }));
  }, []);

  const titleAnim = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const bubbleAnim = useAnimatedStyle(() => ({
    opacity: bubbleOpacity.value,
    transform: [{ scale: bubbleScale.value }],
  }));

  const subtitleAnim = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));

  const buttonAnim = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Progress */}
        <OnboardingProgress currentStep={0} totalSteps={5} />

        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          <Animated.View style={titleAnim}>
            <Typography variant="h1" align="center">
              HabitFlow
            </Typography>
          </Animated.View>

          {/* Mascot */}
          <View style={styles.mascotArea}>
            <Mascot mood="waving" size="lg" />

            {/* Speech bubble */}
            <Animated.View style={[styles.speechBubble, bubbleAnim]}>
              <Typography variant="body" color={Colors.white} align="center">
                Hi there! I'm Sprout 🌱{'\n'}Your habit companion!
              </Typography>
              <View style={styles.speechTail} />
            </Animated.View>
          </View>

          {/* Subtitle */}
          <Animated.View style={subtitleAnim}>
            <Typography variant="body" align="center" color={Colors.textLight}>
              I'll help you build healthy habits,{'\n'}track your progress, and stay motivated.
            </Typography>
          </Animated.View>
        </View>

        {/* Button */}
        <Animated.View style={[styles.buttonSection, buttonAnim]}>
          <Button
            title="Let's Go! 🚀"
            onPress={() => router.push('/onboarding/name')}
            variant="primary"
            size="lg"
            fullWidth
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  mascotArea: {
    alignItems: 'center',
    position: 'relative',
    marginVertical: Spacing.lg,
  },
  speechBubble: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginTop: Spacing.lg,
    maxWidth: 260,
    position: 'relative',
  },
  speechTail: {
    position: 'absolute',
    top: -8,
    alignSelf: 'center',
    left: '45%',
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: Colors.card,
  },
  buttonSection: {
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
});
