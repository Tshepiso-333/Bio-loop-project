import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../AuthContext';
import { useAdminContext } from '../../src/contexts/AdminContext';
import DispatchBoard from '../../src/components/admin/DispatchBoard';

const COLORS = {
  bg: '#F4F4EF',
  card: '#FFFFFF',
  green: '#10b981',
  greenDark: '#059669',
  red: '#dc2626',
  amber: '#f59e0b',
  blue: '#2563eb',
  text: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
};

const ROLE_FILTERS = ['all', 'restaurant', 'collector', 'manufacturer', 'admin'];
const MAIN_TABS = [
  { key: 'overview', label: 'Overview', icon: 'grid-outline' },
  { key: 'users', label: 'Users', icon: 'people-outline' },
  { key: 'dispatch', label: 'Dispatch', icon: 'navigate-outline' },
  { key: 'pickups', label: 'Pickups', icon: 'git-branch-outline' },
  { key: 'finance', label: 'Finance', icon: 'cash-outline' },
  { key: 'alerts', label: 'Alerts', icon: 'notifications-outline' },
  { key: 'health', label: 'Health', icon: 'server-outline' },
];
const PICKUP_STATUSES = ['pending', 'assigned', 'scheduled', 'in_transit', 'arrival', 'in_progress', 'completed', 'cancelled'];
const WITHDRAWAL_STATUSES = ['pending', 'approved', 'rejected'];
const ALERT_TYPES = ['info', 'warning', 'critical'];
const ALERT_CATEGORIES = ['inventory', 'delivery', 'quality', 'info'];
const REQUEST_URGENCY = ['standard', 'urgent'];

