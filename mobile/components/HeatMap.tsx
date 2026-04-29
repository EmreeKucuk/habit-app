/**
 * HeatMap — GitHub-style contribution heatmap for habit tracking.
 * Each square represents a day. Darker shades = more habits completed.
 * Scrollable horizontally to show several months of history.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Typography from '@/components/ui/Typography';
import { Spacing, FontFamily } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

interface HeatMapProps {
  /** Map of date string (YYYY-MM-DD) → completion count */
  data: Record<string, number>;
  /** Max completions per day to calculate intensity (defaults to auto) */
  maxCount?: number;
  /** Number of weeks to show (default 20 = ~5 months) */
  weeks?: number;
}

const CELL_SIZE = 14;
const CELL_GAP = 3;
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Shades of the card color (#A3B18A) from lightest to darkest
const SHADE_LEVELS = [
  '#E8EDE3',  // Level 0 — empty / no activity
  '#C8D5B9',  // Level 1 — light
  '#A3B18A',  // Level 2 — medium (base card color)
  '#7D9465',  // Level 3 — dark
  '#567A3A',  // Level 4 — darkest
];

function getShade(count: number, maxCount: number): string {
  if (count === 0) return SHADE_LEVELS[0];
  if (maxCount === 0) return SHADE_LEVELS[0];

  const ratio = count / maxCount;
  if (ratio <= 0.25) return SHADE_LEVELS[1];
  if (ratio <= 0.5) return SHADE_LEVELS[2];
  if (ratio <= 0.75) return SHADE_LEVELS[3];
  return SHADE_LEVELS[4];
}

function formatDate(date: Date): string {
  // Use UTC to match the YYYY-MM-DD strings stored by the backend
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function HeatMap({ data, maxCount, weeks = 20 }: HeatMapProps) {
  const { Colors } = useTheme();
  const { grid, monthMarkers, computedMax } = useMemo(() => {
    // Use UTC throughout so date strings match the backend's YYYY-MM-DD format
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const totalDays = weeks * 7;

    // Find start date (align to start of week — Sunday)
    const endDate = new Date(today);
    const startDate = new Date(today);
    startDate.setUTCDate(startDate.getUTCDate() - totalDays + 1);

    // Align to Sunday (using UTC day-of-week)
    const dayOfWeek = startDate.getUTCDay();
    startDate.setUTCDate(startDate.getUTCDate() - dayOfWeek);

    // Build grid: array of weeks, each containing 7 days
    const grid: { date: string; count: number; isToday: boolean; isFuture: boolean }[][] = [];
    const monthMarkers: { weekIndex: number; label: string }[] = [];
    let computedMax = maxCount || 0;

    // First pass: compute max if not provided
    if (!maxCount) {
      Object.values(data).forEach((v) => {
        if (v > computedMax) computedMax = v;
      });
      if (computedMax === 0) computedMax = 1;
    }

    const currentDate = new Date(startDate);
    let lastMonth = -1;
    const todayStr = formatDate(today);

    for (let w = 0; currentDate <= endDate || grid.length < weeks; w++) {
      const week: typeof grid[0] = [];

      for (let d = 0; d < 7; d++) {
        const dateStr = formatDate(currentDate);
        const count = data[dateStr] || 0;
        const isToday = dateStr === todayStr;
        const isFuture = currentDate > today;

        week.push({ date: dateStr, count, isToday, isFuture });

        // Track month transitions for labels
        if (currentDate.getUTCMonth() !== lastMonth && d === 0) {
          monthMarkers.push({
            weekIndex: w,
            label: MONTH_LABELS[currentDate.getUTCMonth()],
          });
          lastMonth = currentDate.getUTCMonth();
        }

        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      }

      grid.push(week);
      if (grid.length >= weeks) break;
    }

    return { grid, monthMarkers, computedMax: computedMax || 1 };
  }, [data, maxCount, weeks]);

  return (
    <View style={styles.container}>
      {/* Month labels */}
      <View style={styles.monthRow}>
        <View style={styles.dayLabelSpacer} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
        >
          <View style={styles.monthLabels}>
            {grid.map((_, weekIndex) => {
              const marker = monthMarkers.find((m) => m.weekIndex === weekIndex);
              return (
                <View
                  key={weekIndex}
                  style={[styles.monthLabelCell]}
                >
                  {marker && (
                    <Typography variant="caption" color={Colors.textMuted}>
                      {marker.label}
                    </Typography>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <View style={styles.gridContainer}>
        {/* Day labels */}
        <View style={styles.dayLabels}>
          {DAY_LABELS.map((label, i) => (
            <View key={i} style={styles.dayLabelCell}>
              <Typography variant="caption" color={Colors.textMuted}>
                {label}
              </Typography>
            </View>
          ))}
        </View>

        {/* Heatmap grid */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.grid}>
            {grid.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.column}>
                {week.map((day, dayIndex) => (
                  <View
                    key={day.date}
                    style={[
                      styles.cell,
                      {
                        backgroundColor: day.isFuture
                          ? 'transparent'
                          : getShade(day.count, computedMax),
                        borderWidth: day.isFuture ? 1 : 0,
                        borderColor: day.isFuture ? Colors.overlayLight : 'transparent',
                      },
                      day.isToday && { borderWidth: 2, borderColor: Colors.accent },
                    ]}
                  />
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Typography variant="caption" color={Colors.textMuted}>
          Less
        </Typography>
        {SHADE_LEVELS.map((shade, i) => (
          <View
            key={i}
            style={[styles.legendCell, { backgroundColor: shade }]}
          />
        ))}
        <Typography variant="caption" color={Colors.textMuted}>
          More
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // No padding — let parent handle it
  },
  monthRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  dayLabelSpacer: {
    width: 28,
  },
  monthLabels: {
    flexDirection: 'row',
  },
  monthLabelCell: {
    width: CELL_SIZE + CELL_GAP,
    height: 16,
    justifyContent: 'flex-end',
  },
  gridContainer: {
    flexDirection: 'row',
  },
  dayLabels: {
    marginRight: 4,
  },
  dayLabelCell: {
    height: CELL_SIZE + CELL_GAP,
    justifyContent: 'center',
    width: 24,
  },
  scrollContent: {
    // Padding for overscroll
  },
  grid: {
    flexDirection: 'row',
  },
  column: {
    flexDirection: 'column',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 3,
    margin: CELL_GAP / 2,
  },
  cellToday: {
    borderWidth: 2,
    borderColor: '#E9C46A',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: Spacing.sm,
    gap: 3,
  },
  legendCell: {
    width: CELL_SIZE - 2,
    height: CELL_SIZE - 2,
    borderRadius: 2,
  },
});
