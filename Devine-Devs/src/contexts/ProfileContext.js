import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from '../../AuthContext';
import { getProfile } from '../services/profileService';

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
      const data = await getProfile(userId);
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

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadProfile(user.id);
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [isAuthenticated, user?.id, loadProfile]);

  const role = profile?.role ?? null;

  const value = useMemo(
    () => ({
      profile,
      role,
      loading,
      loadProfile,
      refreshProfile,
    }),
    [profile, role, loading, loadProfile, refreshProfile]
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
