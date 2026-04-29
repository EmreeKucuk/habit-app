/**
 * Home Tab — Main Dashboard
 * Top 40%: Daily overview with circular progress + streak counter.
 * Bottom 60%: Scrollable GitHub-style contribution heatmap.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import CircularProgress from '@/components/CircularProgress';
import HeatMap from '@/components/HeatMap';
import Typography from '@/components/ui/Typography';
import { Spacing, Radius, Shadows, FontFamily } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { API_ENDPOINTS } from '@/constants/api';
import api from '@/services/api';
import { fetchMotivationScore, MotivationScore } from '@/services/motivation';
import { requestNotificationPermissionsAsync, scheduleMotivationReminder } from '@/services/notifications';

interface HabitData {
  id: string;
  name: string;
  category: string;
  completedDates: string[];
  streak: number;
}

interface StatsData {
  totalHabits: number;
  completedToday: number;
  currentStreak: number;
  longestStreak: number;
  successPercentage: number;
  weeklyAverage: number;
}

export default function HomeScreen() {
  const { Colors } = useTheme();
  const styles = React.useMemo(() => createStyles(Colors), [Colors]);

  const [habits, setHabits] = useState<HabitData[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [userName, setUserName] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [motivationScore, setMotivationScore] = useState<MotivationScore | null>(null);

  // Entrance animations
  const headerOpacity = useSharedValue(0);
  const overviewOpacity = useSharedValue(0);
  const overviewScale = useSharedValue(0.95);
  const heatmapOpacity = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withDelay(100, withTiming(1, { duration: 500 }));
    overviewOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
    overviewScale.value = withDelay(300, withSpring(1, { damping: 14 }));
    heatmapOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
  }, []);

  const headerAnim = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const overviewAnim = useAnimatedStyle(() => ({
    opacity: overviewOpacity.value,
    transform: [{ scale: overviewScale.value }],
  }));

  const heatmapAnim = useAnimatedStyle(() => ({
    opacity: heatmapOpacity.value,
  }));

  useFocusEffect(
    useCallback(() => {
      // Request notification permissions when dashboard is focused
      requestNotificationPermissionsAsync();
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      // Load user name from onboarding or profile
      const name = await AsyncStorage.getItem('@habitflow_user_name');
      setUserName(name || 'there');

      // Check for pending templates from onboarding
      const pendingTemplates = await AsyncStorage.getItem('@habitflow_templates');
      if (pendingTemplates) {
        try {
          const templates = JSON.parse(pendingTemplates);
          if (Array.isArray(templates) && templates.length > 0) {
            for (const t of templates) {
              await api.post(API_ENDPOINTS.habits, {
                name: t.name,
                category: t.category,
                icon: t.icon,
                color: t.color,
                frequency: t.frequency,
                target: t.target,
                unit: t.unit,
              });
            }
          }
        } catch (e) {
          console.log('Error creating template habits:', e);
        }
        // Remove so we don't create them again
        await AsyncStorage.removeItem('@habitflow_templates');
      }

      // Fetch habits
      const habitsRes = await api.get<{ habits: HabitData[] }>(API_ENDPOINTS.habits);
      if (habitsRes.data?.habits) {
        setHabits(habitsRes.data.habits);
      }

      // Fetch stats from the proper endpoint
      const statsRes = await api.get<StatsData>(API_ENDPOINTS.userStats);
      if (statsRes.data) {
        setStats(statsRes.data);
      }

      // Fetch motivation score
      const mScore = await fetchMotivationScore();
      if (mScore) {
        setMotivationScore(mScore);
      }

      // Schedule tomorrow's reminder based on current score
      scheduleMotivationReminder(mScore);
    } catch (error) {
      console.log('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  // Calculate today's completion ratio
  const today = new Date().toISOString().split('T')[0];
  const totalHabits = habits.length;
  const completedToday = habits.filter((h) =>
    h.completedDates?.includes(today)
  ).length;

  // Best streak across all habits
  const bestStreak = stats?.currentStreak || Math.max(0, ...habits.map((h) => h.streak || 0));

  // Build heatmap data from all habit completions
  const heatmapData: Record<string, number> = {};
  habits.forEach((habit) => {
    (habit.completedDates || []).forEach((date) => {
      heatmapData[date] = (heatmapData[date] || 0) + 1;
    });
  });

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
            colors={[Colors.accent]}
          />
        }
      >
        {/* ─── Header ─── */}
        <Animated.View style={[styles.header, headerAnim]}>
          <View>
            <Typography variant="h2">
              {getGreeting()} 👋
            </Typography>
            <Typography variant="body" color={Colors.textLight}>
              {userName ? `Hey ${userName}, ` : ''}let's check your progress
            </Typography>
          </View>
        </Animated.View>

        {/* ─── Top Section: Daily Overview (40%) ─── */}
        <Animated.View style={[styles.overviewCard, overviewAnim]}>
          <View style={styles.overviewTop}>
            {/* Circular Progress */}
            <CircularProgress
              completed={completedToday}
              total={totalHabits || 0}
              size={150}
              strokeWidth={14}
            />

            {/* Streak & Stats */}
            <View style={styles.statsColumn}>
              {/* Current Streak */}
              <View style={styles.statBox}>
                <View style={styles.statIconRow}>
                  <Ionicons name="flame" size={20} color={Colors.accent} />
                  <Typography variant="caption" color={Colors.textMuted}>
                    STREAK
                  </Typography>
                </View>
                <Typography variant="h1" color={Colors.text}>
                  {bestStreak}
                </Typography>
                <Typography variant="caption" color={Colors.textMuted}>
                  {bestStreak === 1 ? 'day' : 'days'}
                </Typography>
              </View>

              {/* Weekly Average */}
              <View style={styles.statBox}>
                <View style={styles.statIconRow}>
                  <Ionicons name="trending-up" size={18} color={Colors.card} />
                  <Typography variant="caption" color={Colors.textMuted}>
                    WEEKLY
                  </Typography>
                </View>
                <Typography variant="h2" color={Colors.text}>
                  {stats?.weeklyAverage?.toFixed(1) || '0'}
                </Typography>
                <Typography variant="caption" color={Colors.textMuted}>
                  avg/day
                </Typography>
              </View>
            </View>
          </View>

          {/* Motivational message */}
          <View style={styles.motivationBar}>
            <Typography variant="bodySmall" color={Colors.text} style={styles.motivationText}>
              {getMotivationalMessage(completedToday, totalHabits)}
            </Typography>
          </View>
        </Animated.View>

        {/* ─── Bottom Section: Activity Heatmap (60%) ─── */}
        <Animated.View style={[styles.heatmapSection, heatmapAnim]}>
          <View style={styles.sectionHeader}>
            <Typography variant="h3">Activity</Typography>
            <View style={styles.totalBadge}>
              <Typography variant="caption" color={Colors.text}>
                {Object.values(heatmapData).reduce((a, b) => a + b, 0)} total
              </Typography>
            </View>
          </View>

          <View style={styles.heatmapCard}>
            <HeatMap
              data={heatmapData}
              weeks={18}
            />
          </View>
        </Animated.View>

        {/* ─── Motivation Score Card ─── */}
        <Animated.View entering={FadeInDown.delay(750).duration(500)}>
          <View style={styles.motivationCard}>
            <View style={styles.motivationHeader}>
              <Ionicons name="heart" size={20} color={Colors.accent} />
              <Typography variant="h3"> Motivation</Typography>
            </View>
            <View style={styles.motivationBody}>
              <View style={styles.motivationScoreCircle}>
                <Typography variant="h1" color={Colors.white}>
                  {motivationScore?.score ?? '--'}
                </Typography>
              </View>
              <View style={styles.motivationInfo}>
                <View style={[
                  styles.motivationLevelBadge,
                  {
                    backgroundColor:
                      motivationScore?.level === 'high' ? '#2D6A4F' :
                      motivationScore?.level === 'medium' ? Colors.accent :
                      Colors.textMuted,
                  },
                ]}>
                  <Typography variant="caption" color={Colors.white}>
                    {motivationScore?.level?.toUpperCase() ?? 'N/A'}
                  </Typography>
                </View>
                <Typography variant="bodySmall" color={Colors.textLight} style={{ marginTop: 6 }}>
                  {motivationScore?.mascotTone?.encouragement ?? 'Start logging habits to build your score!'}
                </Typography>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ─── Quick Stats Row ─── */}
        <Animated.View entering={FadeInDown.delay(900).duration(500)}>
          <View style={styles.quickStats}>
            <QuickStatCard
              icon="checkmark-circle"
              iconColor={Colors.success}
              label="Total Done"
              value={String(Object.values(heatmapData).reduce((a, b) => a + b, 0))}
              Colors={Colors}
              styles={styles}
            />
            <QuickStatCard
              icon="trophy"
              iconColor={Colors.accent}
              label="Longest Streak"
              value={`${stats?.longestStreak || bestStreak}d`}
              Colors={Colors}
              styles={styles}
            />
            <QuickStatCard
              icon="fitness"
              iconColor="#E76F51"
              label="Success"
              value={`${stats?.successPercentage || 0}%`}
              Colors={Colors}
              styles={styles}
            />
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickStatCard({
  icon,
  iconColor,
  label,
  value,
  Colors,
  styles,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value: string;
  Colors: any;
  styles: any;
}) {
  return (
    <View style={styles.quickStatCard}>
      <Ionicons name={icon} size={22} color={iconColor} style={{ marginBottom: 4 }} />
      <Typography variant="h3" color={Colors.text}>
        {value}
      </Typography>
      <Typography variant="caption" color={Colors.textMuted}>
        {label}
      </Typography>
    </View>
  );
}