function getStatusColor(status) {
  if (status === 'active' || status === 'completed' || status === 'approved') return COLORS.green;
  if (status === 'pending' || status === 'scheduled' || status === 'standard') return COLORS.amber;
  if (status === 'inactive' || status === 'cancelled' || status === 'rejected' || status === 'critical' || status === 'urgent') return COLORS.red;
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
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const admin = useAdminContext();
  const [activeTab, setActiveTab] = useState('overview');
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
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ commission_pct: '0', driver_flat_rate_per_pickup: '0' });

  const stats = useMemo(() => {
    const activeUsers = admin.users.filter((user) => user.status === 'active').length;
    const pendingUsers = admin.users.filter((user) => user.status === 'pending').length;
    const unassignedPickups = admin.pickups.filter((pickup) => !pickup.collector_id || !pickup.manufacturer_id).length;
    const pendingWithdrawals = admin.withdrawals.filter((withdrawal) => withdrawal.status !== 'approved' && withdrawal.status !== 'rejected').length;
    const unreadAlerts = admin.alerts.filter((alert) => !alert.is_read).length;

    return [
      {
        key: 'users',
        label: `${admin.users.length} users`,
        breakdown: `${activeUsers} active · ${pendingUsers} pending`,
        icon: 'people-outline',
        gradient: [COLORS.green, COLORS.greenDark],
      },
      {
        key: 'unassigned',
        label: `${unassignedPickups} unassigned`,
        breakdown: 'Tap to dispatch',
        icon: 'navigate-outline',
        gradient: [COLORS.blue, '#1d4ed8'],
        onPress: () => setActiveTab('dispatch'),
      },
      {
        key: 'withdrawals',
        label: `${pendingWithdrawals} withdrawals`,
        breakdown: 'Tap to review',
        icon: 'cash-outline',
        gradient: [COLORS.amber, '#b45309'],
        onPress: () => setActiveTab('finance'),
      },
      {
        key: 'alerts',
        label: `${unreadAlerts} unread alerts`,
        breakdown: 'Tap to view',
        icon: 'notifications-outline',
        gradient: [COLORS.red, '#991b1b'],
        onPress: () => setActiveTab('alerts'),
      },
    ];
  }, [admin.users, admin.pickups, admin.withdrawals, admin.alerts]);

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
    if (Number.isNaN(commissionPct) || Number.isNaN(driverRate)) {
      Alert.alert('Invalid values', 'Enter numbers for both fields.');
      return;
    }

    setSubmitting(true);
    try {
      await admin.updatePlatformSettings(settingsId, {
        commission_pct: commissionPct,
        driver_flat_rate_per_pickup: driverRate,
      });
      setShowSettingsModal(false);
    } catch (err) {
      Alert.alert('Save failed', err.message ?? 'Unable to update settings.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderHeader = () => (
    <>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.greenDark} />
      <LinearGradient
        colors={[COLORS.green, COLORS.greenDark, '#047857']}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>BioLoop Admin</Text>
            <Text style={styles.headerSub}>Operations center for users, pickups, finance, and alerts</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.headerButton} onPress={() => navigation.navigate('AdminSettings')}>
              <Ionicons name="settings-outline" size={20} color="#fff" />
            </Pressable>
            <Pressable style={styles.headerButton} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={20} color="#fff" />
            </Pressable>
          </View>
        </View>
      </LinearGradient>
    </>
  );

  const renderStats = () => (
    <View style={styles.statsGrid}>
      {stats.map((item) => {
        const Wrapper = item.onPress ? Pressable : View;
        return (
          <Wrapper key={item.key} style={styles.statCard} onPress={item.onPress}>
            <View style={styles.statCardTop}>
              <LinearGradient colors={item.gradient} style={styles.statIcon}>
                <Ionicons name={item.icon} size={18} color="#fff" />
              </LinearGradient>
              {item.onPress ? <Ionicons name="chevron-forward" size={16} color={COLORS.muted} /> : null}
            </View>
            <Text style={styles.statValue}>{item.label}</Text>
            <Text style={styles.statLabel}>{item.breakdown}</Text>
          </Wrapper>
        );
      })}
    </View>
  );

  const renderMainTabs = () => (
    <View style={styles.mainTabs}>
      {MAIN_TABS.map((tab) => {
        const active = activeTab === tab.key;
        return (
          <Pressable key={tab.key} style={[styles.mainTab, active && styles.mainTabActive]} onPress={() => setActiveTab(tab.key)}>
            <Ionicons name={tab.icon} size={14} color={active ? '#fff' : COLORS.muted} />
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
            <Ionicons name="notifications-outline" size={15} color="#fff" />
            <Text style={styles.primaryButtonText}>Create alert</Text>
          </Pressable>
        </View>

        <View style={styles.heroActions}>
          <Pressable style={styles.secondaryButton} onPress={() => setShowRequestModal(true)}>
            <Ionicons name="add-circle-outline" size={16} color={COLORS.greenDark} />
            <Text style={styles.secondaryButtonText}>Manual pickup request</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => setActiveTab('health')}>
            <Ionicons name="server-outline" size={16} color={COLORS.greenDark} />
            <Text style={styles.secondaryButtonText}>Inspect data health</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Pending work</Text>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoCard}>
          <Text style={styles.infoValue}>{pendingWithdrawals.length}</Text>
          <Text style={styles.infoLabel}>Finance approvals</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoValue}>{admin.pickups.filter((pickup) => !pickup.collector_id || !pickup.manufacturer_id).length}</Text>
          <Text style={styles.infoLabel}>Unassigned pickups</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoValue}>{admin.alerts.filter((alert) => !alert.is_read).length}</Text>
          <Text style={styles.infoLabel}>Unread alerts</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent alerts</Text>
      </View>
      {admin.alerts.slice(0, 4).map((alert) => (
        <View key={alert.id} style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.avatar}>
              <Ionicons name="notifications-outline" size={18} color={COLORS.greenDark} />
            </View>
            <View style={styles.cardMain}>
              <Text style={styles.cardTitle}>{alert.title}</Text>
              <Text style={styles.cardSub}>{alert.message}</Text>
              <Text style={styles.cardMeta}>{formatDateTime(alert.created_at)}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: `${getStatusColor(alert.type)}22` }]}> 
              <Text style={[styles.badgeText, { color: getStatusColor(alert.type) }]}>{alert.type}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const renderUsers = () => (
    <View>
      <TextInput
        style={styles.search}
        placeholder="Search users by name or email"
        placeholderTextColor="#94a3b8"
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

  const renderPickups = () => (
    <View>
      {admin.pickups.map((pickup) => (
        <PickupCard
          key={pickup.id}
          pickup={pickup}
          collectors={admin.collectors}
          manufacturers={admin.manufacturers}
          onAssignCollector={(collectorId) => withMutation('Assign collector', () => admin.assignPickup(pickup.id, { collector_id: collectorId, status: pickup.status ?? 'scheduled' }))}
          onAssignManufacturer={(manufacturerId) => withMutation('Assign manufacturer', () => admin.assignPickup(pickup.id, { manufacturer_id: manufacturerId, status: pickup.status ?? 'scheduled' }))}
          onSetStatus={(status) => withMutation('Pickup status', () => admin.updatePickupStatus(pickup.id, status))}
        />
      ))}

      {admin.pickups.length === 0 ? <EmptyState label="No pickups found." /> : null}
    </View>
  );

  const renderFinance = () => (
    <View>
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Wallet and payout controls</Text>
            <Text style={styles.heroText}>Approve or reject incoming withdrawal requests from the live finance queue.</Text>
          </View>
          <Pressable style={styles.primaryButton} onPress={openSettingsModal}>
            <Ionicons name="options-outline" size={15} color="#fff" />
            <Text style={styles.primaryButtonText}>Settings</Text>
          </Pressable>
        </View>
      </View>
      {admin.restaurantWallets.map((wallet) => (
        <View key={wallet.id} style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.avatar}>
              <Ionicons name="wallet-outline" size={18} color={COLORS.greenDark} />
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
              <Ionicons name="wallet-outline" size={18} color={COLORS.greenDark} />
            </View>
            <View style={styles.cardMain}>
              <Text style={styles.cardTitle}>Driver wallet</Text>
              <Text style={styles.cardSub}>Wallet ID: {wallet.id}</Text>
              <Text style={styles.cardMeta}>Balance {currency(wallet.balance)}</Text>
            </View>
          </View>
        </View>
      ))}

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
                <Ionicons name="cash-outline" size={18} color={COLORS.greenDark} />
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
              <ActionButton label="Approve" icon="checkmark-circle-outline" onPress={() => withMutation('Approve withdrawal', () => admin.updateWithdrawalStatus(withdrawal.id, 'approved'))} />
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
            <Ionicons name="add-outline" size={15} color="#fff" />
            <Text style={styles.primaryButtonText}>New alert</Text>
          </Pressable>
        </View>
      </View>

      {admin.alerts.map((alert) => (
        <View key={alert.id} style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.avatar}>
              <Ionicons name="notifications-outline" size={18} color={COLORS.greenDark} />
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
          <Ionicons name="warning-outline" size={18} color={COLORS.amber} />
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
      {renderHeader()}
      <ScrollView refreshControl={<RefreshControl refreshing={admin.refreshing} onRefresh={admin.refreshAdmin} />} contentContainerStyle={styles.content}>
        {activeTab === 'overview' ? renderStats() : null}
        {renderMainTabs()}

        {admin.loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={COLORS.green} />
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
        {!admin.loading && activeTab === 'dispatch' ? (
          <DispatchBoard
            admin={admin}
            ui={{ styles, COLORS, getStatusColor, formatDate, labelFromKey, AssignmentRow, ActionButton, EmptyState }}
          />
        ) : null}
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
                value={alertForm.title}
                onChangeText={(value) => setAlertForm((prev) => ({ ...prev, title: value }))}
              />
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Alert message"
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
                {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.primaryButtonText}>Save alert</Text>}
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
                value={requestForm.reason}
                onChangeText={(value) => setRequestForm((prev) => ({ ...prev, reason: value }))}
              />
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Additional notes"
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
                {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.primaryButtonText}>Create request</Text>}
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
              multiline
              value={verificationNotes}
              onChangeText={setVerificationNotes}
            />

            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setShowVerificationModal(false)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={handleConfirmVerification} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.primaryButtonText}>Confirm</Text>}
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
              keyboardType="numeric"
              value={settingsForm.commission_pct}
              onChangeText={(value) => setSettingsForm((prev) => ({ ...prev, commission_pct: value }))}
            />

            <Text style={styles.sectionMiniTitle}>Driver flat rate per pickup (R)</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              keyboardType="numeric"
              value={settingsForm.driver_flat_rate_per_pickup}
              onChangeText={(value) => setSettingsForm((prev) => ({ ...prev, driver_flat_rate_per_pickup: value }))}
            />

            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setShowSettingsModal(false)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={handleSaveSettings} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.primaryButtonText}>Save</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function UserCard({ user, onToggleProfile, onToggleBusinessStatus, onToggleVerification, manufacturers, onAssignManufacturer }) {
  const statusColor = getStatusColor(user.status);
  const businessStatusColor = getStatusColor(user.business?.status);

  return (
    <View style={styles.card}>
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
    </View>
  );
}

