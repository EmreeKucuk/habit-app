import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, ThemeColors } from '@/constants/theme';

export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeContextType {
  themePreference: ThemePreference;
  isDark: boolean;
  Colors: ThemeColors;
  setThemePreference: (pref: ThemePreference) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  themePreference: 'system',
  isDark: false,
  Colors: lightColors,
  setThemePreference: async () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
  const [systemTheme, setSystemTheme] = useState<ColorSchemeName>(Appearance.getColorScheme());

  useEffect(() => {
    // Load saved preference
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem('@habitflow_theme');
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setThemePreferenceState(saved);
        }
      } catch (e) {
        console.error('Failed to load theme preference', e);
      }
    };
    loadTheme();

    // Listen to system theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(colorScheme);
    });

    return () => subscription.remove();
  }, []);

  const setThemePreference = async (pref: ThemePreference) => {
    setThemePreferenceState(pref);
    try {
      await AsyncStorage.setItem('@habitflow_theme', pref);
    } catch (e) {
      console.error('Failed to save theme preference', e);
    }
  };

  const isDark = useMemo(() => {
    if (themePreference === 'system') {
      return systemTheme === 'dark';
    }
    return themePreference === 'dark';
  }, [themePreference, systemTheme]);

  const Colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ themePreference, isDark, Colors, setThemePreference }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
