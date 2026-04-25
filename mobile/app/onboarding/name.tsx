/**
 * Onboarding Step 2 — Name Screen
 * Mascot asks "What should I call you?" with a text input.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
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
import { Colors, Spacing, Radius, FontFamily, FontSize, Shadows } from '@/constants/theme';

export default function NameScreen() {
  const [name, setName] = useState('');
  const inputRef = useRef<TextInput>(null);

  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(30);
  const inputOpacity = useSharedValue(0);
  const inputTranslateY = useSharedValue(20);

  useEffect(() => {
    contentOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));
    contentTranslateY.value = withDelay(200, withSpring(0, { damping: 15 }));
    inputOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));
    inputTranslateY.value = withDelay(600, withSpring(0, { damping: 15 }));
  }, []);

  const contentAnim = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const inputAnim = useAnimatedStyle(() => ({
    opacity: inputOpacity.value,
    transform: [{ translateY: inputTranslateY.value }],
  }));

  const handleNext = async () => {
    if (name.trim().length > 0) {
      await AsyncStorage.setItem('@habitflow_user_name', name.trim());
      router.push('/onboarding/categories');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.container}>
            {/* Progress */}
            <OnboardingProgress currentStep={1} totalSteps={5} />

            {/* Content */}
            <View style={styles.content}>
              <Animated.View style={[styles.topSection, contentAnim]}>
                <Mascot mood="curious" size="md" />

                <View style={styles.speechBubble}>
                  <Typography variant="h3" color={Colors.white} align="center">
                    What should I call you? 🤔
                  </Typography>
                  <View style={styles.speechTail} />
                </View>
              </Animated.View>

              <Animated.View style={[styles.inputSection, inputAnim]}>
                <Typography variant="bodySmall" color={Colors.textMuted} style={styles.inputLabel}>
                  YOUR NAME
                </Typography>
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  placeholder="e.g. Alex"
                  placeholderTextColor={Colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={30}
                  returnKeyType="done"
                  onSubmitEditing={handleNext}
                />

                {name.trim().length > 0 && (
                  <Typography
                    variant="bodySmall"
                    color={Colors.card}
                    style={styles.greeting}
                  >
                    Nice to meet you, {name.trim()}! ✨
                  </Typography>
                )}
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
                disabled={name.trim().length === 0}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
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
  inputSection: {
    paddingHorizontal: Spacing.sm,
  },
  inputLabel: {
    marginBottom: Spacing.sm,
    letterSpacing: 1,
    fontFamily: FontFamily.semiBold,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    fontSize: FontSize.lg,
    fontFamily: FontFamily.medium,
    color: Colors.text,
    ...Shadows.sm,
  },
  greeting: {
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  buttonSection: {
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
});
