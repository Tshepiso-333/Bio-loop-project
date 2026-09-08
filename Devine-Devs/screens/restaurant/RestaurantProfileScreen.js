import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../AuthContext';
import { useProfile } from '../../src/hooks/useProfile';
import { useRestaurant } from '../../src/hooks/useRestaurant';
import ProfileAvatar from '../../src/components/profile/ProfileAvatar';
import VerifiedBadge from '../../src/components/profile/VerifiedBadge';
import {
  REST_COLORS,
  REST_FONTS,
  REST_RADII,
  REST_SHADOWS,
} from '../../src/restaurant/restaurantTheme';

function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={REST_COLORS.primary} />
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
      <StatusBar barStyle="dark-content" backgroundColor={REST_COLORS.page} />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <ProfileAvatar name={displayName} imageUrl={imageUrl} size={84} />
        <Text style={styles.name}>{displayName}</Text>
        {restaurant?.owner_name ? (
          <Text style={styles.subtitle}>Owner: {restaurant.owner_name}</Text>
        ) : null}
        <VerifiedBadge isVerified={restaurant?.is_verified} style={styles.verified} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('ProfileEdit')}
        >
          <Ionicons name="create-outline" size={18} color={REST_COLORS.white} />
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
          <Ionicons name="log-out-outline" size={18} color={REST_COLORS.negative} />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: REST_COLORS.page },
  header: {
    alignItems: 'center',
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: REST_COLORS.page,
    borderBottomWidth: 1,
    borderBottomColor: REST_COLORS.border,
  },
  name: {
    marginTop: 12,
    fontSize: 22,
    fontFamily: REST_FONTS.extraBold,
    color: REST_COLORS.ink,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: REST_FONTS.medium,
    color: REST_COLORS.body,
  },
  verified: { marginTop: 10 },
  content: { padding: 16, paddingBottom: 32 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: REST_COLORS.primary,
    borderRadius: REST_RADII.pill,
    paddingVertical: 14,
    marginBottom: 12,
    ...REST_SHADOWS.button,
  },
  editBtnText: { color: REST_COLORS.white, fontFamily: REST_FONTS.bold, fontSize: 15 },
  card: {
    backgroundColor: REST_COLORS.card,
    borderRadius: REST_RADII.card,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: REST_COLORS.border,
    ...REST_SHADOWS.card,
  },
  cardTitle: { fontSize: 16, fontFamily: REST_FONTS.bold, color: REST_COLORS.ink, marginBottom: 12 },
  infoRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 12, fontFamily: REST_FONTS.semiBold, color: REST_COLORS.muted },
  infoValue: {
    marginTop: 2,
    fontSize: 14,
    fontFamily: REST_FONTS.medium,
    color: REST_COLORS.ink,
    lineHeight: 20,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 4,
  },
  signOutText: { color: REST_COLORS.negative, fontFamily: REST_FONTS.semiBold, fontSize: 15 },
});
