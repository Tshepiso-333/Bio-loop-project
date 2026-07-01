import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../AuthContext';
import { useProfile } from '../../src/hooks/useProfile';
import { useRestaurant } from '../../src/hooks/useRestaurant';
import ProfileAvatar from '../../src/components/profile/ProfileAvatar';
import VerifiedBadge from '../../src/components/profile/VerifiedBadge';

const THEME = {
  primary: '#10b981',
  primaryDark: '#059669',
  bg: '#F9FAFB',
  card: '#FFFFFF',
  text: '#111827',
  muted: '#6B7280',
};

function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={THEME.primary} />
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function RestaurantProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const { restaurant } = useRestaurant();

  const displayName = restaurant?.name ?? profile?.full_name ?? 'Restaurant';
  const imageUrl = restaurant?.profile_image_url ?? profile?.profile_image_url;

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[THEME.primary, THEME.primaryDark]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <ProfileAvatar name={displayName} imageUrl={imageUrl} size={84} />
        <Text style={styles.name}>{displayName}</Text>
        {restaurant?.owner_name ? (
          <Text style={styles.subtitle}>Owner: {restaurant.owner_name}</Text>
        ) : null}
        <VerifiedBadge isVerified={restaurant?.is_verified} style={styles.verified} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('ProfileEdit')}
        >
          <Ionicons name="create-outline" size={18} color="#fff" />
          <Text style={styles.editBtnText}>Edit profile</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Business</Text>
          <InfoRow icon="storefront-outline" label="Business type" value={restaurant?.business_type} />
          <InfoRow icon="time-outline" label="Operating hours" value={restaurant?.operating_hours} />
          <InfoRow icon="water-outline" label="Est. monthly oil" value={
            restaurant?.estimated_monthly_oil_liters != null
              ? `${restaurant.estimated_monthly_oil_liters} L`
              : null
          } />
          <InfoRow icon="document-text-outline" label="Pickup instructions" value={restaurant?.pickup_instructions} />
          <InfoRow icon="location-outline" label="Address" value={restaurant?.address} />
          <InfoRow icon="globe-outline" label="Website" value={restaurant?.website_url} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account</Text>
          <InfoRow icon="mail-outline" label="Email" value={profile?.email} />
          <InfoRow icon="call-outline" label="Phone" value={profile?.phone} />
          <InfoRow icon="location-outline" label="City" value={
            profile?.city && profile?.province
              ? `${profile.city}, ${profile.province}`
              : profile?.city ?? profile?.province
          } />
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color="#DC2626" />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  header: { alignItems: 'center', paddingBottom: 24, paddingHorizontal: 20 },
  name: { marginTop: 12, fontSize: 22, fontWeight: '700', color: '#fff' },
  subtitle: { marginTop: 4, fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  verified: { marginTop: 10 },
  content: { padding: 16, paddingBottom: 32 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: THEME.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
  },
  editBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  card: {
    backgroundColor: THEME.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: THEME.text, marginBottom: 12 },
  infoRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 11, color: THEME.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
  infoValue: { marginTop: 2, fontSize: 14, color: THEME.text, lineHeight: 20 },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 4,
  },
  signOutText: { color: '#DC2626', fontWeight: '600', fontSize: 15 },
});
