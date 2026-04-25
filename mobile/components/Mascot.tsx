/**
 * Mascot — "Sprout", the friendly HabitFlow companion.
 * A minimalist plant character rendered with React Native views.
 * Supports different moods with animated expressions.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '@/constants/theme';

type MascotMood = 'happy' | 'curious' | 'excited' | 'waving' | 'thinking';
type MascotSize = 'sm' | 'md' | 'lg';

interface MascotProps {
  mood?: MascotMood;
  size?: MascotSize;
  animated?: boolean;
}

const SIZES = {
  sm: { body: 60, eye: 8, pupil: 4, leaf: 18, stem: 14 },
  md: { body: 100, eye: 12, pupil: 6, leaf: 28, stem: 20 },
  lg: { body: 140, eye: 16, pupil: 8, leaf: 36, stem: 26 },
};

export default function Mascot({ mood = 'happy', size = 'md', animated = true }: MascotProps) {
  const s = SIZES[size];
  const bounce = useSharedValue(0);
  const leafRotate = useSharedValue(0);
  const leftEyeScale = useSharedValue(1);
  const rightEyeScale = useSharedValue(1);
  const bodyScale = useSharedValue(0);

  useEffect(() => {
    // Entrance animation
    bodyScale.value = withSpring(1, { damping: 12, stiffness: 100 });

    if (!animated) return;

    // Gentle floating bounce
    bounce.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );

    // Leaf sway
    leafRotate.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(8, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );

    // Blink every few seconds
    const startBlink = () => {
      leftEyeScale.value = withDelay(
        3000,
        withRepeat(
          withSequence(
            withTiming(0.1, { duration: 100 }),
            withTiming(1, { duration: 150 }),
          ),
          -1,
          false,
        ),
      );
      rightEyeScale.value = withDelay(
        3000,
        withRepeat(
          withSequence(
            withTiming(0.1, { duration: 100 }),
            withTiming(1, { duration: 150 }),
          ),
          -1,
          false,
        ),
      );
    };
    startBlink();
  }, [animated]);

  const bodyAnim = useAnimatedStyle(() => ({
    transform: [
      { translateY: bounce.value },
      { scale: bodyScale.value },
    ],
  }));

  const leafAnim = useAnimatedStyle(() => ({
    transform: [{ rotate: `${leafRotate.value}deg` }],
  }));

  const leftEyeAnim = useAnimatedStyle(() => ({
    transform: [{ scaleY: leftEyeScale.value }],
  }));

  const rightEyeAnim = useAnimatedStyle(() => ({
    transform: [{ scaleY: rightEyeScale.value }],
  }));

  // Eye positions and expressions based on mood
  const getExpression = () => {
    switch (mood) {
      case 'curious':
        return { leftPupilX: -1, rightPupilX: 2, mouthType: 'o' };
      case 'excited':
        return { leftPupilX: 0, rightPupilX: 0, mouthType: 'big-smile' };
      case 'waving':
        return { leftPupilX: 1, rightPupilX: 1, mouthType: 'smile' };
      case 'thinking':
        return { leftPupilX: 3, rightPupilX: 3, mouthType: 'flat' };
      case 'happy':
      default:
        return { leftPupilX: 0, rightPupilX: 0, mouthType: 'smile' };
    }
  };

  const expr = getExpression();

  return (
    <Animated.View style={[styles.wrapper, bodyAnim]}>
      {/* Leaf / Sprout on top */}
      <Animated.View style={[styles.leafContainer, leafAnim, { top: -s.stem }]}>
        <View style={[styles.stem, { height: s.stem, width: 3 }]} />
        <View
          style={[
            styles.leaf,
            {
              width: s.leaf,
              height: s.leaf * 0.7,
              borderRadius: s.leaf / 2,
              top: -s.leaf * 0.35,
              left: 2,
            },
          ]}
        />
        <View
          style={[
            styles.leafSmall,
            {
              width: s.leaf * 0.7,
              height: s.leaf * 0.5,
              borderRadius: s.leaf / 2,
              top: -s.leaf * 0.15,
              right: 2,
            },
          ]}
        />
      </Animated.View>

      {/* Body */}
      <View
        style={[
          styles.body,
          {
            width: s.body,
            height: s.body,
            borderRadius: s.body / 2,
          },
        ]}
      >
        {/* Cheeks (blush) */}
        <View
          style={[
            styles.cheek,
            {
              width: s.eye * 1.5,
              height: s.eye * 0.8,
              borderRadius: s.eye,
              left: s.body * 0.12,
              top: s.body * 0.52,
            },
          ]}
        />
        <View
          style={[
            styles.cheek,
            {
              width: s.eye * 1.5,
              height: s.eye * 0.8,
              borderRadius: s.eye,
              right: s.body * 0.12,
              top: s.body * 0.52,
            },
          ]}
        />

        {/* Eyes */}
        <View style={[styles.eyeRow, { top: s.body * 0.35, gap: s.body * 0.15 }]}>
          {/* Left eye */}
          <Animated.View
            style={[
              styles.eye,
              leftEyeAnim,
              { width: s.eye, height: s.eye * 1.2, borderRadius: s.eye / 2 },
            ]}
          >
            <View
              style={[
                styles.pupil,
                {
                  width: s.pupil,
                  height: s.pupil,
                  borderRadius: s.pupil / 2,
                  transform: [{ translateX: expr.leftPupilX }],
                },
              ]}
            />
          </Animated.View>

          {/* Right eye */}
          <Animated.View
            style={[
              styles.eye,
              rightEyeAnim,
              { width: s.eye, height: s.eye * 1.2, borderRadius: s.eye / 2 },
            ]}
          >
            <View
              style={[
                styles.pupil,
                {
                  width: s.pupil,
                  height: s.pupil,
                  borderRadius: s.pupil / 2,
                  transform: [{ translateX: expr.rightPupilX }],
                },
              ]}
            />
          </Animated.View>
        </View>

        {/* Mouth */}
        <View style={[styles.mouthContainer, { top: s.body * 0.58 }]}>
          {expr.mouthType === 'smile' && (
            <View
              style={[
                styles.smile,
                {
                  width: s.body * 0.2,
                  height: s.body * 0.1,
                  borderBottomLeftRadius: s.body * 0.1,
                  borderBottomRightRadius: s.body * 0.1,
                },
              ]}
            />
          )}
          {expr.mouthType === 'big-smile' && (
            <View
              style={[
                styles.bigSmile,
                {
                  width: s.body * 0.25,
                  height: s.body * 0.13,
                  borderBottomLeftRadius: s.body * 0.13,
                  borderBottomRightRadius: s.body * 0.13,
                },
              ]}
            />
          )}
          {expr.mouthType === 'o' && (
            <View
              style={[
                styles.oMouth,
                {
                  width: s.body * 0.1,
                  height: s.body * 0.1,
                  borderRadius: s.body * 0.05,
                },
              ]}
            />
          )}
          {expr.mouthType === 'flat' && (
            <View
              style={[
                styles.flatMouth,
                { width: s.body * 0.15, height: 2 },
              ]}
            />
          )}
        </View>
      </View>

      {/* Shadow */}
      <View
        style={[
          styles.shadow,
          {
            width: s.body * 0.6,
            height: s.body * 0.1,
            borderRadius: s.body * 0.3,
            marginTop: 6,
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  leafContainer: {
    alignItems: 'center',
    position: 'relative',
    zIndex: 10,
  },
  stem: {
    backgroundColor: '#6B8F5E',
  },
  leaf: {
    position: 'absolute',
    backgroundColor: '#8CB369',
  },
  leafSmall: {
    position: 'absolute',
    backgroundColor: '#A3C585',
  },
  body: {
    backgroundColor: Colors.card,
    position: 'relative',
    overflow: 'hidden',
  },
  eyeRow: {
    position: 'absolute',
    flexDirection: 'row',
    alignSelf: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  eye: {
    backgroundColor: Colors.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pupil: {
    backgroundColor: Colors.white,
  },
  cheek: {
    position: 'absolute',
    backgroundColor: 'rgba(233, 196, 106, 0.4)',
  },
  mouthContainer: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
  },
  smile: {
    backgroundColor: 'transparent',
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    borderRightWidth: 2.5,
    borderColor: Colors.text,
  },
  bigSmile: {
    backgroundColor: '#8A9B72',
    borderBottomWidth: 0,
    borderColor: Colors.text,
    borderWidth: 2,
    borderTopWidth: 0,
  },
  oMouth: {
    backgroundColor: '#8A9B72',
    borderWidth: 2,
    borderColor: Colors.text,
  },
  flatMouth: {
    backgroundColor: Colors.text,
    borderRadius: 1,
  },
  shadow: {
    backgroundColor: 'rgba(52, 78, 65, 0.1)',
  },
});
