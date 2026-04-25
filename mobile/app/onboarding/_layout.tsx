/**
 * Onboarding Layout — Stack navigator for the 5-step onboarding flow.
 */

import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="name" />
      <Stack.Screen name="categories" />
      <Stack.Screen name="motivation" />
      <Stack.Screen name="transition" />
    </Stack>
  );
}