function PickupCard({ pickup, collectors, manufacturers, onAssignCollector, onAssignManufacturer, onSetStatus }) {
  const statusColor = getStatusColor(pickup.status);

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardMain}>
          <Text style={styles.cardTitle}>{pickup.restaurants?.name ?? 'Unknown restaurant'}</Text>
          <Text style={styles.cardSub}>{pickup.restaurants?.address ?? 'No address'}</Text>
          <Text style={styles.cardMeta}>{formatDate(pickup.pickup_date)} · {pickup.estimated_volume_liters ?? pickup.actual_volume_liters ?? 0}L</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: `${statusColor}22` }]}> 
          <Text style={[styles.badgeText, { color: statusColor }]}>{labelFromKey(pickup.status)}</Text>
        </View>
      </View>

      <Text style={styles.sectionMiniTitle}>Driver</Text>
      <AssignmentRow items={collectors} currentId={pickup.collector_id} getLabel={(collector) => collector.full_name ?? collector.employee_code ?? 'Collector'} onSelect={onAssignCollector} />

      <Text style={styles.sectionMiniTitle}>Manufacturer</Text>
      <AssignmentRow items={manufacturers} currentId={pickup.manufacturer_id} getLabel={(manufacturer) => manufacturer.name ?? 'Manufacturer'} onSelect={onAssignManufacturer} />

      <Text style={styles.sectionMiniTitle}>Status</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {PICKUP_STATUSES.map((status) => {
          const active = pickup.status === status;
          return (
            <Pressable key={status} style={[styles.assignmentChip, active && styles.assignmentChipActive]} onPress={() => onSetStatus(status)}>
              <Text style={[styles.assignmentChipText, active && styles.assignmentChipTextActive]}>{labelFromKey(status)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
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
      <Ionicons name={icon} size={14} color={disabled ? '#94a3b8' : COLORS.greenDark} />
      <Text style={[styles.actionText, disabled && styles.actionTextDisabled]}>{label}</Text>
    </Pressable>
  );
}

function EmptyState({ label }) {
  return (
    <View style={styles.empty}>
      <Ionicons name="file-tray-outline" size={32} color="#94a3b8" />
      <Text style={styles.emptyText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 20, paddingBottom: 18 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerSub: { marginTop: 4, color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 32 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginTop: 8 },
  statLabel: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  mainTabs: { flexDirection: 'row', backgroundColor: '#e8eee9', borderRadius: 14, padding: 4, marginVertical: 14, gap: 4, flexWrap: 'wrap' },
  mainTab: { flex: 1, minWidth: '30%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  mainTabActive: { backgroundColor: COLORS.green },
  mainTabText: { fontSize: 12, fontWeight: '700', color: COLORS.muted },
  mainTabTextActive: { color: '#fff' },
  search: { backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 12, color: COLORS.text, marginBottom: 10 },
  filterRow: { gap: 8, paddingBottom: 10 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  filterChipText: { fontSize: 12, fontWeight: '700', color: COLORS.muted, textTransform: 'capitalize' },
  filterChipTextActive: { color: '#fff' },
  heroCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  heroHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  heroTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  heroText: { marginTop: 4, fontSize: 12, color: COLORS.muted, lineHeight: 18 },
  heroActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  primaryButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.green, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 10 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  secondaryButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ecfdf5', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 10 },
  secondaryButtonText: { color: COLORS.greenDark, fontWeight: '700', fontSize: 12 },
  sectionHeader: { marginTop: 8, marginBottom: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  infoCard: { flex: 1, minWidth: '30%', backgroundColor: '#f8fafc', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: COLORS.border },
  infoValue: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  infoLabel: { marginTop: 2, fontSize: 11, color: COLORS.muted },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#d1fae5', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: COLORS.greenDark },
  cardMain: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  cardSub: { marginTop: 3, fontSize: 12, color: COLORS.muted },
  cardMeta: { marginTop: 3, fontSize: 11, color: '#94a3b8' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  businessBox: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 10, marginTop: 12 },
  businessText: { fontSize: 12, color: COLORS.muted, marginBottom: 2 },
  noBusiness: { fontSize: 12, color: '#94a3b8', marginTop: 10 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: '#ecfdf5' },
  actionButtonDisabled: { backgroundColor: '#f1f5f9' },
  actionText: { fontSize: 11, fontWeight: '800', color: COLORS.greenDark },
  actionTextDisabled: { color: '#94a3b8' },
  sectionMiniTitle: { marginTop: 12, marginBottom: 6, fontSize: 11, fontWeight: '800', color: COLORS.muted, textTransform: 'uppercase' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingRight: 8 },
  assignmentChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: COLORS.border },
  assignmentChipActive: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  assignmentChipText: { fontSize: 12, fontWeight: '700', color: COLORS.muted, textTransform: 'capitalize' },
  assignmentChipTextActive: { color: '#fff' },
  tableRow: { backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  tableName: { fontSize: 14, fontWeight: '800', color: COLORS.text, textTransform: 'capitalize' },
  tableError: { maxWidth: 260, marginTop: 4, fontSize: 11, color: COLORS.red },
  tableCount: { fontSize: 18, fontWeight: '800', color: COLORS.green },
  tableCountError: { color: COLORS.red },
  warningCard: { flexDirection: 'row', gap: 8, backgroundColor: '#fffbeb', borderColor: '#fde68a', borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 12 },
  warningText: { flex: 1, color: '#92400e', fontSize: 12, lineHeight: 17 },
  loading: { alignItems: 'center', padding: 32 },
  loadingText: { marginTop: 10, color: COLORS.muted },
  errorCard: { backgroundColor: '#fee2e2', borderColor: '#fecaca', borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 12 },
  errorText: { color: COLORS.red, fontSize: 12 },
  empty: { alignItems: 'center', padding: 32 },
  emptyText: { marginTop: 8, color: COLORS.muted },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.48)' },
  modalCard: { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10, color: COLORS.text },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
});
