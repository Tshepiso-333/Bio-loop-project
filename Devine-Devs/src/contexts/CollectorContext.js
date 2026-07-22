import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { cacheKeys, readCache, writeCache } from '../lib/cache';
import {
  loadCollectorBundle,
  updatePickupStatus as savePickupStatus,
  toggleDutyStatus as saveDutyStatus,
  declinePickup as saveDeclinePickup,
} from '../services/collectorService';
import { requestWithdrawal } from '../services/payoutService';

const CollectorContext = createContext(null);

export { CollectorContext };

const EMPTY_STATE = {
  collector: null,
  pickups: [],
  stats: null,
  alerts: [],
  wallet: null,
  earnings: [],
  withdrawals: [],
};

export const CollectorProvider = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const applyBundle = useCallback((bundle) => {
    setState({
      collector: bundle.collector ?? null,
      pickups: bundle.pickups ?? [],
      stats: bundle.stats ?? null,
      alerts: bundle.alerts ?? [],
      wallet: bundle.wallet ?? null,
      earnings: bundle.earnings ?? [],
      withdrawals: bundle.withdrawals ?? [],
    });
  }, []);

  const loadCollectorData = useCallback(async (userId, { fromCache = true } = {}) => {
    if (!userId) {
      applyBundle(EMPTY_STATE);
      setLoading(false);
      return;
    }

    const cacheKey = cacheKeys.collector(userId);

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
      const bundle = await loadCollectorBundle(userId);
      applyBundle(bundle);
      await writeCache(cacheKey, bundle);
    } catch (err) {
      console.error('Error loading collector data:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [applyBundle]);

  const refreshCollector = useCallback(async () => {
    if (!user?.id) return;
    setRefreshing(true);
    await loadCollectorData(user.id, { fromCache: false });
  }, [user?.id, loadCollectorData]);

  const handleUpdatePickupStatus = useCallback(
    async (pickupId, status) => {
      const updatedPickup = await savePickupStatus(pickupId, status);

      setState((prev) => {
        const next = {
          ...prev,
          pickups: prev.pickups.map((pickup) =>
            pickup.id === pickupId ? updatedPickup : pickup
          ),
        };

        if (user?.id) {
          writeCache(cacheKeys.collector(user.id), next);
        }

        return next;
      });

      return updatedPickup;
    },
    [user?.id]
  );

  const handleToggleDutyStatus = useCallback(
    async (isOnDuty) => {
      const collectorId = state.collector?.id;
      if (!collectorId) throw new Error('Collector record not found');

      const updatedCollector = await saveDutyStatus(collectorId, isOnDuty);

      setState((prev) => {
        const next = { ...prev, collector: updatedCollector };
        if (user?.id) writeCache(cacheKeys.collector(user.id), next);
        return next;
      });

      return updatedCollector;
    },
    [state.collector?.id, user?.id]
  );

  const handleDeclinePickup = useCallback(
    async (pickupId, reason) => {
      const updatedPickup = await saveDeclinePickup(pickupId, reason);

      setState((prev) => {
        const next = {
          ...prev,
          pickups: prev.pickups.filter((pickup) => pickup.id !== pickupId),
        };
        if (user?.id) writeCache(cacheKeys.collector(user.id), next);
        return next;
      });

      return updatedPickup;
    },
    [user?.id]
  );

  const handleRequestWithdrawal = useCallback(async () => {
    const collectorId = state.collector?.id;
    if (!collectorId) throw new Error('Collector record not found');

    const withdrawal = await requestWithdrawal({ collectorId });
    await refreshCollector();
    return withdrawal;
  }, [state.collector?.id, refreshCollector]);

  useEffect(() => {
    if (user?.id) {
      loadCollectorData(user.id);
    } else {
      applyBundle(EMPTY_STATE);
      setLoading(false);
      setError(null);
    }
  }, [user?.id, loadCollectorData, applyBundle]);

  const value = useMemo(() => ({
    ...state,
    loading,
    refreshing,
    error,
    loadCollectorData,
    refreshCollector,
    updatePickupStatus: handleUpdatePickupStatus,
    toggleDutyStatus: handleToggleDutyStatus,
    declinePickup: handleDeclinePickup,
    requestWithdrawal: handleRequestWithdrawal,
  }), [
    state,
    loading,
    refreshing,
    error,
    loadCollectorData,
    refreshCollector,
    handleUpdatePickupStatus,
    handleToggleDutyStatus,
    handleDeclinePickup,
    handleRequestWithdrawal,
  ]);

  return (
    <CollectorContext.Provider value={value}>
      {children}
    </CollectorContext.Provider>
  );
};

export const useCollectorContext = () => {
  const context = useContext(CollectorContext);
  if (!context) throw new Error('useCollectorContext must be used within a CollectorProvider');
  return context;
};

export default CollectorContext;
