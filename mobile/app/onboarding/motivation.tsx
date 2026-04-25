/**
 * Onboarding Step 4 — Motivation Assessment
 * Ask the user about their initial motivation level: High, Medium, Low.
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import Mascot from '@/components/Mascot';
import OnboardingProgress from '@/components/OnboardingProgress';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import { Colors, Spacing, Radius, Shadows, FontFamily } from '@/constants/theme';

interface MotivationOption {
  level: string;
  emoji: string;
  title: string;
  description: string;
  mascotReply: string;
}

const OPTIONS: MotivationOption[] = [
  {
    level: 'high',
    emoji: '🔥',
    title: 'High',
    description: "I'm pumped! Ready to crush it",
    mascotReply: "Let's goooo! 🚀",
  },
  {
    level: 'medium',
    emoji: '✨',
    title: 'Medium',
    description: "I'm motivated but taking it steady",
    mascotReply: 'Steady wins the race! 🏆',
  },
  {
    level: 'low',
    emoji: '🌱',
    title: 'Low',
    description: "I'm just getting started, be gentle",
    mascotReply: "No worries! We'll go at your pace 💚",
  },
];

export default function MotivationScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const [mascotResponse, setMascotResponse] = useState<string | null>(null);

  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(30);
  const cardsOpacity = useSharedValue(0);

  useEffect(() => {
    contentOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));
    contentTranslateY.value = withDelay(200, withSpring(0, { damping: 15 }));
    cardsOpacity.value = withDelay(500, withTiming(1, { duration: 600 }));
  }, []);

  const contentAnim = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const cardsAnim = useAnimatedStyle(() => ({
    opacity: cardsOpacity.value,
  }));

  const handleSelect = (option: MotivationOption) => {
    setSelected(option.level);
    setMascotResponse(option.mascotReply);
  };

  const handleNext = async () => {
    if (selected) {
      await AsyncStorage.setItem('@habitflow_motivation', selected);
      router.push('/onboarding/transition');
    }
  };

  const mascotMood = selected === 'high' ? 'excited' : selected === 'low' ? 'happy' : 'thinking';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Progress */}
        <OnboardingProgress currentStep={3} totalSteps={5} />

        {/* Content */}
        <View style={styles.content}>
          {/* Mascot */}
          <Animated.View style={[styles.topSection, contentAnim]}>
            <Mascot mood={mascotMood} size="md" />
            <View style={styles.speechBubble}>
              <Typography variant="h3" color={Colors.white} align="center">
                {mascotResponse || 'How motivated are you right now?'}
              </Typography>
              <View style={styles.speechTail} />
            </View>
          </Animated.View>

          {/* Motivation options */}
          <Animated.View style={[styles.optionsContainer, cardsAnim]}>
            {OPTIONS.map((option, index) => (
              <MotivationCard
                key={option.level}
                option={option}
                isSelected={selected === option.level}
                onPress={() => handleSelect(option)}
                index={index}
              />
            ))}
          </Animated.View>
        </View>

        {/* Button */}
        <View style={styles.buttonSection}>
          <Button
            title="Continue"
            onPress={handleNext}
            variant="primary"
            size="lg"
            fullWidth
            disabled={!selected}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function MotivationCard({
  option,
  isSelected,
  onPress,
  index,
}: {
  option: MotivationOption;
  isSelected: boolean;
  onPress: () => void;
  index: number;
}) {
  const scale = useSharedValue(0);
  const selectScale = useSharedValue(1);

  useEffect(() => {
    scale.value = withDelay(index * 120, withSpring(1, { damping: 14, stiffness: 150 }));
  }, []);

  useEffect(() => {
    if (isSelected) {
      selectScale.value = withSpring(1.02, { damping: 10, stiffness: 200 });
    } else {
      selectScale.value = withSpring(1, { damping: 10 });
    }
  }, [isSelected]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * selectScale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        style={[
          styles.card,
          isSelected && styles.cardSelected,
        ]}
      >
        <View style={styles.cardLeft}>
          <View style={[styles.emojiCircle, isSelected && styles.emojiCircleSelected]}>
            <Typography variant="h2">{option.emoji}</Typography>
          </View>
        </View>
        <View style={styles.cardRight}>
          <Typography
            variant="h3"
            color={Colors.text}
          >
            {option.title}
          </Typography>
          <Typography
            variant="bodySmall"
            color={Colors.textMuted}
          >
            {option.description}
          </Typography>
        </View>
        {isSelected && (
          <View style={styles.radioSelected}>
            <View style={styles.radioInner} />
          </View>
        )}
        {!isSelected && <View style={styles.radio} />}
      </Pressable>
    </Animated.View>
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
    gap: Spacing.xl,
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
  optionsContainer: {
    gap: Spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 2.5,
    borderColor: 'transparent',
    ...Shadows.sm,
  },
  cardSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentLight + '25',
  },
  cardLeft: {
    marginRight: Spacing.md,
  },
  emojiCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.overlayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiCircleSelected: {
    backgroundColor: Colors.accentLight + '50',
  },
  cardRight: {
    flex: 1,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    marginLeft: Spacing.sm,
  },
  radioSelected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.accent,
    marginLeft: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.accent,
  },
  buttonSection: {
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
});
