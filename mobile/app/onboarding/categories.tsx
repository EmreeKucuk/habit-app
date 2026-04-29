/**
 * Onboarding Step 3 — Smart Templates
 * Mascot suggests predefined habit templates. User selects multiple chips.
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Dimensions } from 'react-native';
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
import { Spacing, Radius, Shadows, FontFamily } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

export interface Template {
  id: string;
  name: string;
  category: string;
  icon: string;
  color: string;
  description: string;
  frequency: string;
  target: number;
  unit: string;
}

const TEMPLATES: Template[] = [
  { id: 'workout', name: 'Workout', category: 'sport', icon: '💪', color: '#EF4444', description: '3 times a week', frequency: 'weekly', target: 3, unit: 'times' },
  { id: 'read', name: 'Read', category: 'learning', icon: '📚', color: '#3B82F6', description: '10 pages daily', frequency: 'daily', target: 10, unit: 'pages' },
  { id: 'water', name: 'Drink Water', category: 'health', icon: '💧', color: '#0EA5E9', description: '2L daily', frequency: 'daily', target: 2, unit: 'L' },
  { id: 'meditate', name: 'Meditate', category: 'mindfulness', icon: '🧘', color: '#8B5CF6', description: '10 mins daily', frequency: 'daily', target: 10, unit: 'mins' },
  { id: 'code', name: 'Code', category: 'productivity', icon: '💻', color: '#10B981', description: '1 hour daily', frequency: 'daily', target: 1, unit: 'hour' },
  { id: 'walk', name: 'Walk', category: 'sport', icon: '🚶', color: '#F59E0B', description: '10k steps daily', frequency: 'daily', target: 10000, unit: 'steps' },
];

export default function CategoriesScreen() {
  const { Colors } = useTheme();
  const styles = React.useMemo(() => createStyles(Colors), [Colors]);

  const [selected, setSelected] = useState<Template[]>([]);

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

  const toggleTemplate = (template: Template) => {
    setSelected((prev) => {
      const isSelected = prev.some((t) => t.id === template.id);
      if (isSelected) {
        return prev.filter((t) => t.id !== template.id);
      } else {
        return [...prev, template];
      }
    });
  };

  const handleNext = async () => {
    if (selected.length > 0) {
      await AsyncStorage.setItem('@habitflow_templates', JSON.stringify(selected));
    } else {
      await AsyncStorage.removeItem('@habitflow_templates');
    }
    router.push('/onboarding/motivation');
  };

  const handleSkip = async () => {
    await AsyncStorage.removeItem('@habitflow_templates');
    router.push('/onboarding/motivation');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }} />
        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <Typography variant="button" color={Colors.textMuted}>Skip</Typography>
        </Pressable>
      </View>
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
                What habits do you want to build? 🌟
              </Typography>
              <Typography variant="bodySmall" color={Colors.white} align="center" style={{ opacity: 0.85, marginTop: 4 }}>
                Pick as many templates as you like!
              </Typography>
              <View style={styles.speechTail} />
            </View>
          </Animated.View>

          {/* Template chips */}
          <Animated.View style={[styles.chipGrid, chipsAnim]}>
            {TEMPLATES.map((template, index) => (
              <TemplateChip
                key={template.id}
                template={template}
                isSelected={selected.some((t) => t.id === template.id)}
                onPress={() => toggleTemplate(template)}
                index={index}
                Colors={Colors}
                styles={styles}
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
              {selected.length} template{selected.length !== 1 ? 's' : ''} selected ✓
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

function TemplateChip({
  template,
  isSelected,
  onPress,
  index,
  Colors,
  styles,
}: {
  template: Template;
  isSelected: boolean;
  onPress: () => void;
  index: number;
  Colors: any;
  styles: any;
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
            {template.icon}
          </Typography>
        </View>
        <Typography
          variant="label"
          color={isSelected ? Colors.text : Colors.text}
          style={styles.chipLabel}
        >
          {template.name}
        </Typography>
        <Typography
          variant="caption"
          color={Colors.textMuted}
        >
          {template.description}
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

const createStyles = (Colors: any) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  skipButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
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
    flexGrow: 1,
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
    width: (Dimensions.get('window').width - Spacing.lg * 2 - Spacing.md) / 2,
    backgroundColor: Colors.cardLight,
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
