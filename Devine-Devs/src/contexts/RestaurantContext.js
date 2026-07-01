import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from '../../AuthContext';
import { cacheKeys, readCache, writeCache } from '../lib/cache';
import {
  createManualPickupRequest,
  createPickupRequest,
  loadRestaurantBundle,
} from '../services/restaurantService';

const RestaurantContext = createContext(null);

export { RestaurantContext };

const EMPTY_STATE = {
  restaurant: null,
  tank: null,
  tankReadings: [],
  pickups: [],
  pickupSchedules: [],
  wallet: null,
  earnings: [],
  withdrawals: [],
  alerts: [],
  qualityLogs: [],
  activityLogs: [],
  marketRates: [],
};

export const RestaurantProvider = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const applyBundle = useCallback((bundle) => {
    setState({
      restaurant: bundle.restaurant ?? null,
      tank: bundle.tank ?? null,
      tankReadings: bundle.tankReadings ?? [],
      pickups: bundle.pickups ?? [],
      pickupSchedules: bundle.pickupSchedules ?? [],
      wallet: bundle.wallet ?? null,
      earnings: bundle.earnings ?? [],
      withdrawals: bundle.withdrawals ?? [],
      alerts: bundle.alerts ?? [],
      qualityLogs: bundle.qualityLogs ?? [],
      activityLogs: bundle.activityLogs ?? [],
      marketRates: bundle.marketRates ?? [],
    });
  }, []);

  const loadRestaurantData = useCallback(
    async (userId, { fromCache = true } = {}) => {
      if (!userId) {
        applyBundle(EMPTY_STATE);
        setLoading(false);
        return;
      }

      const cacheKey = cacheKeys.restaurant(userId);

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
        const bundle = await loadRestaurantBundle(userId);
        applyBundle(bundle);
        await writeCache(cacheKey, bundle);
      } catch (err) {
        console.error('Error loading restaurant data:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [applyBundle]
  );

  const refreshRestaurant = useCallback(async () => {
    if (!user?.id) return;

    setRefreshing(true);
    await loadRestaurantData(user.id, { fromCache: false });
  }, [user?.id, loadRestaurantData]);

  const handleCreatePickupRequest = useCallback(
    async (payload) => {
      const restaurantId = state.restaurant?.id;
      if (!restaurantId) {
        throw new Error('Restaurant record not found');
      }

      const pickup = await createPickupRequest(restaurantId, {
        ...payload,
        tank_id: payload.tank_id ?? state.tank?.id ?? null,
      });

      setState((prev) => {
        const next = { ...prev, pickups: [pickup, ...prev.pickups] };
        if (user?.id) {
          writeCache(cacheKeys.restaurant(user.id), next);
        }
        return next;
      });

      return pickup;
    },
    [state.restaurant?.id, state.tank?.id, user?.id]
  );

  const handleCreateManualPickupRequest = useCallback(
    async (payload) => {
      const restaurantId = state.restaurant?.id;
      if (!restaurantId) {
        throw new Error('Restaurant record not found');
      }

      return createManualPickupRequest(restaurantId, {
        ...payload,
        tank_id: payload.tank_id ?? state.tank?.id ?? null,
      });
    },
    [state.restaurant?.id, state.tank?.id]
  );

  useEffect(() => {
    if (user?.id) {
      loadRestaurantData(user.id);
    } else {
      applyBundle(EMPTY_STATE);
      setLoading(false);
      setError(null);
    }
  }, [user?.id, loadRestaurantData, applyBundle]);

  const value = useMemo(
    () => ({
      ...state,
      loading,
      refreshing,
      error,
      loadRestaurantData,
      refreshRestaurant,
      createPickupRequest: handleCreatePickupRequest,
      createManualPickupRequest: handleCreateManualPickupRequest,
    }),
    [
      state,
      loading,
      refreshing,
      error,
      loadRestaurantData,
      refreshRestaurant,
      handleCreatePickupRequest,
      handleCreateManualPickupRequest,
    ]
  );

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurantContext = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurantContext must be used within a RestaurantProvider');
  }
  return context;
};
