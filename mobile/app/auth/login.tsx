/**
 * Auth — Login Screen
 * Modern card-based login with social buttons, email/password, and signup link.
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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Typography from '@/components/ui/Typography';
import { Colors, Spacing, Radius, Shadows, FontFamily, FontSize } from '@/constants/theme';
import { API_ENDPOINTS, API_BASE_URL } from '@/constants/api';
import api, { saveAuthTokens } from '@/services/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);

  const handleGoogleLogin = async () => {
    setIsSocialLoading('Google');
    try {
      // The app's deep link URL that the backend will redirect to after OAuth
      const appRedirectUri = Linking.createURL('auth/google-callback');

      // Open the backend's Google sign-in endpoint in a browser
      // The backend handles the entire OAuth flow and redirects back with tokens
      const authUrl = `${API_BASE_URL}/api/auth/google-signin?redirect=${encodeURIComponent(appRedirectUri)}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, appRedirectUri);

      if (result.type === 'success' && result.url) {
        // Parse tokens from the redirect URL
        const url = new URL(result.url);
        const token = url.searchParams.get('token');
        const refreshToken = url.searchParams.get('refreshToken');

        if (token && refreshToken) {
          await saveAuthTokens(token, refreshToken);
          router.replace('/(tabs)');
        } else {
          const error = url.searchParams.get('error');
          Alert.alert('Sign-In Failed', error || 'Could not sign in with Google.');
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Could not start Google sign-in.');
    } finally {
      setIsSocialLoading(null);
    }
  };

  const handleAppleLogin = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Not Available', 'Apple Sign-In is only available on iOS devices.');
      return;
    }
    setIsSocialLoading('Apple');
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const { data, error } = await api.post<{
        token: string;
        refreshToken: string;
        user: any;
      }>(API_ENDPOINTS.appleAuth, {
        identityToken: credential.identityToken,
        email: credential.email,
        fullName: credential.fullName,
        appleUserId: credential.user,
      });

      if (error) {
        Alert.alert('Apple Sign-In Failed', error);
        return;
      }

      if (data?.token) {
        await saveAuthTokens(data.token, data.refreshToken);
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      if (err.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Error', 'Apple sign-in failed. Please try again.');
      }
    } finally {
      setIsSocialLoading(null);
    }
  };

  // Entrance animations
  const logoOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(-20);
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(30);

  useEffect(() => {
    logoOpacity.value = withDelay(100, withTiming(1, { duration: 500 }));
    logoTranslateY.value = withDelay(100, withSpring(0, { damping: 15 }));
    cardOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
    cardTranslateY.value = withDelay(300, withSpring(0, { damping: 14 }));
  }, []);

  const logoAnim = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoTranslateY.value }],
  }));

  const cardAnim = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await api.post<{
        token: string;
        refreshToken: string;
        user: any;
      }>(API_ENDPOINTS.login, {
        emailOrUsername: email.trim(),
        password: password,
      });

      if (error) {
        Alert.alert('Login Failed', error);
        return;
      }

      if (data?.token) {
        await saveAuthTokens(data.token, data.refreshToken);
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!email.trim()) {
      Alert.alert(
        'Enter Email',
        'Please enter your email address first, then tap Forgot Password.',
      );
      return;
    }

    Alert.alert(
      'Reset Password',
      `We'll send a password reset link to ${email.trim()}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Link',
          onPress: async () => {
            const { error } = await api.post(API_ENDPOINTS.forgotPassword, {
              email: email.trim(),
            });
            Alert.alert(
              'Check Your Email',
              'If an account exists with that email, you will receive a reset link.',
            );
          },
        },
      ],
    );
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
            {/* Logo / Header */}
            <Animated.View style={[styles.header, logoAnim]}>
              <View style={styles.logoContainer}>
                <Typography variant="display" align="center">
                  🌿
                </Typography>
              </View>
              <Typography variant="h1" align="center">
                HabitFlow
              </Typography>
              <Typography
                variant="body"
                align="center"
                color={Colors.textMuted}
                style={styles.headerSub}
              >
                Welcome back! Sign in to continue.
              </Typography>
            </Animated.View>

            {/* Auth Card */}
            <Animated.View style={[styles.card, cardAnim]}>
              {/* Social Buttons */}
              <Pressable
                style={[styles.socialButton, isSocialLoading === 'Google' && { opacity: 0.7 }]}
                onPress={handleGoogleLogin}
                disabled={!!isSocialLoading}
              >
                {isSocialLoading === 'Google' ? (
                  <ActivityIndicator size="small" color="#4285F4" />
                ) : (
                  <>
                    <View style={styles.socialIconContainer}>
                      <Ionicons name="logo-google" size={20} color="#4285F4" />
                    </View>
                    <Typography variant="body" color={Colors.text} style={styles.socialText}>
                      Continue with Google
                    </Typography>
                  </>
                )}
              </Pressable>

              <Pressable
                style={[styles.socialButton, styles.appleButton, isSocialLoading === 'Apple' && { opacity: 0.7 }]}
                onPress={handleAppleLogin}
                disabled={!!isSocialLoading}
              >
                {isSocialLoading === 'Apple' ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <View style={styles.socialIconContainer}>
                      <Ionicons name="logo-apple" size={22} color={Colors.white} />
                    </View>
                    <Typography variant="body" color={Colors.white} style={styles.socialText}>
                      Continue with Apple
                    </Typography>
                  </>
                )}
              </Pressable>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Typography variant="caption" color={Colors.textMuted} style={styles.dividerText}>
                  OR
                </Typography>
                <View style={styles.dividerLine} />
              </View>

              {/* Email Input */}
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

              {/* Forgot Password Link */}
              <Pressable onPress={handleForgotPassword} style={styles.forgotContainer}>
                <Typography variant="caption" color={Colors.accent}>
                  Forgot password?
                </Typography>
              </Pressable>

              {/* Password Input */}
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
                    placeholder="Enter your password"
                    placeholderTextColor={Colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    returnKeyType="go"
                    onSubmitEditing={handleLogin}
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

              {/* Login Button */}
              <Pressable
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={Colors.text} />
                ) : (
                  <Typography variant="button" color={Colors.text}>
                    Login
                  </Typography>
                )}
              </Pressable>
            </Animated.View>

            {/* Sign Up Link */}
            <Animated.View
              style={styles.signupContainer}
              entering={FadeInDown.delay(700).duration(500)}
            >
              <Typography variant="body" color={Colors.textMuted}>
                Don't have an account?{' '}
              </Typography>
              <Pressable onPress={() => router.push('/auth/signup')}>
                <Typography variant="body" color={Colors.accent} style={styles.signupLink}>
                  Sign up
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
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.md,
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

  // Social Buttons
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md - 2,
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.overlayLight,
  },
  appleButton: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
    marginBottom: 0,
  },
  socialIconContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  socialText: {
    fontFamily: FontFamily.medium,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.overlayLight,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    fontFamily: FontFamily.semiBold,
    letterSpacing: 1,
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

  // Forgot Password
  forgotContainer: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.sm,
    marginTop: -Spacing.sm,
  },

  // Login Button
  loginButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    ...Shadows.sm,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },

  // Sign Up
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  signupLink: {
    fontFamily: FontFamily.semiBold,
  },
});
