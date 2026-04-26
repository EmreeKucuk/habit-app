/**
 * Profile Tab — User Profile & Settings
 * Displays user info, account settings, and app preferences.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import { Spacing, Radius, Shadows, FontFamily, FontSize } from '@/constants/theme';
import { useTheme, ThemePreference } from '@/context/ThemeContext';
import { API_ENDPOINTS } from '@/constants/api';
import api, { clearAuthTokens } from '@/services/api';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  xp: number;
  level: number;
  avatar_color: string;
  avatar_icon?: string;
}

export default function ProfileScreen() {
  const { Colors, isDark, themePreference, setThemePreference } = useTheme();
  const styles = React.useMemo(() => createStyles(Colors), [Colors]);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);

  // Entrance animations
  const avatarScale = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    avatarScale.value = withDelay(100, withSpring(1, { damping: 12 }));
    contentOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
    loadProfile();
  }, []);

  const avatarAnim = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));

  const contentAnim = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const loadProfile = async () => {
    try {
      const { data, error } = await api.get<{ user: UserProfile }>(API_ENDPOINTS.me);
      if (data?.user) {
        setProfile(data.user);
      } else {
        // Fallback: use stored onboarding name
        const name = await AsyncStorage.getItem('@habitflow_user_name');
        setProfile({
          id: '',
          username: name || 'User',
          email: '',
          xp: 0,
          level: 1,
          avatar_color: Colors.card,
        });
      }
    } catch (error) {
      console.log('Failed to load profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await clearAuthTokens();
          await AsyncStorage.removeItem('@habitflow_onboarding_complete');
          router.replace('/auth/login');
        },
      },
    ]);
  };

  const getInitials = () => {
    if (profile?.first_name) {
      return (
        (profile.first_name[0] || '') + (profile.last_name?.[0] || '')
      ).toUpperCase();
    }
    return profile?.username?.[0]?.toUpperCase() || '?';
  };

  // XP progress to next level (100 XP per level)
  const xpForLevel = 100;
  const currentXp = (profile?.xp || 0) % xpForLevel;
  const xpProgress = currentXp / xpForLevel;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Typography variant="h2" style={styles.header}>
          Profile
        </Typography>

        {/* ─── Avatar & User Info ─── */}
        <View style={styles.profileSection}>
          <Animated.View style={[styles.avatarContainer, avatarAnim]}>
            <View style={[styles.avatar, { backgroundColor: profile?.avatar_color || Colors.card }]}>
              <Typography variant="h1" color={Colors.white}>
                {getInitials()}
              </Typography>
            </View>
            {/* Level badge */}
            <View style={styles.levelBadge}>
              <Typography variant="caption" color={Colors.white} style={styles.levelText}>
                Lv.{profile?.level || 1}
              </Typography>
            </View>
          </Animated.View>

          <Animated.View style={contentAnim}>
            <Typography variant="h2" align="center" style={styles.username}>
              {profile?.first_name
                ? `${profile.first_name} ${profile.last_name || ''}`.trim()
                : profile?.username || 'User'}
            </Typography>
            <Typography variant="bodySmall" align="center" color={Colors.textMuted}>
              @{profile?.username || 'user'}
            </Typography>

            {/* XP Bar */}
            <View style={styles.xpSection}>
              <View style={styles.xpLabelRow}>
                <Typography variant="caption" color={Colors.textMuted}>
                  {currentXp} / {xpForLevel} XP
                </Typography>
                <Typography variant="caption" color={Colors.accent}>
                  Level {(profile?.level || 1) + 1} →
                </Typography>
              </View>
              <View style={styles.xpBarBg}>
                <Animated.View
                  style={[
                    styles.xpBarFill,
                    { width: `${Math.min(xpProgress * 100, 100)}%` },
                  ]}
                />
              </View>
            </View>
          </Animated.View>
        </View>

        {/* ─── Account Settings ─── */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(500)}
        >
          <Typography variant="label" color={Colors.textMuted} style={styles.sectionLabel}>
            ACCOUNT
          </Typography>
          <View style={styles.settingsCard}>
            <SettingsRow
              icon="person-outline"
              label="Edit Profile"
              onPress={() => setEditModalVisible(true)}
              Colors={Colors}
            />
            <SettingsRow
              icon="lock-closed-outline"
              label="Change Password"
              onPress={() => setPasswordModalVisible(true)}
              Colors={Colors}
            />
            <SettingsRow
              icon="mail-outline"
              label="Email"
              value={profile?.email || 'Not set'}
              disabled
              Colors={Colors}
            />
          </View>
        </Animated.View>

        {/* ─── App Settings ─── */}
        <Animated.View
          entering={FadeInDown.delay(550).duration(500)}
        >
          <Typography variant="label" color={Colors.textMuted} style={styles.sectionLabel}>
            APP
          </Typography>
          <View style={styles.settingsCard}>
            <SettingsRow
              icon="notifications-outline"
              label="Notifications"
              value="Coming soon"
              disabled
              Colors={Colors}
            />
            <SettingsRow
              icon="color-palette-outline"
              label="Appearance"
              value={themePreference.charAt(0).toUpperCase() + themePreference.slice(1)}
              onPress={() => setThemeModalVisible(true)}
              Colors={Colors}
            />
            <SettingsRow
              icon="information-circle-outline"
              label="About HabitFlow"
              value="v1.0.0"
              disabled
              Colors={Colors}
            />
          </View>
        </Animated.View>

        {/* ─── Logout ─── */}
        <Animated.View
          entering={FadeInDown.delay(700).duration(500)}
          style={styles.logoutSection}
        >
          <Button
            title="Log Out"
            onPress={handleLogout}
            variant="outline"
            size="lg"
            fullWidth
          />
        </Animated.View>
      </ScrollView>

      {/* ─── Edit Profile Modal ─── */}
      <EditProfileModal
        visible={editModalVisible}
        profile={profile}
        onClose={() => setEditModalVisible(false)}
        onSave={(updatedProfile) => {
          setProfile((prev) => prev ? { ...prev, ...updatedProfile } : prev);
          setEditModalVisible(false);
        }}
        Colors={Colors}
        styles={styles}
      />

      {/* ─── Change Password Modal ─── */}
      <ChangePasswordModal
        visible={passwordModalVisible}
        email={profile?.email || ''}
        onClose={() => setPasswordModalVisible(false)}
        Colors={Colors}
        styles={styles}
      />

      {/* ─── Theme Selection Modal ─── */}
      <ThemeSelectionModal
        visible={themeModalVisible}
        currentTheme={themePreference}
        onClose={() => setThemeModalVisible(false)}
        onSelect={(pref) => {
          setThemePreference(pref);
          setThemeModalVisible(false);
        }}
        Colors={Colors}
        styles={styles}
      />
    </SafeAreaView>
  );
}

