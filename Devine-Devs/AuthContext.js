import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase } from './supabase';
import { clearUserCaches } from './src/lib/cache';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verifying a password-reset code signs the user in with a recovery
  // session — that session is what authorises updateUser({ password }).
  // RootNavigator only renders AuthStack while signed out, so without this
  // flag the reset screen was torn down the instant the code was accepted
  // and the password was never changed. While it is true, the reset screen
  // owns the whole app regardless of auth state.
  const [recoveringPassword, setRecoveringPassword] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState(null);

  const beginPasswordRecovery = (email = null) => {
    setRecoveryEmail(email);
    setRecoveringPassword(true);
  };
  const endPasswordRecovery = () => {
    setRecoveringPassword(false);
    setRecoveryEmail(null);
  };

  const signOut = async () => {
    const userId = user?.id;
    if (userId) {
      await clearUserCaches(userId);
    }
    setUser(null);
    setSession(null);
    setRecoveringPassword(false);
    await supabase.auth.signOut();
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      isAuthenticated: !!user,
      loading,
      signOut,
      recoveringPassword,
      recoveryEmail,
      beginPasswordRecovery,
      endPasswordRecovery,
    }),
    [user, session, loading, recoveringPassword, recoveryEmail]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
