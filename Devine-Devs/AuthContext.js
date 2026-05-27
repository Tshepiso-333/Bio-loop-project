import React, { createContext, useContext, useState, useMemo } from 'react';
// import { supabase } from './supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
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
    });

    return () => subscription.unsubscribe();
  }, []);
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
