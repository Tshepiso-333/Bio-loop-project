import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';
import { useManufacturerContext } from '../../src/contexts/ManufacturerContext';

const AlertsScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [showRead, setShowRead] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const {
    alerts: contextAlerts = [],
    refreshManufacturer,
    updateAlertReadStatus,
    deleteAlert: deleteAlertFromContext,
  } = useManufacturerContext();

  const mapAlert = (a) => ({
    id: a.id,
    title: a.title ?? '—',
    message: a.message ?? '—',
    type: a.type ?? 'info',
    category: a.category ?? 'general',
    time: a.created_at ? new Date(a.created_at).toLocaleDateString() : '—',
    read: a.is_read ?? false,
    icon: a.type === 'critical' ? '⚠️' : a.type === 'warning' ? '⚠️' : 'ℹ️',
  });

  // Map real alerts from context or use empty placeholder
  const [alerts, setAlerts] = useState((contextAlerts || []).map(mapAlert));

  useEffect(() => {
    setAlerts((contextAlerts || []).map(mapAlert));
  }, [contextAlerts]);

  const handleRefresh = () => {
    setRefreshing(true);
    if (refreshManufacturer) {
      refreshManufacturer().then(() => setRefreshing(false));
    } else {
      setTimeout(() => setRefreshing(false), 1000);
    }
  };

  const markAsRead = async (id) => {
    setAlerts(alerts.map(alert =>
      alert.id === id ? { ...alert, read: true } : alert
    ));
    try {
      await updateAlertReadStatus(id, true);
    } catch (err) {
      console.error('Failed to mark alert as read:', err.message);
    }
  };

  const markAllAsRead = async () => {
    const unread = alerts.filter(alert => !alert.read);
    setAlerts(alerts.map(alert => ({ ...alert, read: true })));
    try {
      await Promise.all(unread.map(alert => updateAlertReadStatus(alert.id, true)));
    } catch (err) {
      console.error('Failed to mark all alerts as read:', err.message);
    }
  };

  const deleteAlert = async (id) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
    try {
      await deleteAlertFromContext(id);
    } catch (err) {
      console.error('Failed to delete alert:', err.message);
    }
  };

  const getAlertStyle = (type) => {
    switch(type) {
      case 'critical':
        return {
          gradient: ['#ef4444', '#dc2626'],
          borderColor: '#ef4444',
          iconBg: '#ef444420',
        };
      case 'warning':
        return {
          gradient: ['#f59e0b', '#d97706'],
          borderColor: '#f59e0b',
          iconBg: '#f59e0b20',
        };
      case 'success':
        return {
          gradient: ['#10b981', '#059669'],
          borderColor: '#10b981',
          iconBg: '#10b98120',
        };
      default:
        return {
          gradient: ['#3b82f6', '#2563eb'],
          borderColor: '#3b82f6',
          iconBg: '#3b82f620',
        };
    }
  };

  // Icons
  const BellIcon = ({ color = '#fff', size = 22 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M13.73 21a2 2 0 01-3.46 0" stroke={color} strokeWidth={1.6} strokeLinecap="round"/>
    </Svg>
  );

  const FilterIcon = ({ color = '#fff', size = 18 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth={1.6} strokeLinecap="round"/>
      <Line x1="6" y1="12" x2="18" y2="12" stroke={color} strokeWidth={1.6} strokeLinecap="round"/>
      <Line x1="9" y1="18" x2="15" y2="18" stroke={color} strokeWidth={1.6} strokeLinecap="round"/>
    </Svg>
  );

  const CheckIcon = ({ color = '#fff', size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="20 6 9 17 4 12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );

  const TrashIcon = ({ color = '#fff', size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );

  const UnreadDot = () => (
    <View style={styles.unreadDot} />
  );

  // Header Component
  const Header = () => (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#dc2626" />
      <LinearGradient
        colors={['#ef4444', '#dc2626', '#b91c1c']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Alerts & Notifications</Text>
            <Text style={styles.headerSubtitle}>
              {alerts.filter(a => !a.read).length} unread
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.markAllButton}
            onPress={markAllAsRead}
          >
            <CheckIcon color="#fff" size={16} />
            <Text style={styles.markAllText}>Mark all</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </>
  );

  // Filter categories
  const filters = [
    { id: 'all', label: 'All', count: alerts.length },
    { id: 'unread', label: 'Unread', count: alerts.filter(a => !a.read).length },
    { id: 'critical', label: 'Critical', count: alerts.filter(a => a.type === 'critical').length },
    { id: 'delivery', label: 'Delivery', count: alerts.filter(a => a.category === 'delivery').length },
    { id: 'inventory', label: 'Inventory', count: alerts.filter(a => a.category === 'inventory').length },
    { id: 'quality', label: 'Quality', count: alerts.filter(a => a.category === 'quality').length },
  ];

  // Filter alerts based on selected filter
  const filteredAlerts = alerts.filter(alert => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'unread') return !alert.read;
    if (selectedFilter === 'critical') return alert.type === 'critical';
    return alert.category === selectedFilter;
  });

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterChip,
                selectedFilter === filter.id && styles.filterChipActive
              ]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Text style={[
                styles.filterChipText,
                selectedFilter === filter.id && styles.filterChipTextActive
              ]}>
                {filter.label}
              </Text>
              {filter.count > 0 && (
                <View style={[
                  styles.filterBadge,
                  selectedFilter === filter.id && styles.filterBadgeActive
                ]}>
                  <Text style={[
                    styles.filterBadgeText,
                    selectedFilter === filter.id && styles.filterBadgeTextActive
                  ]}>
                    {filter.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredAlerts.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <BellIcon color="#9ca3af" size={48} />
            </View>
            <Text style={styles.emptyTitle}>No Alerts</Text>
            <Text style={styles.emptyText}>
              You're all caught up! No new alerts to display.
            </Text>
          </View>
        ) : (
          <View style={styles.alertsList}>
            {filteredAlerts.map((alert) => {
              const alertStyle = getAlertStyle(alert.type);
              return (
                <TouchableOpacity
                  key={alert.id}
                  style={[
                    styles.alertCard,
                    !alert.read && styles.alertCardUnread,
                    { borderLeftColor: alertStyle.borderColor }
                  ]}
                  onPress={() => markAsRead(alert.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.alertIcon, { backgroundColor: alertStyle.iconBg }]}>
                    <Text style={styles.alertIconEmoji}>{alert.icon}</Text>
                  </View>
                  
                  <View style={styles.alertContent}>
                    <View style={styles.alertHeader}>
                      <Text style={styles.alertTitle}>{alert.title}</Text>
                      {!alert.read && <UnreadDot />}
                    </View>
                    <Text style={styles.alertMessage}>{alert.message}</Text>
                    <View style={styles.alertFooter}>
                      <Text style={styles.alertTime}>{alert.time}</Text>
                      <View style={styles.alertActions}>
                        <TouchableOpacity 
                          style={styles.alertAction}
                          onPress={() => markAsRead(alert.id)}
                        >
                          <CheckIcon color="#10b981" size={14} />
                          <Text style={styles.alertActionText}>Mark read</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.alertAction}
                          onPress={() => deleteAlert(alert.id)}
                        >
                          <TrashIcon color="#ef4444" size={14} />
                          <Text style={[styles.alertActionText, styles.deleteText]}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Quick Actions Card */}
        <LinearGradient
          colors={['#1a1a2e', '#16213e']}
          style={styles.quickActionsCard}
        >
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickAction}>
              <View style={styles.quickActionIcon}>
                <Text style={styles.quickActionEmoji}>📊</Text>
              </View>
              <Text style={styles.quickActionLabel}>Quality Report</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickAction}>
              <View style={styles.quickActionIcon}>
                <Text style={styles.quickActionEmoji}>📦</Text>
              </View>
              <Text style={styles.quickActionLabel}>Inventory</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickAction}>
              <View style={styles.quickActionIcon}>
                <Text style={styles.quickActionEmoji}>🚚</Text>
              </View>
              <Text style={styles.quickActionLabel}>Schedule</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickAction}>
              <View style={styles.quickActionIcon}>
                <Text style={styles.quickActionEmoji}>📞</Text>
              </View>
              <Text style={styles.quickActionLabel}>Support</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingTop: 48,
    paddingBottom: 16,
  },
  headerContent: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '600',
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.9,
    marginTop: 2,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  markAllText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  filterContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  filtersScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
  },
  filterChipActive: {
    backgroundColor: '#ef4444',
  },
  filterChipText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  filterBadge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  filterBadgeText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
  },
  filterBadgeTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  alertsList: {
    padding: 16,
    gap: 12,
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  alertCardUnread: {
    backgroundColor: '#fef2f2',
  },
  alertIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertIconEmoji: {
    fontSize: 24,
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  alertMessage: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 10,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertTime: {
    fontSize: 11,
    color: '#9ca3af',
  },
  alertActions: {
    flexDirection: 'row',
    gap: 12,
  },
  alertAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  alertActionText: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '500',
  },
  deleteText: {
    color: '#ef4444',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  quickActionsCard: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickAction: {
    alignItems: 'center',
    gap: 8,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionEmoji: {
    fontSize: 24,
  },
  quickActionLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
});

export default AlertsScreen;