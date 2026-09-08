<<<<<<< HEAD
import React, { createContext, useContext, useState, useMemo } from 'react';
// import { supabase } from './supabase';
=======
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase } from './supabase';
import { clearUserCaches } from './src/lib/cache';
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
<<<<<<< HEAD
  const [userRole, setUserRole] = useState(null); // Explicitly track the DB role
  const [loading, setLoading] = useState(false);

  const login = ({ email, role = 'restaurant' }) => {
    setUser({
      id: 'design-mode-user',
      email,
    });
    setUserRole(role.toLowerCase());
    setLoading(false);
  };

  const signOut = async () => {
    setUser(null);
    setUserRole(null);
    setLoading(false);
    // await supabase.auth.signOut();
  };

  /*
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role, full_name, email")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setUserRole(data.role?.toLowerCase());
    } catch (err) {
      console.error("Error fetching profile:", err.message);
      setUserRole(null);
    } finally {
      setLoading(false);
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
        setLoading(false);
      }
=======
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const signOut = async () => {
    const userId = user?.id;
    if (userId) {
      await clearUserCaches(userId);
    }
    setUser(null);
    setSession(null);
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
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
    });

    return () => subscription.unsubscribe();
  }, []);
<<<<<<< HEAD
  */

  const value = useMemo(() => ({
    user,
    userRole,
    isAuthenticated: !!user,
    loading,
    login,
    signOut,
  }), [user, userRole, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
=======

  const value = useMemo(
    () => ({
      user,
      session,
      isAuthenticated: !!user,
      loading,
      signOut,
    }),
    [user, session, loading]
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
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
