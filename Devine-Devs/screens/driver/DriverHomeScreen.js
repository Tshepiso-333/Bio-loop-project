// Devine-Devs/screens/driver/DriverHomeScreen.js
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DRIVER, PICKUPS } from '../../data/driverData';

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
  pending: '#F59E0B',
  pendingBg: '#FEF3C7',
  inProgress: '#3B82F6',
  inProgressBg: '#DBEAFE',
  completed: '#10B981',
  completedBg: '#D1FAE5',
};

const StatusBadge = ({ status }) => {
  const config = {
    pending: { label: 'Pending', bg: THEME.pendingBg, color: THEME.pending },
    in_progress: { label: 'In Progress', bg: THEME.inProgressBg, color: THEME.inProgress },
    completed: { label: 'Completed', bg: THEME.completedBg, color: THEME.completed },
  };
  const { label, bg, color } = config[status] || config.pending;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
};

const PickupCard = ({ item, onPress }) => (
  <TouchableOpacity style={styles.pickupCard} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.pickupIcon}>
      <Ionicons name="storefront-outline" size={20} color={THEME.primary} />
    </View>
    <View style={styles.pickupInfo}>
      <Text style={styles.pickupName}>{item.name}</Text>
      <Text style={styles.pickupAddress}>{item.address}</Text>
      <Text style={styles.pickupTime}>{item.time} · {item.estimatedLiters}L est.</Text>
    </View>
    <View style={styles.pickupRight}>
      <StatusBadge status={item.status} />
      <Ionicons name="chevron-forward" size={16} color={THEME.gray} style={{ marginTop: 6 }} />
    </View>
  </TouchableOpacity>
);

export default function DriverHomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const todayPickups = PICKUPS.slice(0, 3);

  // Professional Header Component with Logo, Notifications, and Profile
  const Header = () => (
    <>
      <StatusBar barStyle="light-content" backgroundColor={THEME.primaryDark} />
      <LinearGradient
        colors={[THEME.primary, THEME.primaryDark, THEME.primaryDarker]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerContent}>
          {/* Left side - Logo */}
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
          
          {/* Right side - Notifications and Profile */}
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
            <View style={styles.profileCircle}>
              <Text style={styles.profileInitial}>
                {DRIVER.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </>
  );

  return (
    <View style={styles.container}>
      <Header />
      
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Good day,</Text>
          <Text style={styles.welcomeName}>{DRIVER.name}</Text>
          <Text style={styles.welcomeRoute}>{DRIVER.route} · {DRIVER.district}</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={[THEME.primary + '15', THEME.primary + '05']}
              style={styles.statGradient}
            >
              <View style={[styles.statIconWrap, { backgroundColor: THEME.primaryLight }]}>
                <Ionicons name="water-outline" size={22} color={THEME.primary} />
              </View>
              <Text style={styles.statValue}>{DRIVER.todayCollected} L</Text>
              <Text style={styles.statLabel}>Collected today</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.statCard}>
            <LinearGradient
              colors={[THEME.primary + '15', THEME.primary + '05']}
              style={styles.statGradient}
            >
              <View style={[styles.statIconWrap, { backgroundColor: THEME.primaryLight }]}>
                <Ionicons name="location-outline" size={22} color={THEME.primary} />
              </View>
              <Text style={styles.statValue}>{DRIVER.stopsCompleted}/{DRIVER.stopsTotal}</Text>
              <Text style={styles.statLabel}>Stops remaining</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Weekly Card */}
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
                <Text style={styles.weeklyTitle}>Weekly Total</Text>
                <Text style={styles.weeklySub}>{DRIVER.weeklyTotal}L · {DRIVER.weeklyStops} stops</Text>
              </View>
            </View>
            <Text style={styles.weeklyChange}>+{DRIVER.weeklyChange}%</Text>
          </LinearGradient>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Pickups</Text>
          <Text style={styles.sectionCount}>{PICKUPS.length} scheduled</Text>
        </View>

        {/* Pickup Cards */}
        {todayPickups.map(item => (
          <PickupCard
            key={item.id}
            item={item}
            onPress={() => navigation.navigate('DriverCollections')}
          />
        ))}

        {/* View All Button */}
        <TouchableOpacity
          style={styles.viewAllBtn}
          onPress={() => navigation.navigate('DriverCollections')}
        >
          <LinearGradient
            colors={[THEME.primary, THEME.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.viewAllGradient}
          >
            <Text style={styles.viewAllText}>View All Pickups</Text>
            <Ionicons name="arrow-forward-outline" size={16} color={THEME.white} />
          </LinearGradient>
        </TouchableOpacity>

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
    paddingBottom: 12,
  },
  headerContent: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  profileCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  profileInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: THEME.textSecondary,
    fontFamily: 'Inter_400Regular',
  },
  welcomeName: {
    fontSize: 28,
    fontWeight: '700',
    color: THEME.text,
    marginTop: 4,
    fontFamily: 'Poppins_700Bold',
  },
  welcomeRoute: {
    fontSize: 14,
    color: THEME.textSecondary,
    marginTop: 4,
    fontFamily: 'Inter_400Regular',
  },
  scroll: { 
    flex: 1, 
    backgroundColor: THEME.offWhite 
  },
  statsRow: { 
    flexDirection: 'row', 
    paddingHorizontal: 16, 
    paddingTop: 16, 
    gap: 12 
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statGradient: {
    padding: 16,
    alignItems: 'center',
  },
  statIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: { 
    fontSize: 22, 
    fontWeight: '700', 
    color: THEME.text 
  },
  statLabel: { 
    fontSize: 12, 
    color: THEME.textSecondary, 
    marginTop: 4 
  },
  weeklyCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  weeklyGradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weeklyLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12 
  },
  weeklyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weeklyTitle: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: THEME.text 
  },
  weeklySub: { 
    fontSize: 12, 
    color: THEME.textSecondary, 
    marginTop: 2 
  },
  weeklyChange: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: THEME.primary 
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: THEME.text 
  },
  sectionCount: { 
    fontSize: 13, 
    color: THEME.gray 
  },
  pickupCard: {
    backgroundColor: THEME.white,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 3,
    borderLeftColor: THEME.primary,
  },
  pickupIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pickupInfo: { 
    flex: 1 
  },
  pickupName: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: THEME.text 
  },
  pickupAddress: { 
    fontSize: 12, 
    color: THEME.textSecondary, 
    marginTop: 2 
  },
  pickupTime: { 
    fontSize: 12, 
    color: THEME.gray, 
    marginTop: 2 
  },
  pickupRight: { 
    alignItems: 'flex-end' 
  },
  badge: { 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 8 
  },
  badgeText: { 
    fontSize: 11, 
    fontWeight: '600' 
  },
  viewAllBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  viewAllGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  viewAllText: { 
    color: THEME.white, 
    fontWeight: '600', 
    fontSize: 14 
  },
});