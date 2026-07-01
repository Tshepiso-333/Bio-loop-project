import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { cacheKeys, readCache, writeCache } from '../lib/cache';
import { loadCollectorBundle } from '../services/collectorService';

const CollectorContext = createContext(null);

export { CollectorContext };

const EMPTY_STATE = {
  collector: null,
  pickups: [],
  stats: null,
  alerts: [],
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
  }), [state, loading, refreshing, error, loadCollectorData, refreshCollector]);

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
