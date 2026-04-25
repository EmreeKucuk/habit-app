/**
 * HabitFlow Design System
 * Global color palette, typography, spacing, and design tokens.
 */

// ─── Color Palette ───────────────────────────────────────────────
export const Colors = {
  // Primary palette
  background: '#FEFAE0',
  card: '#A3B18A',
  text: '#344E41',
  accent: '#E9C46A',

  // Derived / utility colors
  cardLight: '#B7C9A0',       // Lighter variant of card
  cardDark: '#8A9B72',        // Darker variant of card
  textLight: '#4A6B55',       // Softer text
  textMuted: '#7A9A7E',       // Muted/placeholder text
  accentDark: '#D4AB4A',      // Darker accent for pressed states
  accentLight: '#F0D78A',     // Lighter accent

  // Semantic colors
  white: '#FFFFFF',
  black: '#1A1A1A',
  error: '#D64545',
  success: '#4CAF50',
  warning: '#FF9800',

  // Opacity overlays
  overlay: 'rgba(52, 78, 65, 0.5)',
  overlayLight: 'rgba(52, 78, 65, 0.1)',

  // Tab bar / navigation
  tabBarBackground: '#FEFAE0',
  tabBarActive: '#344E41',
  tabBarInactive: '#A3B18A',
};

// ─── Spacing ─────────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

// ─── Border Radius ───────────────────────────────────────────────
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

// ─── Shadows ─────────────────────────────────────────────────────
export const Shadows = {
  sm: {
    shadowColor: '#344E41',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#344E41',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#344E41',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// ─── Font Families ───────────────────────────────────────────────
export const FontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extraBold: 'Inter_800ExtraBold',
} as const;

// ─── Font Sizes ──────────────────────────────────────────────────
export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 36,
  display: 48,
} as const;

// ─── Line Heights ────────────────────────────────────────────────
export const LineHeight = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 32,
  xxl: 36,
  xxxl: 44,
  display: 56,
} as const;
