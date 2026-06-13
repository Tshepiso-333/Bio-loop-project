import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // Explicitly track the DB role
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Reads the restaurant's onboarding flag. Returns false when no row exists yet
  // (i.e. a brand-new signup that hasn't onboarded).
  const fetchOnboarding = async (userId) => {
    const { data, error } = await supabase
      .from("restaurants")
      .select("onboarding_completed")
      .eq("owner_user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data?.onboarding_completed === true;
  };

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role, full_name, email")
        .eq("id", userId)
        .single();

      if (error) throw error;

      const role = data.role?.toLowerCase();
      setUserRole(role);

      // Onboarding only applies to the restaurant side.
      if (role === "restaurant") {
        setOnboardingCompleted(await fetchOnboarding(userId));
      } else {
        setOnboardingCompleted(false);
      }
    } catch (err) {
      console.error("Error fetching profile:", err.message);
      setUserRole(null);
      setOnboardingCompleted(false);
    } finally {
      setLoading(false);
    }
  };

  // Re-checks the onboarding flag for the current user (called after the
  // restaurant finishes the onboarding wizard) so navigation can swap stacks.
  const refreshOnboarding = async () => {
    if (!user) return;
    try {
      setOnboardingCompleted(await fetchOnboarding(user.id));
    } catch (err) {
      console.error("Error refreshing onboarding:", err.message);
    }
  };

  useEffect(() => {
    // 1. Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setUserRole(null);
        setOnboardingCompleted(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error;
  };

  const value = useMemo(() => ({
    user,
    userRole,
    onboardingCompleted,
    refreshOnboarding,
    isAuthenticated: !!user,
    loading,
    login,
    signOut: () => supabase.auth.signOut(),
  }), [user, userRole, onboardingCompleted, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);