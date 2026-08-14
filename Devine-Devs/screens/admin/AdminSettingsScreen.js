// screens/admin/AdminSettingsScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../AuthContext';
import AdminHeader from '../../src/admin/components/AdminHeader';
import {
  ADMIN_COLORS,
  ADMIN_FONTS,
  ADMIN_SHADOWS,
  ADMIN_RADII,
  ADMIN_SPACING,
} from '../../src/admin/adminTheme';

export default function AdminSettingsScreen({ navigation }) {
  const { signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  const SettingsItem = ({ icon, title, subtitle, onPress, color = ADMIN_COLORS.primary }) => (
    <Pressable
      style={({ pressed }) => [styles.settingsItem, pressed && { opacity: 0.85 }]}
      onPress={onPress}
    >
      <View style={[styles.settingsIcon, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.settingsContent}>
        <Text style={styles.settingsTitle}>{title}</Text>
        {subtitle ? <Text style={styles.settingsSubtitle}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward-outline" size={18} color={ADMIN_COLORS.muted} />
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <AdminHeader title="Settings" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitial}>AD</Text>
          </View>
          <Text style={styles.profileName}>Admin User</Text>
          <Text style={styles.profileEmail}>admin@bioloop.co.za</Text>
          <View style={styles.profileBadge}>
            <Text style={styles.profileBadgeText}>Administrator</Text>
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <SettingsItem
            icon="person-outline"
            title="Profile Information"
            subtitle="Update your personal details"
            onPress={() => {}}
          />
          <SettingsItem
            icon="lock-closed-outline"
            title="Security"
            subtitle="Change password, 2FA"
            onPress={() => {}}
          />
          <SettingsItem
            icon="notifications-outline"
            title="Notifications"
            subtitle="Manage alert preferences"
            onPress={() => {}}
          />
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <SettingsItem
            icon="color-palette-outline"
            title="Theme"
            subtitle="Light / Dark mode"
            onPress={() => {}}
          />
          <SettingsItem
            icon="language-outline"
            title="Language"
            subtitle="English"
            onPress={() => {}}
          />
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Support</Text>
          <SettingsItem
            icon="help-circle-outline"
            title="Help Center"
            subtitle="FAQs and support"
            onPress={() => {}}
            color={ADMIN_COLORS.blue}
          />
          <SettingsItem
            icon="document-text-outline"
            title="Terms & Privacy"
            subtitle="Legal information"
            onPress={() => {}}
            color={ADMIN_COLORS.blue}
          />
        </View>

        <Pressable
          style={({ pressed }) => [styles.logoutButton, pressed && { opacity: 0.9 }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={ADMIN_COLORS.white} />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>

        <View style={styles.versionText}>
          <Text style={styles.version}>Version 2.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ADMIN_COLORS.page,
  },
  content: {
    paddingHorizontal: ADMIN_SPACING.screenPadding,
    paddingBottom: 24,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: ADMIN_COLORS.card,
    borderRadius: ADMIN_RADII.card,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    marginTop: 8,
    ...ADMIN_SHADOWS.card,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ADMIN_COLORS.paleGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: ADMIN_COLORS.primary,
  },
  profileInitial: {
    fontFamily: ADMIN_FONTS.extraBold,
    fontSize: 30,
    color: ADMIN_COLORS.primary,
  },
  profileName: {
    fontFamily: ADMIN_FONTS.bold,
    fontSize: 18,
    color: ADMIN_COLORS.ink,
    marginBottom: 4,
  },
  profileEmail: {
    fontFamily: ADMIN_FONTS.medium,
    fontSize: 13,
    color: ADMIN_COLORS.body,
    marginBottom: 8,
  },
  profileBadge: {
    backgroundColor: ADMIN_COLORS.paleGreen,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: ADMIN_RADII.pill,
  },
  profileBadgeText: {
    fontFamily: ADMIN_FONTS.semiBold,
    fontSize: 12,
    color: ADMIN_COLORS.primary,
  },
  settingsSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontFamily: ADMIN_FONTS.bold,
    fontSize: 12,
    color: ADMIN_COLORS.body,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ADMIN_COLORS.card,
    padding: 14,
    borderRadius: ADMIN_RADII.card,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    marginBottom: 8,
    ...ADMIN_SHADOWS.card,
  },
  settingsIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingsContent: {
    flex: 1,
  },
  settingsTitle: {
    fontFamily: ADMIN_FONTS.semiBold,
    fontSize: 14,
    color: ADMIN_COLORS.ink,
  },
  settingsSubtitle: {
    fontFamily: ADMIN_FONTS.medium,
    fontSize: 12,
    color: ADMIN_COLORS.body,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 26,
    borderRadius: ADMIN_RADII.pill,
    paddingVertical: 14,
    backgroundColor: ADMIN_COLORS.negative,
  },
  logoutText: {
    fontFamily: ADMIN_FONTS.bold,
    fontSize: 15,
    color: ADMIN_COLORS.white,
  },
  versionText: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  version: {
    fontFamily: ADMIN_FONTS.medium,
    fontSize: 12,
    color: ADMIN_COLORS.muted,
  },
});