// ─── Theme Selection Modal ──────────────────────────────────────

function ThemeSelectionModal({
  visible,
  currentTheme,
  onClose,
  onSelect,
  Colors,
  styles,
}: {
  visible: boolean;
  currentTheme: ThemePreference;
  onClose: () => void;
  onSelect: (pref: ThemePreference) => void;
  Colors: any;
  styles: any;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Typography variant="h3" color={Colors.text}>Appearance</Typography>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </Pressable>
          </View>

          <View style={styles.modalInputGroup}>
            {[
              { id: 'system', label: 'System Default', icon: 'phone-portrait-outline' },
              { id: 'light', label: 'Light Mode', icon: 'sunny-outline' },
              { id: 'dark', label: 'Dark Mode', icon: 'moon-outline' },
            ].map((option) => (
              <Pressable
                key={option.id}
                style={[
                  styles.settingsRow,
                  { borderBottomWidth: 0, paddingVertical: Spacing.sm, borderRadius: Radius.md },
                  currentTheme === option.id && { backgroundColor: Colors.overlayLight },
                ]}
                onPress={() => onSelect(option.id as ThemePreference)}
              >
                <View style={styles.settingsRowLeft}>
                  <Ionicons name={option.icon as any} size={20} color={currentTheme === option.id ? Colors.accent : Colors.text} />
                  <Typography variant="body" color={currentTheme === option.id ? Colors.accent : Colors.text}>
                    {option.label}
                  </Typography>
                </View>
                {currentTheme === option.id && (
                  <Ionicons name="checkmark" size={20} color={Colors.accent} />
                )}
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Settings Row Component ─────────────────────────────────────

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  disabled,
  Colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  disabled?: boolean;
  Colors: any;
}) {
  return (
    <Pressable
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.overlayLight,
      }}
      onPress={onPress}
      disabled={disabled || !onPress}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
        <View style={{
          width: 36, height: 36, borderRadius: 18,
          backgroundColor: Colors.overlayLight,
          justifyContent: 'center', alignItems: 'center',
        }}>
          <Ionicons name={icon} size={20} color={Colors.text} />
        </View>
        <Typography variant="body" color={Colors.text}>
          {label}
        </Typography>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
        {value && (
          <Typography variant="bodySmall" color={Colors.textMuted}>
            {value}
          </Typography>
        )}
        {onPress && !disabled && (
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        )}
      </View>
    </Pressable>
  );
}

// ─── Edit Profile Modal ─────────────────────────────────────────

function EditProfileModal({
  visible,
  profile,
  onClose,
  onSave,
  Colors,
  styles,
}: {
  visible: boolean;
  profile: UserProfile | null;
  onClose: () => void;
  onSave: (data: Partial<UserProfile>) => void;
  Colors: any;
  styles: any;
}) {
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setBio(profile.bio || '');
    }
  }, [visible, profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data, error } = await api.put(API_ENDPOINTS.updateProfile, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        bio: bio.trim(),
      });

      if (error) {
        Alert.alert('Error', error);
      } else {
        onSave({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          bio: bio.trim(),
        });
        Alert.alert('Success', 'Profile updated!');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Typography variant="h3">Edit Profile</Typography>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </Pressable>
          </View>

          <View style={styles.modalInputGroup}>
            <Typography variant="label" color={Colors.textMuted}>First Name</Typography>
            <TextInput
              style={styles.modalInput}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter first name"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <View style={styles.modalInputGroup}>
            <Typography variant="label" color={Colors.textMuted}>Last Name</Typography>
            <TextInput
              style={styles.modalInput}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter last name"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <View style={styles.modalInputGroup}>
            <Typography variant="label" color={Colors.textMuted}>Bio</Typography>
            <TextInput
              style={[styles.modalInput, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself"
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={500}
            />
          </View>

          <Button
            title="Save Changes"
            onPress={handleSave}
            variant="primary"
            size="lg"
            fullWidth
            loading={saving}
          />
        </View>
      </View>
    </Modal>
  );
}

// ─── Change Password Modal ──────────────────────────────────────

function ChangePasswordModal({
  visible,
  email,
  onClose,
  Colors,
  styles,
}: {
  visible: boolean;
  email: string;
  onClose: () => void;
  Colors: any;
  styles: any;
}) {
  const handleSendReset = async () => {
    if (!email) {
      Alert.alert('No Email', 'No email address found for your account.');
      onClose();
      return;
    }

    const { error } = await api.post(API_ENDPOINTS.forgotPassword, { email });
    Alert.alert(
      'Reset Link Sent',
      'Check your email for a password reset link.',
      [{ text: 'OK', onPress: onClose }],
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Typography variant="h3">Change Password</Typography>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </Pressable>
          </View>

          <View style={styles.passwordInfoSection}>
            <View style={styles.passwordIconCircle}>
              <Ionicons name="mail-outline" size={32} color={Colors.accent} />
            </View>
            <Typography variant="body" align="center" color={Colors.textLight} style={{ marginTop: Spacing.md }}>
              We'll send a password reset link to your email address:
            </Typography>
            <Typography variant="body" align="center" color={Colors.text} style={{ marginTop: Spacing.sm, fontFamily: FontFamily.semiBold }}>
              {email || 'No email set'}
            </Typography>
          </View>

          <Button
            title="Send Reset Link"
            onPress={handleSendReset}
            variant="primary"
            size="lg"
            fullWidth
          />
          <View style={{ height: Spacing.sm }} />
          <Button
            title="Cancel"
            onPress={onClose}
            variant="ghost"
            size="md"
            fullWidth
          />
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ─────────────────────────────────────────────────────

const createStyles = (Colors: any) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    paddingTop: Spacing.md,
    marginBottom: Spacing.lg,
  },

  // Profile Section
  profileSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    ...Shadows.sm,
  },
  levelText: {
    fontFamily: FontFamily.bold,
  },
  username: {
    marginBottom: 2,
  },

  // XP Bar
  xpSection: {
    width: '100%',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  xpLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  xpBarBg: {
    height: 8,
    backgroundColor: Colors.overlayLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 4,
  },

  // Section Labels
  sectionLabel: {
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    paddingLeft: Spacing.xs,
    fontFamily: FontFamily.semiBold,
  },

  // Settings Card
  settingsCard: {
    backgroundColor: Colors.cardLight,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.overlayLight,
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  settingsRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  settingsIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.overlayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Logout
  logoutSection: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.cardLight,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalInputGroup: {
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md - 2,
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: Colors.text,
    borderWidth: 1.5,
    borderColor: Colors.overlayLight,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  passwordInfoSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  passwordIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.overlayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
