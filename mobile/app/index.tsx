/**
 * Entry Point — Redirects to the correct screen based on user state.
 * - If onboarding not completed → /onboarding/welcome
 * - If not logged in → /auth/login
 * - If logged in → /(tabs)
 */

import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/theme';

const ONBOARDING_KEY = '@habitflow_onboarding_complete';
const AUTH_TOKEN_KEY = '@habitflow_auth_token';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkUserState();
  }, []);

  const checkUserState = async () => {
    try {
      const [onboardingValue, tokenValue] = await Promise.all([
        AsyncStorage.getItem(ONBOARDING_KEY),
        AsyncStorage.getItem(AUTH_TOKEN_KEY),
      ]);

      setOnboardingDone(onboardingValue === 'true');
      setIsAuthenticated(!!tokenValue);
    } catch (error) {
      console.error('Error checking user state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  // Route based on state
  if (!onboardingDone) {
    return <Redirect href="/onboarding/welcome" />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
