/**
 * Button — Reusable button component for HabitFlow.
 * Supports primary, secondary, outline, and ghost variants with press animations.
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import Typography from './Typography';
import { Spacing, Radius, Shadows } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
}: ButtonProps) {
  const { Colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const variantStyles = getVariantStyles(variant, Colors);
  const sizeStyles = getSizeStyles(size);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        styles.base,
        variantStyles.container,
        sizeStyles.container,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantStyles.textColor}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Typography
            variant="button"
            color={variantStyles.textColor}
            style={[
              icon && iconPosition === 'left' ? { marginLeft: Spacing.sm } : undefined,
              icon && iconPosition === 'right' ? { marginRight: Spacing.sm } : undefined,
            ]}
          >
            {title}
          </Typography>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </AnimatedPressable>
  );
}

function getVariantStyles(variant: ButtonVariant, Colors: any) {
  switch (variant) {
    case 'primary':
      return {
        container: {
          backgroundColor: Colors.accent,
          ...Shadows.sm,
        } as ViewStyle,
        textColor: Colors.text,
      };
    case 'secondary':
      return {
        container: {
          backgroundColor: Colors.card,
          ...Shadows.sm,
        } as ViewStyle,
        textColor: Colors.white,
      };
    case 'outline':
      return {
        container: {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: Colors.text,
        } as ViewStyle,
        textColor: Colors.text,
      };
    case 'ghost':
      return {
        container: {
          backgroundColor: 'transparent',
        } as ViewStyle,
        textColor: Colors.text,
      };
  }
}

function getSizeStyles(size: ButtonSize) {
  switch (size) {
    case 'sm':
      return {
        container: {
          paddingVertical: Spacing.sm,
          paddingHorizontal: Spacing.md,
          borderRadius: Radius.sm,
        } as ViewStyle,
      };
    case 'md':
      return {
        container: {
          paddingVertical: Spacing.md - 2,
          paddingHorizontal: Spacing.lg,
          borderRadius: Radius.md,
        } as ViewStyle,
      };
    case 'lg':
      return {
        container: {
          paddingVertical: Spacing.md + 2,
          paddingHorizontal: Spacing.xl,
          borderRadius: Radius.lg,
        } as ViewStyle,
      };
  }
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
});
