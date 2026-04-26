/**
 * Tabs Layout — Main app navigation with Home, Chat, and Profile tabs.
 * Uses HabitFlow brand colors and Ionicons for tab icons.
 */

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { Shadows, FontFamily } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

export default function TabLayout() {
  const { Colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.tabBarActive,
        tabBarInactiveTintColor: Colors.tabBarInactive,
        tabBarLabelStyle: {
          fontFamily: FontFamily.medium,
          fontSize: 12,
          marginTop: -2,
        },
        tabBarStyle: {
          backgroundColor: Colors.tabBarBackground,
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          ...Shadows.sm,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} color={color} focused={focused} overlayColor={Colors.overlayLight} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'} color={color} focused={focused} overlayColor={Colors.overlayLight} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'person' : 'person-outline'} color={color} focused={focused} overlayColor={Colors.overlayLight} />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({ name, color, focused, overlayColor }: { name: keyof typeof Ionicons.glyphMap; color: string; focused: boolean; overlayColor: string }) {
  return (
    <View style={[styles.iconContainer, focused && { backgroundColor: overlayColor }]}>
      <Ionicons name={name} size={22} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 40,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
