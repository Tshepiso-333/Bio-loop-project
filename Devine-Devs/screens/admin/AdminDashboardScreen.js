import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../AuthContext';
import { useAdminContext } from '../../src/contexts/AdminContext';
import DispatchBoard from '../../src/components/admin/DispatchBoard';
import AdminHeader from '../../src/admin/components/AdminHeader';
import { PRE_TRIP_STATUSES, PICKUP_STATUS_LABELS } from '../../src/lib/pickupStatus';
import {
  ADMIN_COLORS,
  ADMIN_FONTS,
  ADMIN_SHADOWS,
  ADMIN_RADII,
  ADMIN_SPACING,
} from '../../src/admin/adminTheme';

// Kept as a local alias so the rest of this file (and the ui bundle handed to
// DispatchBoard) can keep referring to `COLORS.xxx` — same object, admin theme keys.
const COLORS = ADMIN_COLORS;

const ROLE_FILTERS = ['all', 'restaurant', 'collector', 'manufacturer', 'admin'];
const MAIN_TABS = [
  { key: 'overview', label: 'Overview', icon: 'grid-outline' },
  { key: 'users', label: 'Users', icon: 'people-outline' },
  { key: 'pickups', label: 'Pickups', icon: 'git-branch-outline' },
  { key: 'finance', label: 'Finance', icon: 'cash-outline' },
  { key: 'alerts', label: 'Alerts', icon: 'notifications-outline' },
  { key: 'health', label: 'Health', icon: 'server-outline' },
];
// Sub-filter within the Pickups tab. "Needs dispatch" is the old Dispatch
// board (convert requests, assign a driver) — the only place a pickup's
// driver/manufacturer gets assigned from the admin UI. Everything else here
// is read-only history; admin doesn't get to jump a pickup's status around
// once it's moving (see updatePickupStatus's finalizePickupEarnings side
// effect on 'completed' — that must only ever fire from the real trip flow).
const PICKUPS_FILTERS = [
  { key: 'needs-dispatch', label: 'Needs dispatch' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'all', label: 'All' },
];
const WITHDRAWAL_STATUSES = ['pending', 'approved', 'rejected'];
const ALERT_TYPES = ['info', 'warning', 'critical'];
const ALERT_CATEGORIES = ['inventory', 'delivery', 'quality', 'info'];
const REQUEST_URGENCY = ['standard', 'urgent'];

function getStatusColor(status) {
  if (status === 'active' || status === 'completed' || status === 'approved') return COLORS.positive;
  if (status === 'pending' || status === 'scheduled' || status === 'standard') return COLORS.amber;
  if (status === 'inactive' || status === 'cancelled' || status === 'rejected' || status === 'critical' || status === 'urgent') return COLORS.negative;
  return COLORS.blue;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
}

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

function labelFromKey(value) {
  return String(value ?? '—').replace(/_/g, ' ');
}

function currency(value) {
  const parsed = Number(value ?? 0);
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(parsed);
}

