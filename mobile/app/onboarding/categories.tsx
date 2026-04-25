/**
 * Onboarding Step 3 — Category Selection
 * Mascot suggests habit areas. User selects multiple chips.
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
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

interface Category {
  id: string;
  label: string;
  emoji: string;
  description: string;
}

const CATEGORIES: Category[] = [
  { id: 'health', label: 'Health', emoji: '💪', description: 'Exercise & nutrition' },
  { id: 'productivity', label: 'Productivity', emoji: '⚡', description: 'Get things done' },
  { id: 'mindfulness', label: 'Mindfulness', emoji: '🧘', description: 'Peace & calm' },
  { id: 'learning', label: 'Learning', emoji: '📚', description: 'Grow your mind' },
  { id: 'social', label: 'Social', emoji: '🤝', description: 'Connect with others' },
  { id: 'sport', label: 'Sport', emoji: '🏃', description: 'Stay active' },
];

export default function CategoriesScreen() {
  const [selected, setSelected] = useState<string[]>([]);

  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(30);
  const chipsOpacity = useSharedValue(0);

  useEffect(() => {
    contentOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));
    contentTranslateY.value = withDelay(200, withSpring(0, { damping: 15 }));
    chipsOpacity.value = withDelay(500, withTiming(1, { duration: 600 }));
  }, []);

  const contentAnim = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const chipsAnim = useAnimatedStyle(() => ({
    opacity: chipsOpacity.value,
  }));

  const toggleCategory = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleNext = async () => {
    if (selected.length > 0) {
      await AsyncStorage.setItem('@habitflow_categories', JSON.stringify(selected));
      router.push('/onboarding/motivation');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Progress */}
        <OnboardingProgress currentStep={2} totalSteps={5} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Mascot section */}
          <Animated.View style={[styles.topSection, contentAnim]}>
            <Mascot mood="excited" size="md" />
            <View style={styles.speechBubble}>
              <Typography variant="h3" color={Colors.white} align="center">
                What areas interest you? 🌟
              </Typography>
              <Typography variant="bodySmall" color={Colors.white} align="center" style={{ opacity: 0.85, marginTop: 4 }}>
                Pick as many as you like!
              </Typography>
              <View style={styles.speechTail} />
            </View>
          </Animated.View>

          {/* Category chips */}
          <Animated.View style={[styles.chipGrid, chipsAnim]}>
            {CATEGORIES.map((cat, index) => (
              <CategoryChip
                key={cat.id}
                category={cat}
                isSelected={selected.includes(cat.id)}
                onPress={() => toggleCategory(cat.id)}
                index={index}
              />
            ))}
          </Animated.View>

          {/* Selection count */}
          {selected.length > 0 && (
            <Typography
              variant="bodySmall"
              color={Colors.accent}
              align="center"
              style={styles.selectionCount}
            >
              {selected.length} area{selected.length !== 1 ? 's' : ''} selected ✓
            </Typography>
          )}
        </ScrollView>

        {/* Button */}
        <View style={styles.buttonSection}>
          <Button
            title="Continue"
            onPress={handleNext}
            variant="primary"
            size="lg"
            fullWidth
            disabled={selected.length === 0}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function CategoryChip({
  category,
  isSelected,
  onPress,
  index,
}: {
  category: Category;
  isSelected: boolean;
  onPress: () => void;
  index: number;
}) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(index * 80, withSpring(1, { damping: 14, stiffness: 150 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        style={[
          styles.chip,
          isSelected && styles.chipSelected,
        ]}
      >
        <View style={styles.chipEmoji}>
          <Typography variant="h2" align="center">
            {category.emoji}
          </Typography>
        </View>
        <Typography
          variant="label"
          color={isSelected ? Colors.text : Colors.text}
          style={styles.chipLabel}
        >
          {category.label}
        </Typography>
        <Typography
          variant="caption"
          color={Colors.textMuted}
        >
          {category.description}
        </Typography>
        {isSelected && (
          <View style={styles.checkBadge}>
            <Typography variant="caption" color={Colors.white}>
              ✓
            </Typography>
          </View>
        )}
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.lg,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  speechBubble: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginTop: Spacing.lg,
    maxWidth: 280,
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
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  chip: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: 'transparent',
    position: 'relative',
    ...Shadows.sm,
  },
  chipSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentLight + '30',
  },
  chipEmoji: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.overlayLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  chipLabel: {
    marginBottom: 2,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionCount: {
    marginTop: Spacing.md,
    fontFamily: FontFamily.semiBold,
  },
  buttonSection: {
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
});