function getMotivationalMessage(completed: number, total: number): string {
  if (total === 0) return '🌱 Add your first habit to get started!';
  const ratio = completed / total;
  if (ratio === 1) return '🎉 Perfect day! All habits completed!';
  if (ratio >= 0.75) return '🔥 Almost there! Keep pushing!';
  if (ratio >= 0.5) return '💪 Halfway done, you got this!';
  if (ratio > 0) return '🌤️ Good start! Keep the momentum going!';
  return "☀️ Fresh day ahead — let's make it count!";
}

const createStyles = (Colors: any) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  // Header
  header: {
    paddingTop: Spacing.md,
    marginBottom: Spacing.lg,
  },

  // Overview Card
  overviewCard: {
    backgroundColor: Colors.cardLight,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  overviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsColumn: {
    flex: 1,
    marginLeft: Spacing.lg,
    gap: Spacing.md,
  },
  statBox: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  motivationBar: {
    backgroundColor: Colors.overlayLight,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  motivationText: {
    fontFamily: FontFamily.medium,
  },

  // Heatmap Section
  heatmapSection: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  totalBadge: {
    backgroundColor: Colors.overlayLight,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  heatmapCard: {
    backgroundColor: Colors.cardLight,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },

  // Motivation Card
  motivationCard: {
    backgroundColor: Colors.cardLight,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  motivationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  motivationBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  motivationScoreCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  motivationInfo: {
    flex: 1,
  },
  motivationLevelBadge: {
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
  },

  // Quick Stats
  quickStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: Colors.cardLight,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
});
