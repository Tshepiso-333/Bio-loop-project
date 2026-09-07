import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../supabase';
import {
  assignCollectorToPickup,
  assignPickup,
  convertManualRequestToPickup,
  createAdminAlert,
  createManualPickupRequest,
  deleteAlert,
  loadAdminBundle,
  updateAlertRead,
  updateBusinessStatus,
  updateBusinessVerification,
  updatePickupStatus,
  updateProfileStatus,
  updateRestaurantPrimaryManufacturer,
  updateWithdrawalStatus,
} from '../services/adminService';
import { updatePlatformSettings } from '../services/payoutService';

const AdminContext = createContext(null);

const EMPTY_STATE = {
  profiles: [],
  users: [],
  restaurants: [],
  collectors: [],
  manufacturers: [],
  pickups: [],
  manualPickupRequests: [],
  tanks: [],
  qualityLogs: [],
  earnings: [],
  withdrawals: [],
  alerts: [],
  tankReadings: [],
  activityLogs: [],
  pickupSchedules: [],
  marketRates: [],
  manufacturerInventory: [],
  forecasts: [],
  aiChatMessages: [],
  platformSettings: [],
  paymentTransactions: [],
  tableOverview: [],
  errors: [],
};

export function AdminProvider({ children }) {
  const [state, setState] = useState(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadAdminData = useCallback(async () => {
    setError(null);
    try {
      const bundle = await loadAdminBundle();
      setState({ ...EMPTY_STATE, ...bundle });
    } catch (err) {
      setError(err.message ?? 'Could not load admin data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const refreshAdmin = useCallback(async () => {
    setRefreshing(true);
    await loadAdminData();
  }, [loadAdminData]);

  const runMutation = useCallback(
    async (mutation) => {
      const result = await mutation();
      await loadAdminData();
      return result;
    },
    [loadAdminData]
  );

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  // Realtime: admin sees everything, so any change on these three tables
  // (see docs/migrations/031_enable_realtime.sql) just triggers a full
  // bundle refresh rather than a per-row merge — simplest correct option
  // given loadAdminBundle already fetches everything in parallel. Debounced
  // so a burst of changes (e.g. the auto-dispatch trigger inserting several
  // alerts at once) doesn't fire several refreshes back to back.
  const refreshTimerRef = useRef(null);
  useEffect(() => {
    const debouncedRefresh = () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => {
        loadAdminData();
      }, 800);
    };

    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pickups' }, debouncedRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, debouncedRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'manual_pickup_requests' }, debouncedRefresh)
      .subscribe();

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [loadAdminData]);

  const value = useMemo(
    () => ({
      ...state,
      loading,
      refreshing,
      error,
      loadAdminData,
      refreshAdmin,
      updateProfileStatus: (userId, status) =>
        runMutation(() => updateProfileStatus(userId, status)),
      updateBusinessStatus: (table, id, status) =>
        runMutation(() => updateBusinessStatus(table, id, status)),
      updateBusinessVerification: (table, id, isVerified, notes) =>
        runMutation(() => updateBusinessVerification(table, id, isVerified, notes)),
      assignPickup: (pickupId, payload) =>
        runMutation(() => assignPickup(pickupId, payload)),
      updatePickupStatus: (pickupId, status) =>
        runMutation(() => updatePickupStatus(pickupId, status)),
      updateWithdrawalStatus: (withdrawalId, status) =>
        runMutation(() => updateWithdrawalStatus(withdrawalId, status)),
      createAdminAlert: (payload) =>
        runMutation(() => createAdminAlert(payload)),
      updateAlertRead: (alertId, isRead) =>
        runMutation(() => updateAlertRead(alertId, isRead)),
      deleteAlert: (alertId) =>
        runMutation(() => deleteAlert(alertId)),
      createManualPickupRequest: (payload) =>
        runMutation(() => createManualPickupRequest(payload)),
      convertManualRequestToPickup: (manualRequest) =>
        runMutation(() => convertManualRequestToPickup(manualRequest)),
      assignCollectorToPickup: (pickupId, collector) =>
        runMutation(() => assignCollectorToPickup(pickupId, collector)),
      updateRestaurantPrimaryManufacturer: (restaurantId, manufacturerId) =>
        runMutation(() => updateRestaurantPrimaryManufacturer(restaurantId, manufacturerId)),
      updatePlatformSettings: (settingsId, payload) =>
        runMutation(() => updatePlatformSettings(settingsId, payload)),
    }),
    [state, loading, refreshing, error, loadAdminData, refreshAdmin, runMutation]
  );

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdminContext() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdminContext must be used within an AdminProvider');
  }
  return context;
}

export { AdminContext };
