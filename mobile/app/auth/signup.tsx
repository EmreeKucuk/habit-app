/**
 * Auth — Sign Up Screen
 * Registration form with username, email, password, and confirm password.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import Typography from '@/components/ui/Typography';
import { Colors, Spacing, Radius, Shadows, FontFamily, FontSize } from '@/constants/theme';
import { API_ENDPOINTS } from '@/constants/api';
import api from '@/services/api';

export default function SignupScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  // Pre-fill username from onboarding if available
  useEffect(() => {
    AsyncStorage.getItem('@habitflow_user_name').then((name) => {
      if (name) setUsername(name.toLowerCase().replace(/\s+/g, '_'));
    });
  }, []);

  // Entrance animations
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(30);

  useEffect(() => {
    headerOpacity.value = withDelay(100, withTiming(1, { duration: 500 }));
    headerTranslateY.value = withDelay(100, withSpring(0, { damping: 15 }));
    cardOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
    cardTranslateY.value = withDelay(300, withSpring(0, { damping: 14 }));
  }, []);

  const headerAnim = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const cardAnim = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const handleSignup = async () => {
    // Validation
    if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }

    if (username.trim().length < 3) {
      Alert.alert('Invalid Username', 'Username must be at least 3 characters.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      Alert.alert(
        'Password Requirements',
        'Password must contain at least one uppercase letter, one lowercase letter, and one number.',
      );
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await api.post(API_ENDPOINTS.register, {
        username: username.trim(),
        email: email.trim(),
        password,
        confirmPassword,
      });

      if (error) {
        Alert.alert('Registration Failed', error);
        return;
      }

      Alert.alert(
        'Account Created! 🎉',
        'Please check your email to verify your account, then log in.',
        [
          {
            text: 'Go to Login',
            onPress: () => router.back(),
          },
        ],
      );
    } catch (err: any) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <Animated.View style={[styles.header, headerAnim]}>
              {/* Back button */}
              <Pressable
                onPress={() => router.back()}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color={Colors.text} />
              </Pressable>

              <View style={styles.logoContainer}>
                <Typography variant="h1" align="center">
                  🌿
                </Typography>
              </View>
              <Typography variant="h2" align="center">
                Create Account
              </Typography>
              <Typography
                variant="body"
                align="center"
                color={Colors.textMuted}
                style={styles.headerSub}
              >
                Join HabitFlow and start your journey
              </Typography>
            </Animated.View>

            {/* Form Card */}
            <Animated.View style={[styles.card, cardAnim]}>
              {/* Username */}
              <View style={styles.inputGroup}>
                <Typography variant="label" color={Colors.textLight} style={styles.inputLabel}>
                  Username
                </Typography>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={Colors.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="your_username"
                    placeholderTextColor={Colors.textMuted}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={20}
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Typography variant="label" color={Colors.textLight} style={styles.inputLabel}>
                  Email Address
                </Typography>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={Colors.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    ref={emailRef}
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor={Colors.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Typography variant="label" color={Colors.textLight} style={styles.inputLabel}>
                  Password
                </Typography>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={Colors.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    ref={passwordRef}
                    style={styles.input}
                    placeholder="Min 6 chars, 1 upper, 1 number"
                    placeholderTextColor={Colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    returnKeyType="next"
                    onSubmitEditing={() => confirmRef.current?.focus()}
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={Colors.textMuted}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Typography variant="label" color={Colors.textLight} style={styles.inputLabel}>
                  Confirm Password
                </Typography>
                <View style={[
                  styles.inputWrapper,
                  confirmPassword.length > 0 && password !== confirmPassword && styles.inputError,
                ]}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={20}
                    color={Colors.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    ref={confirmRef}
                    style={styles.input}
                    placeholder="Re-enter your password"
                    placeholderTextColor={Colors.textMuted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    returnKeyType="go"
                    onSubmitEditing={handleSignup}
                  />
                </View>
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <Typography variant="caption" color={Colors.error} style={styles.errorText}>
                    Passwords don't match
                  </Typography>
                )}
                {confirmPassword.length > 0 && password === confirmPassword && (
                  <Typography variant="caption" color={Colors.success} style={styles.errorText}>
                    ✓ Passwords match
                  </Typography>
                )}
              </View>

              {/* Sign Up Button */}
              <Pressable
                style={[styles.signupButton, isLoading && styles.signupButtonDisabled]}
                onPress={handleSignup}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={Colors.text} />
                ) : (
                  <Typography variant="button" color={Colors.text}>
                    Create Account
                  </Typography>
                )}
              </Pressable>
            </Animated.View>

            {/* Login Link */}
            <Animated.View
              style={styles.loginContainer}
              entering={FadeInDown.delay(700).duration(500)}
            >
              <Typography variant="body" color={Colors.textMuted}>
                Already have an account?{' '}
              </Typography>
              <Pressable onPress={() => router.back()}>
                <Typography variant="body" color={Colors.accent} style={styles.loginLink}>
                  Log in
                </Typography>
              </Pressable>
            </Animated.View>
          </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.overlayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  headerSub: {
    marginTop: Spacing.xs,
  },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadows.lg,
  },

  // Inputs
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.overlayLight,
    paddingHorizontal: Spacing.md,
  },
  inputError: {
    borderColor: Colors.error,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.md - 2,
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: Colors.text,
  },
  eyeButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  errorText: {
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },

  // Sign Up Button
  signupButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    ...Shadows.sm,
  },
  signupButtonDisabled: {
    opacity: 0.7,
  },

  // Login Link
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  loginLink: {
    fontFamily: FontFamily.semiBold,
  },
});
