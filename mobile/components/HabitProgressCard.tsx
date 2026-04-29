import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight, useAnimatedStyle, withTiming, useSharedValue, useEffect } from 'react-native-reanimated';
import Typography from '@/components/ui/Typography';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, Radius, Shadows, FontFamily } from '@/constants/theme';
import { getHabitProgress } from '@/utils/progress';

interface HabitData {
  id: string;
  name: string;
  category: string;
  completedDates: string[];
  streak: number;
  frequency: string;
  frequencyCount: number;
  icon?: string;
  color?: string;
}

interface HabitProgressCardProps {
  habit: HabitData;
  onComplete: (id: string) => void;
  index: number;
}

export default function HabitProgressCard({ habit, onComplete, index }: HabitProgressCardProps) {
  const { Colors } = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);

  const progress = getHabitProgress(habit.frequency, habit.frequencyCount, habit.completedDates);
  const percentage = progress.target > 0 ? Math.min(1, progress.current / progress.target) : 0;

  const barWidth = useSharedValue(0);

  useEffect(() => {
    barWidth.value = withTiming(percentage * 100, { duration: 800 });
  }, [percentage]);

  const animatedBarStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value}%`,
  }));

  const habitColor = habit.color || Colors.accent;

  return (
    <Animated.View 
      entering={FadeInRight.delay(index * 100).duration(400)}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="leaf-outline" size={24} color={habitColor} />
        </View>
        <View style={styles.textContainer}>
          <Typography variant="body" style={styles.name} numberOfLines={1}>
            {habit.name}
          </Typography>
          <View style={styles.subtitleRow}>
            <Typography variant="caption" color={Colors.textMuted}>
              {habit.frequency === 'flexible_weekly' ? 'Weekly' : habit.frequency === 'interval' ? `Every ${habit.frequencyCount}d` : 'Daily'}
            </Typography>
            <View style={styles.dot} />
            <Ionicons name="flame" size={12} color="#E76F51" />
            <Typography variant="caption" color={Colors.textMuted} style={{ marginLeft: 2 }}>
              {habit.streak}
            </Typography>
          </View>
        </View>
        
        {progress.isCompleted ? (
          <View style={[styles.completeButton, styles.completedButton]}>
            <Ionicons name="checkmark" size={20} color={Colors.white} />
          </View>
        ) : (
          <Pressable 
            style={styles.completeButton}
            onPress={() => onComplete(habit.id)}
          >
            <Ionicons name="checkmark" size={20} color={Colors.textMuted} />
          </Pressable>
        )}
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Typography variant="caption" color={Colors.textMuted}>
            Progress
          </Typography>
          <Typography variant="caption" style={{ fontFamily: FontFamily.semiBold, color: habitColor }}>
            {progress.label}
          </Typography>
        </View>
        
        <View style={styles.barBackground}>
          <Animated.View 
            style={[
              styles.barFill, 
              animatedBarStyle, 
              { backgroundColor: habitColor }
            ]} 
          />
        </View>
      </View>
    </Animated.View>
  );
}

const createStyles = (Colors: any) => StyleSheet.create({
  card: {
    backgroundColor: Colors.cardLight,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    width: 260,
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontFamily: FontFamily.semiBold,
    marginBottom: 2,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
    marginHorizontal: 6,
  },
  completeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  completedButton: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  progressSection: {
    marginTop: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  barBackground: {
    height: 8,
    backgroundColor: Colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
});
