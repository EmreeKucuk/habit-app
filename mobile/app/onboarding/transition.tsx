/**
 * Onboarding Step 5 — Transition Screen
 * Mascot says "Let's save your progress!" and leads to the Auth screen.
 * Shows a summary of choices with a confetti-style animation.
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import Mascot from '@/components/Mascot';
import OnboardingProgress from '@/components/OnboardingProgress';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import { Colors, Spacing, Radius, Shadows, FontFamily } from '@/constants/theme';

const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  health: { label: 'Health', emoji: '💪' },
  productivity: { label: 'Productivity', emoji: '⚡' },
  mindfulness: { label: 'Mindfulness', emoji: '🧘' },
  learning: { label: 'Learning', emoji: '📚' },
  social: { label: 'Social', emoji: '🤝' },
  sport: { label: 'Sport', emoji: '🏃' },
};

const MOTIVATION_LABELS: Record<string, { label: string; emoji: string }> = {
  high: { label: 'High', emoji: '🔥' },
  medium: { label: 'Medium', emoji: '✨' },
  low: { label: 'Low', emoji: '🌱' },
};

export default function TransitionScreen() {
  const [userName, setUserName] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [motivation, setMotivation] = useState('');

  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(30);
  const summaryOpacity = useSharedValue(0);
  const summaryTranslateY = useSharedValue(20);
  const buttonOpacity = useSharedValue(0);
  const sparkle1 = useSharedValue(0);
  const sparkle2 = useSharedValue(0);
  const sparkle3 = useSharedValue(0);

  useEffect(() => {
    loadOnboardingData();

    contentOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));
    contentTranslateY.value = withDelay(200, withSpring(0, { damping: 15 }));
    summaryOpacity.value = withDelay(700, withTiming(1, { duration: 600 }));
    summaryTranslateY.value = withDelay(700, withSpring(0, { damping: 15 }));
    buttonOpacity.value = withDelay(1200, withTiming(1, { duration: 500 }));

    // Sparkle animations
    sparkle1.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 600, easing: Easing.in(Easing.ease) }),
        ),
        -1,
      ),
    );
    sparkle2.value = withDelay(
      800,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 700, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 700, easing: Easing.in(Easing.ease) }),
        ),
        -1,
      ),
    );
    sparkle3.value = withDelay(
      1100,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 500, easing: Easing.in(Easing.ease) }),
        ),
        -1,
      ),
    );
  }, []);

  const loadOnboardingData = async () => {
    const [name, cats, motiv] = await Promise.all([
      AsyncStorage.getItem('@habitflow_user_name'),
      AsyncStorage.getItem('@habitflow_categories'),
      AsyncStorage.getItem('@habitflow_motivation'),
    ]);
    setUserName(name || 'Friend');
    setCategories(cats ? JSON.parse(cats) : []);
    setMotivation(motiv || 'medium');
  };

  const contentAnim = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const summaryAnim = useAnimatedStyle(() => ({
    opacity: summaryOpacity.value,
    transform: [{ translateY: summaryTranslateY.value }],
  }));

  const buttonAnim = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  const sparkleAnim1 = useAnimatedStyle(() => ({
    opacity: sparkle1.value,
    transform: [{ scale: sparkle1.value }],
  }));
  const sparkleAnim2 = useAnimatedStyle(() => ({
    opacity: sparkle2.value,
    transform: [{ scale: sparkle2.value }],
  }));
  const sparkleAnim3 = useAnimatedStyle(() => ({
    opacity: sparkle3.value,
    transform: [{ scale: sparkle3.value }],
  }));

  const handleContinue = async () => {
    await AsyncStorage.setItem('@habitflow_onboarding_complete', 'true');
    router.replace('/auth/login');
  };

  const motivData = MOTIVATION_LABELS[motivation] || MOTIVATION_LABELS.medium;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Progress */}
        <OnboardingProgress currentStep={4} totalSteps={5} />

        {/* Content */}
        <View style={styles.content}>
          {/* Sparkles */}
          <Animated.View style={[styles.sparkle, { top: '8%', left: '15%' }, sparkleAnim1]}>
            <Typography variant="h2">✨</Typography>
          </Animated.View>
          <Animated.View style={[styles.sparkle, { top: '12%', right: '10%' }, sparkleAnim2]}>
            <Typography variant="h3">🌟</Typography>
          </Animated.View>
          <Animated.View style={[styles.sparkle, { top: '5%', right: '30%' }, sparkleAnim3]}>
            <Typography variant="h3">⭐</Typography>
          </Animated.View>

          {/* Mascot */}
          <Animated.View style={[styles.topSection, contentAnim]}>
            <Mascot mood="excited" size="lg" />
            <View style={styles.speechBubble}>
              <Typography variant="h3" color={Colors.white} align="center">
                Awesome, {userName}! 🎉{'\n'}Let's save your progress!
              </Typography>
              <View style={styles.speechTail} />
            </View>
          </Animated.View>

          {/* Summary card */}
          <Animated.View style={[styles.summaryCard, summaryAnim]}>
            <Typography variant="label" color={Colors.textMuted} style={styles.summaryTitle}>
              YOUR PROFILE
            </Typography>

            {/* Name */}
            <View style={styles.summaryRow}>
              <Typography variant="bodySmall" color={Colors.textMuted}>Name</Typography>
              <Typography variant="body" color={Colors.text}>{userName}</Typography>
            </View>

            {/* Categories */}
            <View style={styles.summaryRow}>
              <Typography variant="bodySmall" color={Colors.textMuted}>Interests</Typography>
              <View style={styles.chipRow}>
                {categories.map((catId) => {
                  const cat = CATEGORY_LABELS[catId];
                  return cat ? (
                    <View key={catId} style={styles.miniChip}>
                      <Typography variant="caption" color={Colors.text}>
                        {cat.emoji} {cat.label}
                      </Typography>
                    </View>
                  ) : null;
                })}
              </View>
            </View>

            {/* Motivation */}
            <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
              <Typography variant="bodySmall" color={Colors.textMuted}>Motivation</Typography>
              <View style={styles.motivBadge}>
                <Typography variant="body" color={Colors.text}>
                  {motivData.emoji} {motivData.label}
                </Typography>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Button */}
        <Animated.View style={[styles.buttonSection, buttonAnim]}>
          <Button
            title="Create Account 🚀"
            onPress={handleContinue}
            variant="primary"
            size="lg"
            fullWidth
          />
          <Typography
            variant="caption"
            color={Colors.textMuted}
            align="center"
            style={styles.disclaimer}
          >
            Sign up to save your preferences and start tracking
          </Typography>
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
    gap: Spacing.lg,
    position: 'relative',
  },
  sparkle: {
    position: 'absolute',
    zIndex: 10,
  },
  topSection: {
    alignItems: 'center',
  },
  speechBubble: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginTop: Spacing.lg,
    maxWidth: 300,
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
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  summaryTitle: {
    letterSpacing: 1,
    marginBottom: Spacing.md,
    fontFamily: FontFamily.semiBold,
  },
  summaryRow: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.overlayLight,
    gap: Spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  miniChip: {
    backgroundColor: Colors.overlayLight,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
  },
  motivBadge: {
    marginTop: Spacing.xs,
  },
  buttonSection: {
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  disclaimer: {
    marginTop: Spacing.md,
  },
});
