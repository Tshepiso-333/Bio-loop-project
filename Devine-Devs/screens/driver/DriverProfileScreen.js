// Devine-Devs/screens/driver/DriverProfileScreen.js
import React from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  Pressable, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../AuthContext';
import { useCollectorContext } from '../../src/contexts/CollectorContext';
import { useProfile } from '../../src/hooks/useProfile';
import ProfileAvatar from '../../src/components/profile/ProfileAvatar';
import VerifiedBadge from '../../src/components/profile/VerifiedBadge';
import DriverHeader from '../../src/driver/components/DriverHeader';
import {
  DRV_COLORS,
  DRV_FONTS,
  DRV_RADII,
  DRV_SHADOWS,
  DRV_SPACING,
} from '../../src/driver/driverTheme';

const MenuItem = ({ icon, label, sublabel, onPress, danger, last }) => (
  <Pressable
    style={({ pressed }) => [
      styles.menuItem,
      last && styles.menuItemLast,
      pressed && { opacity: 0.85 },
    ]}
    onPress={onPress}
  >
    <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
      <Ionicons name={icon} size={20} color={danger ? DRV_COLORS.negative : DRV_COLORS.primary} />
    </View>
    <View style={styles.menuContent}>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      {sublabel ? <Text style={styles.menuSublabel}>{sublabel}</Text> : null}
    </View>
    <Ionicons name="chevron-forward" size={18} color={DRV_COLORS.muted} />
  </Pressable>
);

