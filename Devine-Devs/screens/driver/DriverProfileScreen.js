// Devine-Devs/screens/driver/DriverProfileScreen.js
import React from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, StatusBar, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../AuthContext';
import { useCollectorContext } from '../../src/contexts/CollectorContext';
import { useProfile } from '../../src/hooks/useProfile';
import ProfileAvatar from '../../src/components/profile/ProfileAvatar';
import VerifiedBadge from '../../src/components/profile/VerifiedBadge';

// Theme colours (matching manufacturer)
const THEME = {
  primary: '#10b981',
  primaryDark: '#059669',
  primaryDarker: '#047857',
  primaryLight: '#D1FAE5',
  white: '#FFFFFF',
  offWhite: '#F9FAFB',
  text: '#111827',
  textSecondary: '#6B7280',
  gray: '#9CA3AF',
  grayLight: '#E5E7EB',
  grayMid: '#9CA3AF',
  danger: '#EF4444',
  dangerBg: '#FEE2E2',
  star: '#F59E0B',
};

const MenuItem = ({ icon, label, sublabel, onPress, danger }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
      <Ionicons name={icon} size={20} color={danger ? THEME.danger : THEME.primary} />
    </View>
    <View style={styles.menuContent}>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      {sublabel ? <Text style={styles.menuSublabel}>{sublabel}</Text> : null}
    </View>
    <Ionicons name="chevron-forward" size={18} color={THEME.grayMid} />
  </TouchableOpacity>
);

