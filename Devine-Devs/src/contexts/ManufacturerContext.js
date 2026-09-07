import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { supabase } from '../../supabase';
import { cacheKeys, readCache, writeCache } from '../lib/cache';
import {
  loadManufacturerBundle,
  updateAlertReadStatus,
  deleteAlert as deleteAlertService,
  confirmDeliveryReceived,
} from '../services/manufacturerService';

const ManufacturerContext = createContext(null);

export { ManufacturerContext };

const EMPTY_STATE = {
  manufacturer: null,
  inventory: null,
  tanks: [],
  forecasts: [],
  pickups: [],
  alerts: [],
  assignedRestaurants: [],
};

export const ManufacturerProvider = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const applyBundle = useCallback((bundle) => {
    setState({
      manufacturer: bundle.manufacturer ?? null,
      inventory: bundle.inventory ?? null,
      tanks: bundle.tanks ?? [],
      forecasts: bundle.forecasts ?? [],
      pickups: bundle.pickups ?? [],
      alerts: bundle.alerts ?? [],
      assignedRestaurants: bundle.assignedRestaurants ?? [],
    });
  }, []);

  const loadManufacturerData = useCallback(async (userId, { fromCache = true } = {}) => {
    if (!userId) {
      applyBundle(EMPTY_STATE);
      setLoading(false);
      return;
    }

    const cacheKey = cacheKeys.manufacturer(userId);

    if (fromCache) {
      const cached = await readCache(cacheKey);
      if (cached) {
        applyBundle(cached);
        setLoading(false);
      } else {
        setLoading(true);
      }
    }

    try {
      setError(null);
      const bundle = await loadManufacturerBundle(userId);
      applyBundle(bundle);
      await writeCache(cacheKey, bundle);
    } catch (err) {
      console.error('Error loading manufacturer data:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [applyBundle]);

  const refreshManufacturer = useCallback(async () => {
    if (!user?.id) return;
    setRefreshing(true);
    await loadManufacturerData(user.id, { fromCache: false });
  }, [user?.id, loadManufacturerData]);

  const handleUpdateAlertReadStatus = useCallback(async (alertId, isRead) => {
    const updated = await updateAlertReadStatus(alertId, isRead);
    setState((prev) => {
      const next = {
        ...prev,
        alerts: prev.alerts.map((a) => (a.id === alertId ? updated : a)),
      };
      if (user?.id) writeCache(cacheKeys.manufacturer(user.id), next);
      return next;
    });
    return updated;
  }, [user?.id]);

  const handleDeleteAlert = useCallback(async (alertId) => {
    await deleteAlertService(alertId);
    setState((prev) => {
      const next = {
        ...prev,
        alerts: prev.alerts.filter((a) => a.id !== alertId),
      };
      if (user?.id) writeCache(cacheKeys.manufacturer(user.id), next);
      return next;
    });
  }, [user?.id]);

  // Refetches the whole bundle rather than patching the pickup in place —
  // confirmDeliveryReceived's select only carries the joined fields it needs
  // for notifications, not the full shape other screens (Suppliers, Quality)
  // expect on pickups.restaurants, so a partial merge would silently drop data.
  const handleConfirmDelivery = useCallback(async (pickupId, gatewayReference) => {
    const updated = await confirmDeliveryReceived(pickupId, gatewayReference);
    await refreshManufacturer();
    return updated;
  }, [refreshManufacturer]);

  useEffect(() => {
    if (user?.id) {
      loadManufacturerData(user.id);
    } else {
      applyBundle(EMPTY_STATE);
      setLoading(false);
      setError(null);
    }
  }, [user?.id, loadManufacturerData, applyBundle]);

  // Realtime: pickups routed to this manufacturer (including newly
  // auto-dispatched ones) plus their own alerts.
  const realtimeTimerRef = useRef(null);
  const manufacturerId = state.manufacturer?.id;
  useEffect(() => {
    if (!user?.id || !manufacturerId) return undefined;

    const debouncedRefresh = () => {
      if (realtimeTimerRef.current) clearTimeout(realtimeTimerRef.current);
      realtimeTimerRef.current = setTimeout(() => {
        loadManufacturerData(user.id, { fromCache: false });
      }, 800);
    };

    const channel = supabase
      .channel(`manufacturer-realtime-${manufacturerId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pickups', filter: `manufacturer_id=eq.${manufacturerId}` },
        debouncedRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'alerts', filter: `user_id=eq.${user.id}` },
        debouncedRefresh
      )
      .subscribe();

    return () => {
      if (realtimeTimerRef.current) clearTimeout(realtimeTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [user?.id, manufacturerId, loadManufacturerData]);

  const value = useMemo(() => ({
    ...state,
    loading,
    refreshing,
    error,
    loadManufacturerData,
    refreshManufacturer,
    updateAlertReadStatus: handleUpdateAlertReadStatus,
    deleteAlert: handleDeleteAlert,
    confirmDelivery: handleConfirmDelivery,
  }), [state, loading, refreshing, error, loadManufacturerData, refreshManufacturer, handleUpdateAlertReadStatus, handleDeleteAlert, handleConfirmDelivery]);

  return (
    <ManufacturerContext.Provider value={value}>
      {children}
    </ManufacturerContext.Provider>
  );
};

export const useManufacturerContext = () => {
  const context = useContext(ManufacturerContext);
  if (!context) throw new Error('useManufacturerContext must be used within a ManufacturerProvider');
  return context;
};

export default ManufacturerContext;
