// Devine-Devs/screens/driver/DriverProfileScreen.js
import React from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, StatusBar, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../AuthContext';
import { DRIVER } from '../../data/driverData';

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
  const { signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  // Header Component with Logo and Gradient
  const Header = () => (
    <>
      <StatusBar barStyle="light-content" backgroundColor={THEME.primaryDark} />
      <LinearGradient
        colors={[THEME.primary, THEME.primaryDark, THEME.primaryDarker]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Image 
                source={require('../../assets/BioLoop_Logo.png')} 
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>
            <View>
              <Text style={styles.appName}>BioLoop</Text>
              <Text style={styles.companyName}>Driver Portal</Text>
            </View>
          </View>
        </View>
        
        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>
              {DRIVER.name.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
          <Text style={styles.name}>{DRIVER.name}</Text>
          <Text style={styles.driverId}>Driver ID: {DRIVER.id}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color={THEME.star} />
            <Text style={styles.ratingText}> {DRIVER.rating} ({DRIVER.reviews} reviews)</Text>
          </View>
        </View>
      </LinearGradient>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
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
              <Text style={styles.statValue}>{DRIVER.litersTotal.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Litres Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIconWrap, { backgroundColor: THEME.primaryLight }]}>
                <Ionicons name="cube-outline" size={20} color={THEME.primary} />
              </View>
              <Text style={styles.statValue}>{DRIVER.collections}</Text>
              <Text style={styles.statLabel}>Collections</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIconWrap, { backgroundColor: THEME.primaryLight }]}>
                <Ionicons name="leaf-outline" size={20} color={THEME.primary} />
              </View>
              <Text style={styles.statValue}>{DRIVER.co2Saved}t</Text>
              <Text style={styles.statLabel}>CO₂ Saved</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Menu Sections */}
        <View style={styles.menuSection}>
          <MenuItem 
            icon="notifications-outline" 
            label="Notifications" 
            sublabel="Manage alerts"
            onPress={() => Alert.alert('Notifications', 'Coming soon')} 
          />
          <MenuItem 
            icon="car-outline" 
            label="Vehicle Info" 
            sublabel="Tank capacity & details"
            onPress={() => Alert.alert('Vehicle Info', 'Coming soon')} 
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: THEME.offWhite 
  },
  header: {
    paddingTop: 12,
    paddingBottom: 24,
  },
  headerContent: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: THEME.white,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: THEME.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  logoImage: {
    width: 41,
    height: 41,
    borderRadius: 20.5,
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.white,
  },
  companyName: {
    fontSize: 10,
    color: THEME.white,
    opacity: 0.9,
    marginTop: 1,
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
});