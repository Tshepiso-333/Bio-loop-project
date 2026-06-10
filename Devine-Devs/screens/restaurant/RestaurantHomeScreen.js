import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS as _C, FONTS } from '../../constants/theme';

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const TANK_DATA = {
  label: 'Main Storage Tank',
  fillPercent: 75,
  statusText: 'Full',
  statusNote: 'Optimal efficiency detected. Estimated full in',
  estimatedDays: 2,
  currentVolume: 1419,
  temperature: 40,
};

const PICKUP_ALERT = {
  visible: true,
  title: 'Pickup Ready',
  message:
    'Capacity threshold approaching 80%. System recommends scheduling pickup within 12 hours.',
};

const STATS = {
  oilGrade: 'Grade A',
  estimatedEarnings: 'R145.20',
  lastPickupDate: 'Oct 24',
};

const RECENT_ACTIVITY = [
  {
    id: '1',
    title: 'Tank Volume Increased',
    subtitle: '159 Liters added • 10:45 AM',
    badge: '+12%',
    badgeType: 'percent',
  },
  {
    id: '2',
    title: 'Quality Check Completed',
    subtitle: 'Grade A maintained • 08:30 AM',
    badge: 'Excellent',
    badgeType: 'label',
  },
  {
    id: '3',
    title: 'October Payment Processed',
    subtitle: 'Credits added to account • Yesterday',
    badge: 'R412.00',
    badgeType: 'money',
  },
];

const ACTIVITY_ICONS = [
  { name: 'water-outline', color: '#10b981', bg: '#DCFCE7' },
  { name: 'checkmark-circle-outline', color: '#2563EB', bg: '#DBEAFE' },
  { name: 'receipt-outline', color: '#D97706', bg: '#FEF3C7' },
];


// ─── COLORS ───────────────────────────────────────────────────────────────────

const COLORS = {
  ..._C,
  greenDark:     _C.greenDeep,
  alertBg:       '#FFF1F1',
  alertBorder:   '#FECACA',
  alertText:     '#DC2626',
  alertButton:   '#991B1B',
  iconGreen:     _C.greenLight,
  iconOrange:    '#FEF3C7',
  iconBlue:      '#DBEAFE',
  progressTrack: _C.border,
};

// ─── ICON HELPER ──────────────────────────────────────────────────────────────

function Icon({ library = 'Ionicons', name, size, color }) {
  if (library === 'MaterialCommunityIcons') {
    return <MaterialCommunityIcons name={name} size={size} color={color} />;
  }
  return <Ionicons name={name} size={size} color={color} />;
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

export default function RestaurantHomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.topBarTitle}>Dashboard</Text>
        <Pressable style={styles.topBarCode}>
          <Ionicons name="code-slash-outline" size={20} color={COLORS.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <RestaurantHeader name="KitchenSteward" />
        <TankCard data={TANK_DATA} />
        {PICKUP_ALERT.visible && <PickupAlert alert={PICKUP_ALERT} />}

        <View style={styles.statRow}>
          <StatCard label="Oil Grade"       value={STATS.oilGrade}          iconBg={COLORS.iconOrange} iconName="water"        iconColor="#D97706" />
          <StatCard label="Est. Earnings"   value={STATS.estimatedEarnings}  iconBg={COLORS.iconGreen}  iconName="cash-outline" iconColor={COLORS.green} />
          <StatCard label="Last Pickup"     value={STATS.lastPickupDate}     iconBg={COLORS.iconBlue}   iconName="truck-outline" iconColor="#2563EB" iconLibrary="MaterialCommunityIcons" />
        </View>

        <RecentActivity items={RECENT_ACTIVITY} />
        <View style={{ height: 16 }} />
      </ScrollView>

     
    </View>
  );
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function RestaurantHeader({ name }) {
  return (
    <View style={styles.restaurantHeader}>
      <View style={styles.restaurantIcon}>
        <Ionicons name="restaurant-outline" size={18} color={COLORS.green} />
      </View>
      <Text style={styles.restaurantName}>{name}</Text>
      <Pressable style={styles.bellButton}>
        <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} />
        <View style={styles.bellDot} />
      </Pressable>
    </View>
  );
}