export default function AdminDashboardScreen({ navigation }) {
  const { signOut } = useAuth();
  const admin = useAdminContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [pickupsFilter, setPickupsFilter] = useState('needs-dispatch');
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alertForm, setAlertForm] = useState({
    title: '',
    message: '',
    userId: '',
    category: 'info',
    type: 'info',
  });
  const [requestForm, setRequestForm] = useState({
    restaurantId: '',
    urgency: 'standard',
    reason: '',
    notes: '',
  });
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationTarget, setVerificationTarget] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ commission_pct: '0', driver_flat_rate_per_pickup: '0', manufacturer_markup_pct: '10' });

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return admin.users.filter((user) => {
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesSearch =
        !query ||
        user.displayName?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query);
      return matchesRole && matchesSearch;
    });
  }, [admin.users, roleFilter, search]);

  const pendingWithdrawals = useMemo(() =>
    admin.withdrawals.filter((withdrawal) => withdrawal.status !== 'approved' && withdrawal.status !== 'rejected'),
    [admin.withdrawals]
  );

  // Everything the admin actually needs to act on right now, in one feed,
  // instead of separate passive count tiles — each item jumps to where it's
  // actioned. This replaces the old 4-box stats grid.
  const attentionItems = useMemo(() => {
    const items = [];

    const convertedRequestIds = new Set(
      admin.pickups.filter((pickup) => pickup.manual_request_id).map((pickup) => pickup.manual_request_id)
    );
    admin.manualPickupRequests
      .filter((request) => !convertedRequestIds.has(request.id))
      .forEach((request) => {
        const restaurant = admin.restaurants.find((r) => r.id === request.restaurant_id);
        items.push({
          key: `request-${request.id}`,
          icon: 'alert-circle-outline',
          color: COLORS.amber,
          title: `Pickup request — ${restaurant?.name ?? 'Unknown restaurant'}`,
          subtitle: request.is_auto_generated ? 'Auto-triggered at 85% tank fill' : (request.reason ?? 'No reason given'),
          onPress: () => { setActiveTab('pickups'); setPickupsFilter('needs-dispatch'); },
        });
      });

    admin.pickups
      .filter((pickup) => !pickup.collector_id || !pickup.manufacturer_id)
      .forEach((pickup) => {
        const restaurant = admin.restaurants.find((r) => r.id === pickup.restaurant_id) ?? pickup.restaurants;
        const missing = !pickup.collector_id && !pickup.manufacturer_id
          ? 'No driver or manufacturer assigned'
          : !pickup.collector_id
          ? 'No driver assigned'
          : 'No manufacturer assigned';
        items.push({
          key: `pickup-${pickup.id}`,
          icon: 'navigate-outline',
          color: COLORS.blue,
          title: `Unassigned pickup — ${restaurant?.name ?? 'Unknown restaurant'}`,
          subtitle: missing,
          onPress: () => { setActiveTab('pickups'); setPickupsFilter('needs-dispatch'); },
        });
      });

    pendingWithdrawals.forEach((withdrawal) => {
      const isCollector = !!withdrawal.collector_id;
      const owner = isCollector
        ? admin.collectors.find((c) => c.id === withdrawal.collector_id)
        : admin.restaurants.find((r) => r.id === withdrawal.restaurant_id);
      items.push({
        key: `withdrawal-${withdrawal.id}`,
        icon: 'cash-outline',
        color: COLORS.primary,
        title: `${currency(withdrawal.amount)} withdrawal — ${owner?.full_name ?? owner?.name ?? 'Unknown'}`,
        subtitle: isCollector ? 'Driver payout' : 'Restaurant payout',
        onPress: () => setActiveTab('finance'),
      });
    });

    admin.alerts
      .filter((alert) => !alert.is_read)
      .forEach((alert) => {
        items.push({
          key: `alert-${alert.id}`,
          icon: 'notifications-outline',
          color: COLORS.negative,
          title: alert.title,
          subtitle: alert.message,
          onPress: () => setActiveTab('alerts'),
        });
      });

    return items;
  }, [admin.manualPickupRequests, admin.pickups, admin.restaurants, admin.collectors, pendingWithdrawals, admin.alerts]);

  // What the platform actually has on hand: everything manufacturers have
  // paid in, minus everything already paid out to restaurants/drivers via
  // approved withdrawals. Approving a withdrawal that exceeds this means
  // paying out money the platform hasn't actually collected yet.
  const platformBalance = useMemo(() => {
    const collected = (admin.paymentTransactions ?? [])
      .filter((t) => t.status === 'complete')
      .reduce((sum, t) => sum + Number(t.amount ?? 0), 0);
    const paidOut = admin.withdrawals
      .filter((w) => w.status === 'approved')
      .reduce((sum, w) => sum + Number(w.amount ?? 0), 0);
    return collected - paidOut;
  }, [admin.paymentTransactions, admin.withdrawals]);

  const withMutation = async (label, action) => {
    try {
      await action();
    } catch (err) {
      Alert.alert(label, err.message ?? 'Admin action failed. Check RLS policies and permissions.');
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Clear this Supabase session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  };

  const handleCreateAlert = async () => {
    if (!alertForm.title.trim() || !alertForm.message.trim() || !alertForm.userId) {
      Alert.alert('Missing details', 'Choose a user and add a title and message before sending the alert.');
      return;
    }

    setSubmitting(true);
    try {
      await admin.createAdminAlert({
        user_id: alertForm.userId,
        title: alertForm.title.trim(),
        message: alertForm.message.trim(),
        category: alertForm.category,
        type: alertForm.type,
        is_read: false,
        created_at: new Date().toISOString(),
      });
      setShowAlertModal(false);
      setAlertForm({ title: '', message: '', userId: '', category: 'info', type: 'info' });
      Alert.alert('Alert created', 'The notification has been sent to the selected user.');
    } catch (err) {
      Alert.alert('Create alert failed', err.message ?? 'Unable to create the alert.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!requestForm.restaurantId || !requestForm.reason.trim()) {
      Alert.alert('Missing details', 'Select a restaurant and describe the pickup reason.');
      return;
    }

    setSubmitting(true);
    try {
      await admin.createManualPickupRequest({
        restaurant_id: requestForm.restaurantId,
        urgency: requestForm.urgency,
        reason: requestForm.reason.trim(),
        notes: requestForm.notes.trim() || null,
      });
      setShowRequestModal(false);
      setRequestForm({ restaurantId: '', urgency: 'standard', reason: '', notes: '' });
      Alert.alert('Manual request created', 'The pickup request is now available in the admin queue.');
    } catch (err) {
      Alert.alert('Create request failed', err.message ?? 'Unable to create the request.');
    } finally {
      setSubmitting(false);
    }
  };

  const openVerificationModal = (user) => {
    setVerificationTarget(user);
    setVerificationNotes(user.business?.verification_notes ?? '');
    setShowVerificationModal(true);
  };

  const openProfileModal = (user) => {
    setProfileUser(user);
    setShowProfileModal(true);
  };

  const handleVerifyFromProfile = () => {
    if (!profileUser) return;
    setShowProfileModal(false);
    openVerificationModal(profileUser);
  };

  const handleConfirmVerification = async () => {
    if (!verificationTarget?.businessTable || !verificationTarget?.business?.id) return;

    setSubmitting(true);
    try {
      await admin.updateBusinessVerification(
        verificationTarget.businessTable,
        verificationTarget.business.id,
        !verificationTarget.business.is_verified,
        verificationNotes.trim() || null
      );
      setShowVerificationModal(false);
      setVerificationTarget(null);
      setVerificationNotes('');
    } catch (err) {
      Alert.alert('Verification failed', err.message ?? 'Unable to update verification.');
    } finally {
      setSubmitting(false);
    }
  };

  const openSettingsModal = () => {
    const current = admin.platformSettings?.[0];
    setSettingsForm({
      commission_pct: String(current?.commission_pct ?? 0),
      driver_flat_rate_per_pickup: String(current?.driver_flat_rate_per_pickup ?? 0),
      manufacturer_markup_pct: String(current?.manufacturer_markup_pct ?? 10),
    });
    setShowSettingsModal(true);
  };

  const handleSaveSettings = async () => {
    const settingsId = admin.platformSettings?.[0]?.id;
    if (!settingsId) {
      Alert.alert('Settings not found', 'platform_settings row is missing — check the migration ran.');
      return;
    }

    const commissionPct = Number(settingsForm.commission_pct);
    const driverRate = Number(settingsForm.driver_flat_rate_per_pickup);
    const markupPct = Number(settingsForm.manufacturer_markup_pct);
    if (Number.isNaN(commissionPct) || Number.isNaN(driverRate) || Number.isNaN(markupPct)) {
      Alert.alert('Invalid values', 'Enter numbers for all fields.');
      return;
    }

    setSubmitting(true);
    try {
      await admin.updatePlatformSettings(settingsId, {
        commission_pct: commissionPct,
        driver_flat_rate_per_pickup: driverRate,
        manufacturer_markup_pct: markupPct,
      });
      setShowSettingsModal(false);
    } catch (err) {
      Alert.alert('Save failed', err.message ?? 'Unable to update settings.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderMainTabs = () => (
    <View style={styles.mainTabs}>
      {MAIN_TABS.map((tab) => {
        const active = activeTab === tab.key;
        return (
          <Pressable key={tab.key} style={[styles.mainTab, active && styles.mainTabActive]} onPress={() => setActiveTab(tab.key)}>
            <Ionicons name={tab.icon} size={14} color={active ? COLORS.white : COLORS.muted} />
            <Text style={[styles.mainTabText, active && styles.mainTabTextActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  const renderOverview = () => (
    <View>
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.heroTitle}>Live operations</Text>
            <Text style={styles.heroText}>Review the platform and act on pending work from one place.</Text>
          </View>
          <Pressable style={styles.primaryButton} onPress={() => setShowAlertModal(true)}>
            <Ionicons name="notifications-outline" size={15} color={COLORS.white} />
            <Text style={styles.primaryButtonText}>Create alert</Text>
          </Pressable>
        </View>

        <View style={styles.heroActions}>
          <Pressable style={styles.secondaryButton} onPress={() => setShowRequestModal(true)}>
            <Ionicons name="add-circle-outline" size={16} color={COLORS.primary} />
            <Text style={styles.secondaryButtonText}>Manual pickup request</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => setActiveTab('health')}>
            <Ionicons name="server-outline" size={16} color={COLORS.primary} />
            <Text style={styles.secondaryButtonText}>Inspect data health</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Needs your attention ({attentionItems.length})</Text>
      </View>

      {attentionItems.map((item) => (
        <Pressable key={item.key} style={styles.card} onPress={item.onPress}>
          <View style={styles.cardTop}>
            <View style={[styles.avatar, { backgroundColor: `${item.color}22` }]}>
              <Ionicons name={item.icon} size={18} color={item.color} />
            </View>
            <View style={styles.cardMain}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSub}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
          </View>
        </Pressable>
      ))}
      {attentionItems.length === 0 ? <EmptyState label="Nothing needs attention right now." /> : null}
    </View>
  );

  const renderUsers = () => (
    <View>
      <TextInput
        style={styles.search}
        placeholder="Search users by name or email"
        placeholderTextColor={COLORS.muted}
        value={search}
        onChangeText={setSearch}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {ROLE_FILTERS.map((role) => {
          const active = roleFilter === role;
          return (
            <Pressable key={role} style={[styles.filterChip, active && styles.filterChipActive]} onPress={() => setRoleFilter(role)}>
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {role === 'all' ? 'All roles' : labelFromKey(role)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {filteredUsers.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          onPress={() => openProfileModal(user)}
          onToggleProfile={() => withMutation('User status', () => admin.updateProfileStatus(user.id, user.status === 'active' ? 'inactive' : 'active'))}
          onToggleBusinessStatus={() =>
            user.businessTable && user.business?.id
              ? withMutation('Business status', () => admin.updateBusinessStatus(user.businessTable, user.business.id, user.business.status === 'active' ? 'inactive' : 'active'))
              : null
          }
          onToggleVerification={() =>
            user.businessTable && user.business?.id ? openVerificationModal(user) : null
          }
          manufacturers={admin.manufacturers}
          onAssignManufacturer={(manufacturerId) =>
            withMutation('Primary manufacturer', () => admin.updateRestaurantPrimaryManufacturer(user.business.id, manufacturerId))
          }
        />
      ))}

      {filteredUsers.length === 0 ? <EmptyState label="No users match this filter." /> : null}
    </View>
  );

  const filteredPickups = useMemo(() => {
    if (pickupsFilter === 'completed') return admin.pickups.filter((p) => p.status === 'completed');
    if (pickupsFilter === 'cancelled') return admin.pickups.filter((p) => p.status === 'cancelled');
    if (pickupsFilter === 'active') {
      return admin.pickups.filter((p) => p.collector_id && p.status !== 'completed' && p.status !== 'cancelled');
    }
    return admin.pickups;
  }, [admin.pickups, pickupsFilter]);

  const handleCancelPickup = (pickup) => {
    Alert.alert('Cancel pickup', 'This cancels the pickup for the restaurant and driver. Continue?', [
      { text: 'Back', style: 'cancel' },
      { text: 'Cancel pickup', style: 'destructive', onPress: () => withMutation('Cancel pickup', () => admin.updatePickupStatus(pickup.id, 'cancelled')) },
    ]);
  };

  const renderPickups = () => (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {PICKUPS_FILTERS.map((filter) => {
          const active = pickupsFilter === filter.key;
          return (
            <Pressable key={filter.key} style={[styles.filterChip, active && styles.filterChipActive]} onPress={() => setPickupsFilter(filter.key)}>
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{filter.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {pickupsFilter === 'needs-dispatch' ? (
        <DispatchBoard
          admin={admin}
          ui={{ styles, COLORS, getStatusColor, formatDate, labelFromKey, AssignmentRow, ActionButton, EmptyState }}
        />
      ) : (
        <View>
          {filteredPickups.map((pickup) => (
            <PickupCard key={pickup.id} pickup={pickup} onCancel={() => handleCancelPickup(pickup)} />
          ))}
          {filteredPickups.length === 0 ? <EmptyState label="No pickups in this view." /> : null}
        </View>
      )}
    </View>
  );

  const handleApproveWithdrawal = (withdrawal) => {
    const proceed = () => withMutation('Approve withdrawal', () => admin.updateWithdrawalStatus(withdrawal.id, 'approved'));

    if (Number(withdrawal.amount ?? 0) > platformBalance) {
      Alert.alert(
        'Balance too low',
        `Platform balance is ${currency(platformBalance)}, but this withdrawal is ${currency(withdrawal.amount)}. Approve anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Approve anyway', style: 'destructive', onPress: proceed },
        ]
      );
      return;
    }

    proceed();
  };

  const renderFinance = () => (
    <View>
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Wallet and payout controls</Text>
            <Text style={styles.heroText}>Approve or reject incoming withdrawal requests from the live finance queue.</Text>
          </View>
          <Pressable style={styles.primaryButton} onPress={openSettingsModal}>
            <Ionicons name="options-outline" size={15} color={COLORS.white} />
            <Text style={styles.primaryButtonText}>Settings</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.avatar}>
            <Ionicons name="business-outline" size={18} color={COLORS.primary} />
          </View>
          <View style={styles.cardMain}>
            <Text style={styles.cardTitle}>Platform balance</Text>
            <Text style={styles.cardSub}>Collected from manufacturers minus approved payouts</Text>
          </View>
          <Text style={[styles.cardTitle, { color: platformBalance < 0 ? COLORS.negative : COLORS.primary }]}>
            {currency(platformBalance)}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionMiniTitle}>Manufacturer payments</Text>
      {(admin.paymentTransactions ?? []).map((txn) => (
        <View key={txn.id} style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.avatar}>
              <Ionicons name="card-outline" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.cardMain}>
              <Text style={styles.cardTitle}>{currency(txn.amount)} · {txn.manufacturers?.name ?? 'Unknown manufacturer'}</Text>
              <Text style={styles.cardSub}>
                {txn.pickups?.restaurants?.name ?? 'Unknown restaurant'} · Driver: {txn.pickups?.collectors?.full_name ?? '—'}
              </Text>
              <Text style={styles.cardMeta}>{formatDateTime(txn.created_at)}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: `${getStatusColor(txn.status)}22` }]}>
              <Text style={[styles.badgeText, { color: getStatusColor(txn.status) }]}>{txn.status}</Text>
            </View>
          </View>
        </View>
      ))}
      {(admin.paymentTransactions ?? []).length === 0 ? <EmptyState label="No manufacturer payments yet." /> : null}

      <Text style={styles.sectionMiniTitle}>Wallets</Text>
      {admin.restaurantWallets.map((wallet) => (
        <View key={wallet.id} style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.avatar}>
              <Ionicons name="wallet-outline" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.cardMain}>
              <Text style={styles.cardTitle}>Restaurant wallet</Text>
              <Text style={styles.cardSub}>Wallet ID: {wallet.id}</Text>
              <Text style={styles.cardMeta}>Balance {currency(wallet.balance)}</Text>
            </View>
          </View>
        </View>
      ))}
      {(admin.collectorWallets ?? []).map((wallet) => (
        <View key={wallet.id} style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.avatar}>
              <Ionicons name="wallet-outline" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.cardMain}>
              <Text style={styles.cardTitle}>Driver wallet</Text>
              <Text style={styles.cardSub}>Wallet ID: {wallet.id}</Text>
              <Text style={styles.cardMeta}>Balance {currency(wallet.balance)}</Text>
            </View>
          </View>
        </View>
      ))}

      <Text style={styles.sectionMiniTitle}>Pending withdrawals</Text>
      {pendingWithdrawals.map((withdrawal) => {
        const isCollector = !!withdrawal.collector_id;
        const owner = isCollector
          ? admin.collectors.find((c) => c.id === withdrawal.collector_id)
          : admin.restaurants.find((r) => r.id === withdrawal.restaurant_id);
        const ownerName = owner?.full_name ?? owner?.name ?? (isCollector ? 'Unknown driver' : 'Unknown restaurant');

        return (
          <View key={withdrawal.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.avatar}>
                <Ionicons name="cash-outline" size={18} color={COLORS.primary} />
              </View>
              <View style={styles.cardMain}>
                <Text style={styles.cardTitle}>{currency(withdrawal.amount)} · {ownerName}</Text>
                <Text style={styles.cardSub}>{isCollector ? 'Driver payout' : 'Restaurant payout'} · Method: {withdrawal.method ?? 'manual'}</Text>
                <Text style={styles.cardMeta}>{formatDateTime(withdrawal.created_at)}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: `${getStatusColor(withdrawal.status)}22` }]}>
                <Text style={[styles.badgeText, { color: getStatusColor(withdrawal.status) }]}>{withdrawal.status}</Text>
              </View>
            </View>
            <View style={styles.actionRow}>
              <ActionButton label="Approve" icon="checkmark-circle-outline" onPress={() => handleApproveWithdrawal(withdrawal)} />
              <ActionButton label="Reject" icon="close-circle-outline" onPress={() => withMutation('Reject withdrawal', () => admin.updateWithdrawalStatus(withdrawal.id, 'rejected'))} />
            </View>
          </View>
        );
      })}

      {pendingWithdrawals.length === 0 ? <EmptyState label="No withdrawals awaiting review." /> : null}
    </View>
  );

  const renderAlerts = () => (
    <View>
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Alert operations</Text>
            <Text style={styles.heroText}>Create targeted messages and manage the live alert queue.</Text>
          </View>
          <Pressable style={styles.primaryButton} onPress={() => setShowAlertModal(true)}>
            <Ionicons name="add-outline" size={15} color={COLORS.white} />
            <Text style={styles.primaryButtonText}>New alert</Text>
          </Pressable>
        </View>
      </View>

      {admin.alerts.map((alert) => (
        <View key={alert.id} style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.avatar}>
              <Ionicons name="notifications-outline" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.cardMain}>
              <Text style={styles.cardTitle}>{alert.title}</Text>
              <Text style={styles.cardSub}>{alert.message}</Text>
              <Text style={styles.cardMeta}>{alert.category} · {formatDateTime(alert.created_at)}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: `${getStatusColor(alert.type)}22` }]}>
              <Text style={[styles.badgeText, { color: getStatusColor(alert.type) }]}>{alert.type}</Text>
            </View>
          </View>
          <View style={styles.actionRow}>
            <ActionButton label={alert.is_read ? 'Mark unread' : 'Mark read'} icon={alert.is_read ? 'mail-open-outline' : 'mail-outline'} onPress={() => withMutation('Alert update', () => admin.updateAlertRead(alert.id, !alert.is_read))} />
            <ActionButton label="Delete" icon="trash-outline" onPress={() => Alert.alert('Delete alert', 'Remove this alert?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => withMutation('Delete alert', () => admin.deleteAlert(alert.id)) }])} />
          </View>
        </View>
      ))}

      {admin.alerts.length === 0 ? <EmptyState label="No alerts found." /> : null}
    </View>
  );

  const renderHealth = () => (
    <View>
      {admin.errors.length > 0 ? (
        <View style={styles.warningCard}>
          <Ionicons name="warning-outline" size={18} color={COLORS.warnText} />
          <Text style={styles.warningText}>Some tables could not be read. This usually means RLS policies are missing for admin users.</Text>
        </View>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Data access overview</Text>
      </View>
      {admin.tableOverview.map((table) => (
        <View key={table.key} style={styles.tableRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.tableName}>{table.label}</Text>
            {table.error ? <Text style={styles.tableError}>{table.error}</Text> : null}
          </View>
          <Text style={[styles.tableCount, table.error && styles.tableCountError]}>{table.count}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.root}>
      <AdminHeader
        variant="home"
        subtitle="Operations center for users, pickups, finance, and alerts"
        actions={[
          { key: 'settings', icon: 'settings-outline', onPress: () => navigation.navigate('AdminSettings') },
          { key: 'signout', icon: 'log-out-outline', onPress: handleSignOut },
        ]}
      />
      <ScrollView refreshControl={<RefreshControl refreshing={admin.refreshing} onRefresh={admin.refreshAdmin} tintColor={COLORS.primary} />} contentContainerStyle={styles.content}>
        {renderMainTabs()}

        {admin.loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading live admin data...</Text>
          </View>
        ) : null}

        {admin.error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{admin.error}</Text>
          </View>
        ) : null}

        {!admin.loading && activeTab === 'overview' ? renderOverview() : null}
        {!admin.loading && activeTab === 'users' ? renderUsers() : null}
        {!admin.loading && activeTab === 'pickups' ? renderPickups() : null}
        {!admin.loading && activeTab === 'finance' ? renderFinance() : null}
        {!admin.loading && activeTab === 'alerts' ? renderAlerts() : null}
        {!admin.loading && activeTab === 'health' ? renderHealth() : null}
      </ScrollView>

      <Modal visible={showAlertModal} transparent animationType="slide" onRequestClose={() => setShowAlertModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create alert</Text>
              <Pressable onPress={() => setShowAlertModal(false)}>
                <Ionicons name="close-outline" size={22} color={COLORS.muted} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              <TextInput
                style={styles.input}
                placeholder="Heading"
                placeholderTextColor={COLORS.muted}
                value={alertForm.title}
                onChangeText={(value) => setAlertForm((prev) => ({ ...prev, title: value }))}
              />
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Alert message"
                placeholderTextColor={COLORS.muted}
                multiline
                value={alertForm.message}
                onChangeText={(value) => setAlertForm((prev) => ({ ...prev, message: value }))}
              />

              <Text style={styles.sectionMiniTitle}>Target user</Text>
              <View style={styles.chipRow}>
                {admin.users.map((user) => {
                  const active = alertForm.userId === user.id;
                  return (
                    <Pressable key={user.id} style={[styles.assignmentChip, active && styles.assignmentChipActive]} onPress={() => setAlertForm((prev) => ({ ...prev, userId: user.id }))}>
                      <Text style={[styles.assignmentChipText, active && styles.assignmentChipTextActive]}>{user.displayName}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.sectionMiniTitle}>Category</Text>
              <View style={styles.chipRow}>
                {ALERT_CATEGORIES.map((category) => {
                  const active = alertForm.category === category;
                  return (
                    <Pressable key={category} style={[styles.assignmentChip, active && styles.assignmentChipActive]} onPress={() => setAlertForm((prev) => ({ ...prev, category }))}>
                      <Text style={[styles.assignmentChipText, active && styles.assignmentChipTextActive]}>{labelFromKey(category)}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.sectionMiniTitle}>Priority</Text>
              <View style={styles.chipRow}>
                {ALERT_TYPES.map((type) => {
                  const active = alertForm.type === type;
                  return (
                    <Pressable key={type} style={[styles.assignmentChip, active && styles.assignmentChipActive]} onPress={() => setAlertForm((prev) => ({ ...prev, type }))}>
                      <Text style={[styles.assignmentChipText, active && styles.assignmentChipTextActive]}>{labelFromKey(type)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setShowAlertModal(false)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={handleCreateAlert} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color={COLORS.white} /> : <Text style={styles.primaryButtonText}>Save alert</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showRequestModal} transparent animationType="slide" onRequestClose={() => setShowRequestModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manual pickup request</Text>
              <Pressable onPress={() => setShowRequestModal(false)}>
                <Ionicons name="close-outline" size={22} color={COLORS.muted} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              <Text style={styles.sectionMiniTitle}>Restaurant</Text>
              <View style={styles.chipRow}>
                {admin.restaurants.map((restaurant) => {
                  const active = requestForm.restaurantId === restaurant.id;
                  return (
                    <Pressable key={restaurant.id} style={[styles.assignmentChip, active && styles.assignmentChipActive]} onPress={() => setRequestForm((prev) => ({ ...prev, restaurantId: restaurant.id }))}>
                      <Text style={[styles.assignmentChipText, active && styles.assignmentChipTextActive]}>{restaurant.name ?? 'Restaurant'}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.sectionMiniTitle}>Urgency</Text>
              <View style={styles.chipRow}>
                {REQUEST_URGENCY.map((urgency) => {
                  const active = requestForm.urgency === urgency;
                  return (
                    <Pressable key={urgency} style={[styles.assignmentChip, active && styles.assignmentChipActive]} onPress={() => setRequestForm((prev) => ({ ...prev, urgency }))}>
                      <Text style={[styles.assignmentChipText, active && styles.assignmentChipTextActive]}>{labelFromKey(urgency)}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Reason for request"
                placeholderTextColor={COLORS.muted}
                value={requestForm.reason}
                onChangeText={(value) => setRequestForm((prev) => ({ ...prev, reason: value }))}
              />
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Additional notes"
                placeholderTextColor={COLORS.muted}
                multiline
                value={requestForm.notes}
                onChangeText={(value) => setRequestForm((prev) => ({ ...prev, notes: value }))}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setShowRequestModal(false)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={handleCreateRequest} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color={COLORS.white} /> : <Text style={styles.primaryButtonText}>Create request</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showVerificationModal} transparent animationType="slide" onRequestClose={() => setShowVerificationModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {verificationTarget?.business?.is_verified ? 'Unverify' : 'Verify'} {verificationTarget?.displayName}
              </Text>
              <Pressable onPress={() => setShowVerificationModal(false)}>
                <Ionicons name="close-outline" size={22} color={COLORS.muted} />
              </Pressable>
            </View>

            <Text style={styles.sectionMiniTitle}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Why is this account being verified or unverified?"
              placeholderTextColor={COLORS.muted}
              multiline
              value={verificationNotes}
              onChangeText={setVerificationNotes}
            />

            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setShowVerificationModal(false)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={handleConfirmVerification} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color={COLORS.white} /> : <Text style={styles.primaryButtonText}>Confirm</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showSettingsModal} transparent animationType="slide" onRequestClose={() => setShowSettingsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Platform settings</Text>
              <Pressable onPress={() => setShowSettingsModal(false)}>
                <Ionicons name="close-outline" size={22} color={COLORS.muted} />
              </Pressable>
            </View>

            <Text style={styles.sectionMiniTitle}>Commission % (taken from manufacturer payment)</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={COLORS.muted}
              keyboardType="numeric"
              value={settingsForm.commission_pct}
              onChangeText={(value) => setSettingsForm((prev) => ({ ...prev, commission_pct: value }))}
            />

            <Text style={styles.sectionMiniTitle}>Driver flat rate per pickup (R) — fallback only, used when a pickup has no admin-set driver pay</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={COLORS.muted}
              keyboardType="numeric"
              value={settingsForm.driver_flat_rate_per_pickup}
              onChangeText={(value) => setSettingsForm((prev) => ({ ...prev, driver_flat_rate_per_pickup: value }))}
            />

            <Text style={styles.sectionMiniTitle}>Manufacturer markup % (added on top of oil value at checkout)</Text>
            <TextInput
              style={styles.input}
              placeholder="10"
              placeholderTextColor={COLORS.muted}
              keyboardType="numeric"
              value={settingsForm.manufacturer_markup_pct}
              onChangeText={(value) => setSettingsForm((prev) => ({ ...prev, manufacturer_markup_pct: value }))}
            />

            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setShowSettingsModal(false)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={handleSaveSettings} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color={COLORS.white} /> : <Text style={styles.primaryButtonText}>Save</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showProfileModal} transparent animationType="slide" onRequestClose={() => setShowProfileModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{profileUser?.displayName ?? 'Profile'}</Text>
              <Pressable onPress={() => setShowProfileModal(false)}>
                <Ionicons name="close-outline" size={22} color={COLORS.muted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {profileUser ? (
                <>
                  <Text style={styles.sectionMiniTitle}>Account</Text>
                  {getProfileDetailFields(profileUser).account.map(([label, value]) => (
                    <Text key={label} style={styles.businessText}>{label}: {value ?? '—'}</Text>
                  ))}

                  {profileUser.business ? (
                    <>
                      <Text style={[styles.sectionMiniTitle, { marginTop: 14 }]}>
                        {labelFromKey(profileUser.businessTable)?.replace(/s$/, '')} details
                      </Text>
                      {getProfileDetailFields(profileUser).business.map(([label, value]) => (
                        <Text key={label} style={styles.businessText}>{label}: {value ?? '—'}</Text>
                      ))}
                    </>
                  ) : (
                    <Text style={[styles.noBusiness, { marginTop: 14 }]}>No linked business record.</Text>
                  )}
                </>
              ) : null}
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.secondaryButton}
                onPress={handleVerifyFromProfile}
                disabled={!profileUser?.business}
              >
                <Text style={styles.secondaryButtonText}>
                  {profileUser?.business?.is_verified ? 'Unverify' : 'Verify'}
                </Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={() => setShowProfileModal(false)}>
                <Text style={styles.primaryButtonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Full read-only field dump for the admin's "view full profile" modal — every
// field is one Supabase already has, just not otherwise surfaced anywhere
// in the admin UI. Business fields vary by role since restaurants/collectors/
// manufacturers each have their own table shape.
function getProfileDetailFields(user) {
  const account = [
    ['Email', user.email],
    ['Phone', user.phone],
    ['Role', labelFromKey(user.role)],
    ['Account status', user.status],
    ['Joined', formatDate(user.created_at)],
    ['Last updated', formatDate(user.updated_at)],
  ];

  const b = user.business ?? {};
  let business = [];

  if (user.businessTable === 'restaurants') {
    business = [
      ['Name', b.name],
      ['Address', b.address],
      ['District', b.district],
      ['Cuisine', b.cuisine],
      ['Phone', b.phone],
      ['Email', b.email],
      ['Status', b.status],
      ['Verified', b.is_verified ? 'Yes' : 'No'],
      ['Verification notes', b.verification_notes],
    ];
  } else if (user.businessTable === 'collectors') {
    business = [
      ['Full name', b.full_name],
      ['Employee code', b.employee_code],
      ['District', b.district],
      ['Route', b.route_name],
      ['Vehicle info', b.vehicle_info],
      ['Rating', b.rating],
      ['Reviews', b.reviews_count],
      ['Total liters', b.total_liters],
      ['CO2 saved (kg)', b.co2_saved_kg],
      ['Total collections', b.total_collections],
      ['On duty', b.is_on_duty ? 'Yes' : 'No'],
      ['Status', b.status],
    ];
  } else if (user.businessTable === 'manufacturers') {
    business = [
      ['Name', b.name],
      ['Address', b.address],
      ['Contact phone', b.contact_phone],
      ['Contact email', b.contact_email],
      ['Position', b.position],
      ['Accepted grades', Array.isArray(b.accepted_grades) ? b.accepted_grades.join(', ') : b.accepted_grades],
      ['Status', b.status],
      ['Verified', b.is_verified ? 'Yes' : 'No'],
      ['Verification notes', b.verification_notes],
    ];
  }

  return { account, business };
}

function UserCard({ user, onPress, onToggleProfile, onToggleBusinessStatus, onToggleVerification, manufacturers, onAssignManufacturer }) {
  const statusColor = getStatusColor(user.status);
  const businessStatusColor = getStatusColor(user.business?.status);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{String(user.displayName ?? '?').slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={styles.cardMain}>
          <Text style={styles.cardTitle}>{user.displayName}</Text>
          <Text style={styles.cardSub}>{user.email}</Text>
          <Text style={styles.cardMeta}>{labelFromKey(user.role)} · joined {formatDate(user.created_at)}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: `${statusColor}22` }]}>
          <Text style={[styles.badgeText, { color: statusColor }]}>{user.status ?? 'unknown'}</Text>
        </View>
      </View>

      {user.business ? (
        <View style={styles.businessBox}>
          <Text style={styles.businessText}>Business: {user.business.name ?? user.business.full_name ?? '—'}</Text>
          <Text style={[styles.businessText, { color: businessStatusColor }]}>Status: {user.business.status ?? 'unknown'} · Verified: {user.business.is_verified ? 'yes' : 'no'}</Text>
        </View>
      ) : (
        <Text style={styles.noBusiness}>No linked business record.</Text>
      )}

      {user.role === 'restaurant' && user.business ? (
        <>
          <Text style={styles.sectionMiniTitle}>Primary manufacturer</Text>
          <AssignmentRow
            items={manufacturers}
            currentId={user.business.primary_manufacturer_id}
            getLabel={(manufacturer) => manufacturer.name ?? 'Manufacturer'}
            onSelect={onAssignManufacturer}
          />
        </>
      ) : null}

      <View style={styles.actionRow}>
        <ActionButton label={user.status === 'active' ? 'Suspend user' : 'Activate user'} icon={user.status === 'active' ? 'pause-circle-outline' : 'checkmark-circle-outline'} onPress={onToggleProfile} />
        <ActionButton label={user.business?.status === 'active' ? 'Suspend business' : 'Activate business'} icon="business-outline" onPress={onToggleBusinessStatus} disabled={!user.business} />
        <ActionButton label={user.business?.is_verified ? 'Unverify' : 'Verify'} icon="shield-checkmark-outline" onPress={onToggleVerification} disabled={!user.business} />
      </View>
    </Pressable>
  );
}

// Read-only history/status view — assigning a driver or manufacturer only
// ever happens from the "Needs dispatch" flow (DispatchBoard); once a pickup
// is assigned, this card can't touch collector_id/manufacturer_id/status at
// all except the single guarded Cancel action.
function PickupCard({ pickup, onCancel }) {
  const statusColor = getStatusColor(pickup.status);
  const statusLabel = PICKUP_STATUS_LABELS[pickup.status] ?? labelFromKey(pickup.status);
  const canCancel = PRE_TRIP_STATUSES.includes(pickup.status);

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardMain}>
          <Text style={styles.cardTitle}>{pickup.restaurants?.name ?? 'Unknown restaurant'}</Text>
          <Text style={styles.cardSub}>{pickup.restaurants?.address ?? 'No address'}</Text>
          <Text style={styles.cardMeta}>{formatDate(pickup.pickup_date)} · {pickup.estimated_volume_liters ?? pickup.actual_volume_liters ?? 0}L</Text>
          <Text style={styles.cardMeta}>
            Driver pay: {pickup.driver_payout_amount != null ? currency(pickup.driver_payout_amount) : 'not set — falls back to flat rate'}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: `${statusColor}22` }]}>
          <Text style={[styles.badgeText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      <Text style={styles.businessText}>Driver: {pickup.collectors?.full_name ?? 'Not yet assigned — see Needs dispatch'}</Text>
      <Text style={styles.businessText}>Manufacturer: {pickup.manufacturers?.name ?? 'Not yet assigned — see Needs dispatch'}</Text>

      {canCancel ? (
        <View style={styles.actionRow}>
          <ActionButton label="Cancel pickup" icon="close-circle-outline" onPress={onCancel} />
        </View>
      ) : null}
    </View>
  );
}

function AssignmentRow({ items, currentId, getLabel, onSelect }) {
  if (!items.length) {
    return <Text style={styles.noBusiness}>No records available.</Text>;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
      {items.map((item) => {
        const active = item.id === currentId;
        return (
          <Pressable key={item.id} style={[styles.assignmentChip, active && styles.assignmentChipActive]} onPress={() => onSelect(item.id)}>
            <Text style={[styles.assignmentChipText, active && styles.assignmentChipTextActive]}>{getLabel(item)}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function ActionButton({ label, icon, onPress, disabled = false }) {
  return (
    <Pressable style={[styles.actionButton, disabled && styles.actionButtonDisabled]} onPress={disabled ? undefined : onPress}>
      <Ionicons name={icon} size={14} color={disabled ? COLORS.muted : COLORS.primary} />
      <Text style={[styles.actionText, disabled && styles.actionTextDisabled]}>{label}</Text>
    </Pressable>
  );
}

function EmptyState({ label }) {
  return (
    <View style={styles.empty}>
      <Ionicons name="file-tray-outline" size={32} color={COLORS.muted} />
      <Text style={styles.emptyText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.page },
  content: { padding: ADMIN_SPACING.screenPadding, paddingTop: 4, paddingBottom: 32 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.card,
    borderRadius: ADMIN_RADII.card,
    padding: ADMIN_SPACING.cardPadding,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...ADMIN_SHADOWS.card,
  },
  statCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontFamily: ADMIN_FONTS.extraBold, fontSize: 16, color: COLORS.ink, marginTop: 10 },
  statLabel: { fontFamily: ADMIN_FONTS.medium, fontSize: 11, color: COLORS.body, marginTop: 2 },

  mainTabs: { flexDirection: 'row', backgroundColor: COLORS.paleGreen, borderRadius: 14, padding: 4, marginVertical: 14, gap: 4, flexWrap: 'wrap' },
  mainTab: { flex: 1, minWidth: '30%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  mainTabActive: { backgroundColor: COLORS.primary, ...ADMIN_SHADOWS.button },
  mainTabText: { fontFamily: ADMIN_FONTS.bold, fontSize: 12, color: COLORS.body },
  mainTabTextActive: { color: COLORS.white },

  search: {
    backgroundColor: COLORS.surfaceSoft,
    borderRadius: ADMIN_RADII.input,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: ADMIN_FONTS.medium,
    color: COLORS.ink,
    marginBottom: 10,
  },
  filterRow: { gap: 8, paddingBottom: 10 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: ADMIN_RADII.pill, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontFamily: ADMIN_FONTS.semiBold, fontSize: 12, color: COLORS.body, textTransform: 'capitalize' },
  filterChipTextActive: { color: COLORS.white },

  heroCard: {
    backgroundColor: COLORS.card,
    borderRadius: ADMIN_RADII.card,
    padding: ADMIN_SPACING.cardPadding,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    ...ADMIN_SHADOWS.card,
  },
  heroHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  heroTitle: { fontFamily: ADMIN_FONTS.extraBold, fontSize: 16, color: COLORS.ink },
  heroText: { marginTop: 4, fontFamily: ADMIN_FONTS.medium, fontSize: 12, color: COLORS.body, lineHeight: 18 },
  heroActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: ADMIN_RADII.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...ADMIN_SHADOWS.button,
  },
  primaryButtonText: { fontFamily: ADMIN_FONTS.bold, color: COLORS.white, fontSize: 12 },
  secondaryButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.paleGreen, borderRadius: ADMIN_RADII.pill, paddingHorizontal: 12, paddingVertical: 10 },
  secondaryButtonText: { fontFamily: ADMIN_FONTS.bold, color: COLORS.primary, fontSize: 12 },

  sectionHeader: { marginTop: 8, marginBottom: 8 },
  sectionTitle: { fontFamily: ADMIN_FONTS.extraBold, fontSize: 14, color: COLORS.ink },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  infoCard: { flex: 1, minWidth: '30%', backgroundColor: COLORS.surfaceSoft, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: COLORS.border },
  infoValue: { fontFamily: ADMIN_FONTS.extraBold, fontSize: 20, color: COLORS.ink },
  infoLabel: { marginTop: 2, fontFamily: ADMIN_FONTS.medium, fontSize: 11, color: COLORS.body },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: ADMIN_RADII.card,
    padding: ADMIN_SPACING.cardPadding,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...ADMIN_SHADOWS.card,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.paleGreen, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: ADMIN_FONTS.bold, fontSize: 18, color: COLORS.primary },
  cardMain: { flex: 1 },
  cardTitle: { fontFamily: ADMIN_FONTS.bold, fontSize: 15, color: COLORS.ink },
  cardSub: { marginTop: 3, fontFamily: ADMIN_FONTS.medium, fontSize: 12, color: COLORS.body },
  cardMeta: { marginTop: 3, fontFamily: ADMIN_FONTS.medium, fontSize: 11, color: COLORS.muted },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontFamily: ADMIN_FONTS.bold, fontSize: 10, textTransform: 'uppercase' },
  businessBox: { backgroundColor: COLORS.surfaceSoft, borderRadius: 12, padding: 10, marginTop: 12 },
  businessText: { fontFamily: ADMIN_FONTS.medium, fontSize: 12, color: COLORS.body, marginBottom: 2 },
  noBusiness: { fontFamily: ADMIN_FONTS.medium, fontSize: 12, color: COLORS.muted, marginTop: 10 },

  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: COLORS.paleGreen },
  actionButtonDisabled: { backgroundColor: COLORS.surfaceSoft },
  actionText: { fontFamily: ADMIN_FONTS.bold, fontSize: 11, color: COLORS.primary },
  actionTextDisabled: { color: COLORS.muted },

  sectionMiniTitle: { marginTop: 12, marginBottom: 6, fontFamily: ADMIN_FONTS.bold, fontSize: 11, color: COLORS.body, textTransform: 'uppercase' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingRight: 8 },
  assignmentChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: ADMIN_RADII.pill, backgroundColor: COLORS.surfaceSoft, borderWidth: 1, borderColor: COLORS.border },
  assignmentChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  assignmentChipText: { fontFamily: ADMIN_FONTS.semiBold, fontSize: 12, color: COLORS.body, textTransform: 'capitalize' },
  assignmentChipTextActive: { color: COLORS.white },

  tableRow: { backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  tableName: { fontFamily: ADMIN_FONTS.bold, fontSize: 14, color: COLORS.ink, textTransform: 'capitalize' },
  tableError: { maxWidth: 260, marginTop: 4, fontFamily: ADMIN_FONTS.medium, fontSize: 11, color: COLORS.negative },
  tableCount: { fontFamily: ADMIN_FONTS.extraBold, fontSize: 18, color: COLORS.primary },
  tableCountError: { color: COLORS.negative },

  warningCard: { flexDirection: 'row', gap: 8, backgroundColor: COLORS.warnBg, borderColor: COLORS.warnBorder, borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 12 },
  warningText: { flex: 1, fontFamily: ADMIN_FONTS.medium, color: COLORS.warnText, fontSize: 12, lineHeight: 17 },

  loading: { alignItems: 'center', padding: 32 },
  loadingText: { marginTop: 10, fontFamily: ADMIN_FONTS.medium, color: COLORS.body },
  errorCard: { backgroundColor: COLORS.alertBg, borderColor: COLORS.alertBorder, borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 12 },
  errorText: { fontFamily: ADMIN_FONTS.medium, color: COLORS.negative, fontSize: 12 },
  empty: { alignItems: 'center', padding: 32 },
  emptyText: { marginTop: 8, fontFamily: ADMIN_FONTS.medium, color: COLORS.body },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(18, 42, 31, 0.48)' },
  modalCard: { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle: { fontFamily: ADMIN_FONTS.extraBold, fontSize: 18, color: COLORS.ink },
  input: {
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: ADMIN_RADII.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontFamily: ADMIN_FONTS.medium,
    color: COLORS.ink,
  },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
});
