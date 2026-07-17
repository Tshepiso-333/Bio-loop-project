import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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
  updateWithdrawalStatus,
} from '../services/adminService';

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
  restaurantWallets: [],
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
      updateBusinessVerification: (table, id, isVerified) =>
        runMutation(() => updateBusinessVerification(table, id, isVerified)),
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