function TankCard({ data }) {
  return (
    <View style={styles.card}>
      <View style={styles.tankHeaderRow}>
        <Text style={styles.tankLabel}>{data.label.toUpperCase()}</Text>
        <Pressable style={styles.aiButton}>
          <Ionicons name="sparkles-outline" size={12} color={COLORS.green} />
          <Text style={styles.aiButtonText}>AI Analysis</Text>
        </Pressable>
      </View>
      <Text style={styles.tankPercent}>{data.fillPercent}%</Text>
      <Text style={styles.tankStatus}>{data.statusText}</Text>
      <Text style={styles.tankNote}>
        {data.statusNote}{' '}
        <Text style={styles.tankNoteBold}>{data.estimatedDays} days.</Text>
      </Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${data.fillPercent}%` }]} />
      </View>
      <View style={styles.tankMetaRow}>
        <View>
          <Text style={styles.tankMetaLabel}>Current Volume</Text>
          <Text style={styles.tankMetaValue}>{data.currentVolume.toLocaleString()} Liters</Text>
        </View>
        <View>
          <Text style={styles.tankMetaLabel}>Temperature</Text>
          <Text style={styles.tankMetaValue}>{data.temperature}° C</Text>
        </View>
      </View>
    </View>
  );
}

function PickupAlert({ alert }) {
  return (
    <View style={styles.alertCard}>
      <View style={styles.alertTitleRow}>
        <Ionicons name="warning-outline" size={15} color={COLORS.alertText} />
        <Text style={styles.alertTitle}> {alert.title.toUpperCase()}</Text>
      </View>
      <Text style={styles.alertMessage}>{alert.message}</Text>
      <Pressable style={styles.scheduleButton}>
        <Text style={styles.scheduleButtonText}>Schedule Now</Text>
        <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

function StatCard({ label, value, iconBg, iconName, iconColor, iconLibrary = 'Ionicons' }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
        <Icon library={iconLibrary} name={iconName} size={16} color={iconColor} />
      </View>
      <Text style={styles.statLabel}>{label.toUpperCase()}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function RecentActivity({ items }) {
  return (
    <View style={styles.activitySection}>
      <View style={styles.activityHeader}>
        <Text style={styles.activityTitle}>Recent Activity</Text>
        <Pressable>
          <Text style={styles.viewAll}>View All</Text>
        </Pressable>
      </View>
      {items.map((item, index) => (
        <ActivityRow key={item.id} item={item} iconConfig={ACTIVITY_ICONS[index]} />
      ))}
    </View>
  );
}

function ActivityRow({ item, iconConfig }) {
  const badgeStyle =
    item.badgeType === 'percent' ? styles.badgePercent
    : item.badgeType === 'money' ? styles.badgeMoney
    : styles.badgeLabel;
  const badgeTextStyle =
    item.badgeType === 'percent' ? styles.badgePercentText
    : item.badgeType === 'money' ? styles.badgeMoneyText
    : styles.badgeLabelText;

  return (
    <View style={styles.activityRow}>
      <View style={[styles.activityIconWrap, { backgroundColor: iconConfig.bg }]}>
        <Ionicons name={iconConfig.name} size={18} color={iconConfig.color} />
      </View>
      <View style={styles.activityText}>
        <Text style={styles.activityRowTitle}>{item.title}</Text>
        <Text style={styles.activityRowSub}>{item.subtitle}</Text>
      </View>
      <View style={badgeStyle}>
        <Text style={badgeTextStyle}>{item.badge}</Text>
      </View>
    </View>
  );
}



// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: COLORS.background,
  },
  topBarTitle: { fontFamily: FONTS.bold, fontSize: 22, color: COLORS.textPrimary },
  topBarCode: { padding: 6 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 4 },

  restaurantHeader: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, borderRadius: 14,
    padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  restaurantIcon: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: COLORS.greenLight,
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  restaurantName: { flex: 1, fontFamily: FONTS.semiBold, fontSize: 16, color: COLORS.textPrimary },
  bellButton: { position: 'relative', padding: 4 },
  bellDot: {
    position: 'absolute', top: 4, right: 4,
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444',
  },

  card: {
    backgroundColor: COLORS.card, borderRadius: 16,
    padding: 18, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  tankHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tankLabel: { fontFamily: FONTS.bodySemiBold, fontSize: 11, color: COLORS.textSecondary, letterSpacing: 0.8 },
  aiButton: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.greenLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  aiButtonText: { fontFamily: FONTS.semiBold, fontSize: 11, color: COLORS.green },
  tankPercent: { fontFamily: FONTS.bold, fontSize: 52, color: COLORS.green, lineHeight: 58 },
  tankStatus: { fontFamily: FONTS.bold, fontSize: 28, color: COLORS.greenDark, marginBottom: 6 },
  tankNote: { fontFamily: FONTS.bodyRegular, fontSize: 13, color: COLORS.textSecondary, marginBottom: 14 },
  tankNoteBold: { fontFamily: FONTS.bodySemiBold, color: COLORS.textPrimary },
  progressTrack: { height: 10, backgroundColor: COLORS.progressTrack, borderRadius: 6, marginBottom: 14, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.green, borderRadius: 6 },
  tankMetaRow: { flexDirection: 'row', gap: 40 },
  tankMetaLabel: { fontFamily: FONTS.bodyMedium, fontSize: 11, color: COLORS.textMuted, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  tankMetaValue: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.textPrimary },

  alertCard: {
    backgroundColor: COLORS.alertBg, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.alertBorder,
    padding: 16, marginBottom: 12,
  },
  alertTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  alertTitle: { fontFamily: FONTS.bold, fontSize: 12, color: COLORS.alertText, letterSpacing: 0.6 },
  alertMessage: { fontFamily: FONTS.bodyRegular, fontSize: 13, color: COLORS.textPrimary, lineHeight: 19, marginBottom: 14 },
  scheduleButton: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.alertButton, paddingVertical: 12, borderRadius: 10,
  },
  scheduleButtonText: { fontFamily: FONTS.semiBold, color: '#FFFFFF', fontSize: 14 },

  statRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: COLORS.border },
  statIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statLabel: { fontFamily: FONTS.bodyMedium, fontSize: 9, color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 2 },
  statValue: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.textPrimary },

  activitySection: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  activityTitle: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.textPrimary },
  viewAll: { fontFamily: FONTS.bodySemiBold, fontSize: 12, color: COLORS.green },
  activityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  activityIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  activityText: { flex: 1 },
  activityRowTitle: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textPrimary, marginBottom: 2 },
  activityRowSub: { fontFamily: FONTS.bodyRegular, fontSize: 11, color: COLORS.textMuted },

  badgePercent: { backgroundColor: COLORS.greenLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgePercentText: { fontFamily: FONTS.bodySemiBold, fontSize: 11, color: COLORS.green },
  badgeLabel: { backgroundColor: COLORS.greenLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeLabelText: { fontFamily: FONTS.bodySemiBold, fontSize: 11, color: COLORS.green },
  badgeMoney: { backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeMoneyText: { fontFamily: FONTS.bodySemiBold, fontSize: 11, color: COLORS.greenDark },

  
});