import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from '../../AuthContext';
import { getProfileCompletionStatus } from '../lib/profileCompletion';
import { ensureRoleBusinessRecord, getProfile, saveRoleProfile } from '../services/profileService';

const ProfileContext = createContext(null);

export const ProfileProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let data = await getProfile(userId);

      if (data.role && data.role !== 'admin' && !data.businessDetails) {
        await ensureRoleBusinessRecord(userId, data.role, data);
        data = await getProfile(userId);
      }

      setProfile(data);
    } catch (err) {
      console.error('Error loading profile:', err.message);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await loadProfile(user.id);
    }
  }, [user?.id, loadProfile]);

  const updateProfile = useCallback(
    async ({ base = {}, business = {} } = {}) => {
      if (!user?.id || !profile?.role) {
        throw new Error('No authenticated profile to update');
      }
      const updated = await saveRoleProfile(user.id, profile.role, { base, business });
      setProfile(updated);
      return updated;
    },
    [user?.id, profile?.role]
  );

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadProfile(user.id);
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [isAuthenticated, user?.id, loadProfile]);

  const role = profile?.role ?? null;

  const completion = useMemo(
    () => getProfileCompletionStatus(profile),
    [profile]
  );

  const value = useMemo(
    () => ({
      profile,
      role,
      loading,
      completion,
      isProfileComplete: completion.isComplete,
      loadProfile,
      refreshProfile,
      updateProfile,
    }),
    [profile, role, loading, completion, loadProfile, refreshProfile, updateProfile]
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
};

export const useProfileContext = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfileContext must be used within a ProfileProvider');
  }
  return context;
};
