/**
 * Root Layout — HabitFlow App
 * Loads Inter fonts, manages splash screen, and provides the root Stack navigator.
 * Navigation structure:
 *   - index (redirect based on auth/onboarding state)
 *   - onboarding/* (Stack group for onboarding flow)
 *   - auth/* (Stack group for login/signup)
 *   - (tabs)/* (Tab navigator for the main app)
 */

import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';


// Prevent splash screen from auto-hiding until fonts are loaded
SplashScreen.preventAutoHideAsync();

import { ThemeProvider, useTheme } from '@/context/ThemeContext';

function RootLayoutNav() {
  const { Colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'slide_from_right',
        }}
      >
        {/* Entry point — redirects based on state */}
        <Stack.Screen name="index" />

        {/* Onboarding flow (5 screens) */}
        <Stack.Screen
          name="onboarding"
          options={{ gestureEnabled: false }}
        />

        {/* Auth screens */}
        <Stack.Screen
          name="auth"
          options={{ gestureEnabled: false }}
        />

        {/* Main app tabs */}
        <Stack.Screen
          name="(tabs)"
          options={{ gestureEnabled: false }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}
