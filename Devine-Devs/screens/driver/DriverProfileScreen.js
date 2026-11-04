// Devine-Devs/screens/driver/DriverProfileScreen.js
import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, StatusBar, Alert, Linking,
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
import CertificateCard from '../../src/components/CertificateCard';
import DocumentsCard from '../../src/components/DocumentsCard';

// Where a driver's "Help & Support" mail goes. Same address BioLoop sends
// its own transactional mail from (supabase/functions/send-email).
const SUPPORT_EMAIL = 'ngubanemzobanzi4@gmail.com';

// Theme colours (matching manufacturer)
const THEME = {
  primary: '#15643E',
  primaryDark: '#0F4D30',
  primaryDarker: '#0B3A24',
  primaryLight: '#E7F1EB',
  white: '#FFFFFF',
  offWhite: '#F6F8F7',
  text: '#122A1F',
  textSecondary: '#6B7F75',
  gray: '#A9B5AD',
  grayLight: '#E4EDE7',
  grayMid: '#A9B5AD',
  danger: '#DC2626',
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
  const { collector, stats, pickups } = useCollectorContext();

  // Litres from trips completed in the last 7 days and the change vs the 7
  // days before — derived from real pickup rows, not a stored figure.
  const weekly = useMemo(() => {
    const now = Date.now();
    const week = 7 * 24 * 60 * 60 * 1000;
    const litresOf = (p) => Number(p.actual_volume_liters ?? p.estimated_volume_liters ?? 0);
    const completedAt = (p) => new Date(p.completed_at ?? p.updated_at ?? p.pickup_date ?? 0).getTime();
    const done = (pickups || []).filter((p) => p.status === 'completed');
    const thisWeek = done.filter((p) => now - completedAt(p) < week);
    const lastWeek = done.filter((p) => { const age = now - completedAt(p); return age >= week && age < 2 * week; });
    const thisL = thisWeek.reduce((s, p) => s + litresOf(p), 0);
    const lastL = lastWeek.reduce((s, p) => s + litresOf(p), 0);
    const change = lastL > 0 ? Math.round(((thisL - lastL) / lastL) * 100) : thisL > 0 ? 100 : 0;
    return { liters: thisL, stops: thisWeek.length, change };
  }, [pickups]);

  const imageUrl = collector?.profile_image_url ?? profile?.profile_image_url;
  const vehicleLine = [collector?.vehicle_make, collector?.vehicle_model, collector?.vehicle_registration]
    .filter(Boolean)
    .join(' · ');
  const email = profile?.email ?? user?.email;
  const location = [profile?.city, profile?.province].filter(Boolean).join(', ');
  const coverageLine = [collector?.district, collector?.route_name].filter(Boolean).join(' · ');

  // What the row used to say was "Certifications", behind a "Coming soon"
  // alert. The compliance facts already exist on the collector record, so say
  // what is actually on file and send them to the form that fixes the gaps.
  const missingCompliance = [
    collector?.drivers_license_number ? null : 'license',
    collector?.vehicle_registration ? null : 'vehicle',
  ].filter(Boolean);

  const complianceLine = missingCompliance.length
    ? `Add your ${missingCompliance.join(' and ')}`
    : collector?.is_verified
      ? 'Verified · license and vehicle on file'
      : 'License and vehicle on file · awaiting review';

  const openSupportEmail = () => {
    const subject = `BioLoop driver support: ${collector?.employee_code ?? email ?? 'driver'}`;
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`).catch(() => {
      // No mail client set up. Give them the address rather than failing silently.
      Alert.alert('Help & Support', `Email us at ${SUPPORT_EMAIL} and we'll come back to you.`);
    });
  };

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
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
        <CertificateCard
          role="collector"
          ownerId={collector?.id}
          accountName={collector?.full_name}
          tint={THEME.primary}
          style={{ marginHorizontal: 16, marginTop: 16 }}
        />
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
              <Text style={styles.statValue}>{Number(stats?.total_liters ?? collector?.total_liters ?? 0).toLocaleString()}</Text>
              <Text style={styles.statLabel}>Litres total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIconWrap, { backgroundColor: THEME.primaryLight }]}>
                <Ionicons name="cube-outline" size={20} color={THEME.primary} />
              </View>
              <Text style={styles.statValue}>{stats?.total_collections ?? collector?.total_collections ?? 0}</Text>
              <Text style={styles.statLabel}>Collections</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIconWrap, { backgroundColor: THEME.primaryLight }]}>
                <Ionicons name="leaf-outline" size={20} color={THEME.primary} />
              </View>
              <Text style={styles.statValue}>{Math.round(Number(collector?.co2_saved_kg ?? 0))} kg</Text>
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
            sublabel="Pickups, payouts and trip changes"
            onPress={() => navigation.navigate('DriverAlerts')}
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
            sublabel={complianceLine}
            onPress={() => navigation.navigate('ProfileEdit')}
          />
          <MenuItem
            icon="help-circle-outline"
            label="Help & Support"
            sublabel={SUPPORT_EMAIL}
            onPress={openSupportEmail}
          />
        </View>

        {/* Weekly summary — a record of what this driver has done, which
            belongs with the rest of their record rather than greeting them
            on the screen they open to start work. */}
        <View style={styles.weeklyCard}>
          <LinearGradient
            colors={[THEME.primary + '15', THEME.primary + '05']}
            style={styles.weeklyGradient}
          >
            <View style={styles.weeklyLeft}>
              <View style={[styles.weeklyIconWrap, { backgroundColor: THEME.primaryLight }]}>
                <Ionicons name="bar-chart-outline" size={20} color={THEME.primary} />
              </View>
              <View>
                <Text style={styles.weeklyTitle}>This week</Text>
                <Text style={styles.weeklySub}>
                  {weekly.liters}L · {weekly.stops} {weekly.stops === 1 ? 'trip' : 'trips'}
                </Text>
              </View>
            </View>
            <Text style={styles.weeklyChange}>
              {weekly.change >= 0 ? '+' : ''}{weekly.change}%
            </Text>
          </LinearGradient>
        </View>

        {/* Documents live here rather than on the home screen: they are
            occasional downloads, not something the driver needs on arrival. */}
        <DocumentsCard
          role="collector"
          ownerId={collector?.id}
          accountName={collector?.full_name}
          tint={THEME.primary}
          style={styles.documentsBlock}
        />

        <View style={styles.menuSection}>
          <MenuItem
            icon="log-out-outline"
            label="Sign out"
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
  weeklyCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  weeklyGradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weeklyLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  weeklyIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  weeklyTitle: { fontSize: 14, fontWeight: '600', color: THEME.text },
  weeklySub: { fontSize: 12, color: THEME.textSecondary, marginTop: 2 },
  weeklyChange: { fontSize: 16, fontWeight: '700', color: THEME.primary },
  documentsBlock: {
    marginHorizontal: 16,
    marginTop: 16,
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