export default function DriverProfileScreen() {
  const navigation = useNavigation();
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const { collector, stats } = useCollectorContext();

  const imageUrl = collector?.profile_image_url ?? profile?.profile_image_url;
  const vehicleLine = [collector?.vehicle_make, collector?.vehicle_model, collector?.vehicle_registration]
    .filter(Boolean)
    .join(' · ');

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <View style={styles.container}>
      <DriverHeader title="Profile" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile hero — on the page background, so the forest-green avatar and
            verified badge read correctly instead of sitting on a teal banner. */}
        <View style={styles.profileInfo}>
          <ProfileAvatar
            name={collector?.full_name ?? profile?.full_name}
            imageUrl={imageUrl}
            size={80}
          />
          <Text style={styles.name}>{collector?.full_name ?? profile?.full_name ?? 'Driver'}</Text>
          <Text style={styles.driverId}>Driver ID: {collector?.employee_code ?? ''}</Text>
          <VerifiedBadge isVerified={collector?.is_verified} style={{ marginTop: 8 }} />
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color={DRV_COLORS.amber} />
            <Text style={styles.ratingText}> {stats?.rating ?? '—'} ({stats?.reviews_count ?? '—'} reviews)</Text>
          </View>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <View style={styles.statIconWrap}>
              <Ionicons name="water-outline" size={20} color={DRV_COLORS.primary} />
            </View>
            <Text style={styles.statValue}>{(stats?.litersTotal ?? stats?.total_liters ?? 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Litres Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={styles.statIconWrap}>
              <Ionicons name="cube-outline" size={20} color={DRV_COLORS.primary} />
            </View>
            <Text style={styles.statValue}>{stats?.total_collections ?? stats?.collections ?? 0}</Text>
            <Text style={styles.statLabel}>Collections</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={styles.statIconWrap}>
              <Ionicons name="leaf-outline" size={20} color={DRV_COLORS.primary} />
            </View>
            <Text style={styles.statValue}>{(stats?.co2Saved || stats?.co2_saved_kg || 0)}t</Text>
            <Text style={styles.statLabel}>CO₂ Saved</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.85 }]}
          onPress={() => navigation.navigate('ProfileEdit')}
        >
          <Ionicons name="create-outline" size={18} color={DRV_COLORS.white} />
          <Text style={styles.editBtnText}>Edit profile</Text>
        </Pressable>

        {(vehicleLine || collector?.years_experience || collector?.languages) ? (
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>Vehicle & experience</Text>
            {vehicleLine ? (
              <View style={styles.detailRow}>
                <Ionicons name="car-outline" size={18} color={DRV_COLORS.primary} />
                <Text style={styles.detailText}>{vehicleLine}</Text>
              </View>
            ) : null}
            {collector?.vehicle_type ? (
              <View style={styles.detailRow}>
                <Ionicons name="speedometer-outline" size={18} color={DRV_COLORS.primary} />
                <Text style={styles.detailText}>{collector.vehicle_type}</Text>
              </View>
            ) : null}
            {collector?.years_experience != null ? (
              <View style={styles.detailRow}>
                <Ionicons name="ribbon-outline" size={18} color={DRV_COLORS.primary} />
                <Text style={styles.detailText}>{collector.years_experience} years experience</Text>
              </View>
            ) : null}
            {collector?.languages ? (
              <View style={styles.detailRow}>
                <Ionicons name="language-outline" size={18} color={DRV_COLORS.primary} />
                <Text style={styles.detailText}>{collector.languages}</Text>
              </View>
            ) : null}
            {collector?.bio ? (
              <Text style={styles.bioText}>{collector.bio}</Text>
            ) : null}
          </View>
        ) : null}

        {/* Menu Sections */}
        <View style={styles.menuSection}>
          <MenuItem
            icon="create-outline"
            label="Edit profile"
            sublabel="Update vehicle, license, bio"
            onPress={() => navigation.navigate('ProfileEdit')}
          />
          <MenuItem
            icon="notifications-outline"
            label="Notifications"
            sublabel="Manage alerts"
            onPress={() => Alert.alert('Notifications', 'Coming soon')}
          />
          <MenuItem
            icon="car-outline"
            label="Vehicle Info"
            sublabel={vehicleLine || 'Tank capacity & details'}
            onPress={() => navigation.navigate('ProfileEdit')}
          />
          <MenuItem
            icon="shield-checkmark-outline"
            label="Safety & Compliance"
            sublabel="Certifications"
            onPress={() => Alert.alert('Safety', 'Coming soon')}
          />
          <MenuItem
            icon="help-circle-outline"
            label="Help & Support"
            sublabel="FAQ, contact us"
            onPress={() => Alert.alert('Help', 'Coming soon')}
            last
          />
        </View>

        <View style={styles.menuSection}>
          <MenuItem
            icon="log-out-outline"
            label="Sign Out"
            danger
            onPress={handleSignOut}
            last
          />
        </View>

        <Text style={styles.version}>Version 2.0.0</Text>
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DRV_COLORS.page,
  },
  scrollContent: {
    paddingHorizontal: DRV_SPACING.screenPadding,
  },

  profileInfo: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 20,
  },
  name: {
    fontFamily: DRV_FONTS.extraBold,
    fontSize: 22,
    color: DRV_COLORS.ink,
    marginTop: 12,
  },
  driverId: {
    fontFamily: DRV_FONTS.medium,
    fontSize: 13,
    color: DRV_COLORS.body,
    marginTop: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingText: {
    fontFamily: DRV_FONTS.medium,
    fontSize: 13,
    color: DRV_COLORS.body,
  },

  // Negative overlap dropped: it existed to bridge the gradient banner. Against a
  // light header the hero sits on the page, so a normal gap reads better.
  statsCard: {
    backgroundColor: DRV_COLORS.card,
    borderRadius: DRV_RADII.card,
    borderWidth: 1,
    borderColor: DRV_COLORS.border,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    ...DRV_SHADOWS.card,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: DRV_COLORS.paleGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontFamily: DRV_FONTS.extraBold,
    fontSize: 18,
    color: DRV_COLORS.ink,
  },
  statLabel: {
    fontFamily: DRV_FONTS.medium,
    fontSize: 11,
    color: DRV_COLORS.body,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: DRV_COLORS.divider,
  },

  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: DRV_SPACING.gap,
    backgroundColor: DRV_COLORS.primary,
    borderRadius: DRV_RADII.pill,
    paddingVertical: 13,
    ...DRV_SHADOWS.button,
  },
  editBtnText: {
    fontFamily: DRV_FONTS.bold,
    fontSize: 14,
    color: DRV_COLORS.white,
  },

  menuSection: {
    backgroundColor: DRV_COLORS.card,
    marginTop: 16,
    borderRadius: DRV_RADII.card,
    borderWidth: 1,
    borderColor: DRV_COLORS.border,
    overflow: 'hidden',
    ...DRV_SHADOWS.card,
  },
  sectionTitle: {
    fontFamily: DRV_FONTS.semiBold,
    fontSize: 13,
    color: DRV_COLORS.body,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: DRV_COLORS.divider,
    gap: 14,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: DRV_COLORS.paleGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconDanger: {
    backgroundColor: DRV_COLORS.alertBg,
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontFamily: DRV_FONTS.bold,
    fontSize: 15,
    color: DRV_COLORS.ink,
  },
  menuLabelDanger: {
    color: DRV_COLORS.negative,
  },
  menuSublabel: {
    fontFamily: DRV_FONTS.medium,
    fontSize: 12,
    color: DRV_COLORS.body,
    marginTop: 2,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: DRV_COLORS.divider,
  },
  detailText: {
    flex: 1,
    fontFamily: DRV_FONTS.medium,
    fontSize: 14,
    color: DRV_COLORS.ink,
  },
  bioText: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: DRV_FONTS.medium,
    fontSize: 13,
    color: DRV_COLORS.body,
    lineHeight: 20,
  },

  version: {
    textAlign: 'center',
    fontFamily: DRV_FONTS.medium,
    color: DRV_COLORS.muted,
    fontSize: 12,
    marginTop: 24,
  },
});