export default function DriverProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { signOut, user } = useAuth();
  const { profile } = useProfile();
  const { collector, stats } = useCollectorContext();

  const imageUrl = collector?.profile_image_url ?? profile?.profile_image_url;
  const vehicleLine = [collector?.vehicle_make, collector?.vehicle_model, collector?.vehicle_registration]
    .filter(Boolean)
    .join(' · ');
  const email = profile?.email ?? user?.email;
  const location = [profile?.city, profile?.province].filter(Boolean).join(', ');
  const coverageLine = [collector?.district, collector?.route_name].filter(Boolean).join(' · ');

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  // Header Component with Gradient (no logo)
  const Header = () => (
    <>
      <StatusBar barStyle="light-content" backgroundColor={THEME.primaryDark} />
      <LinearGradient
        colors={[THEME.primary, THEME.primaryDark, THEME.primaryDarker]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        {/* Profile Info */}
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
            <Ionicons name="star" size={14} color={THEME.star} />
            <Text style={styles.ratingText}> {stats?.rating ?? '—'} ({stats?.reviews_count ?? '—'} reviews)</Text>
          </View>
        </View>
      </LinearGradient>
    </>
  );

  return (
    <View style={styles.container}>
      <Header />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stats Card */}
        <View style={styles.statsCard}>
          <LinearGradient
            colors={[THEME.white, THEME.white]}
            style={styles.statsGradient}
          >
            <View style={styles.statItem}>
              <View style={[styles.statIconWrap, { backgroundColor: THEME.primaryLight }]}>
                <Ionicons name="water-outline" size={20} color={THEME.primary} />
              </View>
              <Text style={styles.statValue}>{(stats?.litersTotal ?? stats?.total_liters ?? 0).toLocaleString()}</Text>
              <Text style={styles.statLabel}>Litres Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIconWrap, { backgroundColor: THEME.primaryLight }]}>
                <Ionicons name="cube-outline" size={20} color={THEME.primary} />
              </View>
              <Text style={styles.statValue}>{stats?.total_collections ?? stats?.collections ?? 0}</Text>
              <Text style={styles.statLabel}>Collections</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIconWrap, { backgroundColor: THEME.primaryLight }]}>
                <Ionicons name="leaf-outline" size={20} color={THEME.primary} />
              </View>
              <Text style={styles.statValue}>{(stats?.co2Saved || stats?.co2_saved_kg || 0)}t</Text>
              <Text style={styles.statLabel}>CO₂ Saved</Text>
            </View>
          </LinearGradient>
        </View>

        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('ProfileEdit')}
        >
          <Ionicons name="create-outline" size={18} color="#fff" />
          <Text style={styles.editBtnText}>Edit profile</Text>
        </TouchableOpacity>

        {/* Contact — from the base profile fields collected in Edit profile */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Contact</Text>
          {profile?.phone ? (
            <View style={styles.detailRow}>
              <Ionicons name="call-outline" size={18} color={THEME.primary} />
              <Text style={styles.detailText}>{profile.phone}</Text>
            </View>
          ) : null}
          {email ? (
            <View style={styles.detailRow}>
              <Ionicons name="mail-outline" size={18} color={THEME.primary} />
              <Text style={styles.detailText}>{email}</Text>
            </View>
          ) : null}
          {location ? (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={18} color={THEME.primary} />
              <Text style={styles.detailText}>{location}</Text>
            </View>
          ) : null}
          {!profile?.phone && !email && !location ? (
            <Text style={styles.emptyDetailText}>Add your phone and location in Edit profile.</Text>
          ) : null}
        </View>

        {/* Vehicle, licensing & coverage — from the collector-specific fields
            collected in Edit profile, so nothing typed in there goes unseen. */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Vehicle & experience</Text>
          {vehicleLine ? (
            <View style={styles.detailRow}>
              <Ionicons name="car-outline" size={18} color={THEME.primary} />
              <Text style={styles.detailText}>{vehicleLine}</Text>
            </View>
          ) : null}
          {collector?.vehicle_type ? (
            <View style={styles.detailRow}>
              <Ionicons name="speedometer-outline" size={18} color={THEME.primary} />
              <Text style={styles.detailText}>{collector.vehicle_type}</Text>
            </View>
          ) : null}
          {collector?.drivers_license_number ? (
            <View style={styles.detailRow}>
              <Ionicons name="card-outline" size={18} color={THEME.primary} />
              <Text style={styles.detailText}>License {collector.drivers_license_number}</Text>
            </View>
          ) : null}
          {collector?.years_experience != null ? (
            <View style={styles.detailRow}>
              <Ionicons name="ribbon-outline" size={18} color={THEME.primary} />
              <Text style={styles.detailText}>{collector.years_experience} years experience</Text>
            </View>
          ) : null}
          {collector?.languages ? (
            <View style={styles.detailRow}>
              <Ionicons name="language-outline" size={18} color={THEME.primary} />
              <Text style={styles.detailText}>{collector.languages}</Text>
            </View>
          ) : null}
          {coverageLine ? (
            <View style={styles.detailRow}>
              <Ionicons name="map-outline" size={18} color={THEME.primary} />
              <Text style={styles.detailText}>{coverageLine}</Text>
            </View>
          ) : null}
          {collector?.bio ? (
            <Text style={styles.bioText}>{collector.bio}</Text>
          ) : null}
          {!vehicleLine &&
          !collector?.vehicle_type &&
          !collector?.drivers_license_number &&
          collector?.years_experience == null &&
          !collector?.languages &&
          !coverageLine &&
          !collector?.bio ? (
            <Text style={styles.emptyDetailText}>Add your vehicle and license details in Edit profile.</Text>
          ) : null}
        </View>

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
            sublabel={vehicleLine || 'Add your vehicle details'}
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
          />
        </View>

        <View style={styles.menuSection}>
          <MenuItem 
            icon="log-out-outline" 
            label="Sign Out" 
            danger 
            onPress={handleSignOut} 
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
    backgroundColor: THEME.offWhite 
  },
  header: {
    paddingBottom: 24,
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: 8,
  },
  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: { 
    fontSize: 28, 
    fontWeight: '700', 
    color: THEME.white, 
    letterSpacing: 1 
  },
  name: { 
    fontSize: 22, 
    fontWeight: '700', 
    color: THEME.white 
  },
  driverId: { 
    fontSize: 13, 
    color: 'rgba(255,255,255,0.8)', 
    marginTop: 4 
  },
  ratingRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 8 
  },
  ratingText: { 
    fontSize: 13, 
    color: 'rgba(255,255,255,0.9)', 
    fontWeight: '500' 
  },
  statsCard: {
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 4,
  },
  statsGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: { 
    flex: 1, 
    alignItems: 'center', 
    gap: 8 
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: THEME.text 
  },
  statLabel: { 
    fontSize: 11, 
    color: THEME.gray, 
    textAlign: 'center' 
  },
  statDivider: { 
    width: 1, 
    height: 50, 
    backgroundColor: THEME.grayLight 
  },
  menuSection: {
    backgroundColor: THEME.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.grayLight,
    gap: 14,
  },
  menuIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: THEME.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconDanger: { 
    backgroundColor: THEME.dangerBg 
  },
  menuContent: { 
    flex: 1 
  },
  menuLabel: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: THEME.text 
  },
  menuLabelDanger: { 
    color: THEME.danger 
  },
  menuSublabel: { 
    fontSize: 12, 
    color: THEME.textSecondary, 
    marginTop: 2 
  },
  version: { 
    textAlign: 'center', 
    color: THEME.gray, 
    fontSize: 12, 
    marginTop: 24 
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: THEME.primary,
    borderRadius: 12,
    paddingVertical: 12,
  },
  editBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.textSecondary,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: THEME.grayLight,
  },
  detailText: { flex: 1, fontSize: 14, color: THEME.text },
  emptyDetailText: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 13,
    color: THEME.textSecondary,
    fontStyle: 'italic',
  },
  bioText: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 13,
    color: THEME.textSecondary,
    lineHeight: 20,
  },
});