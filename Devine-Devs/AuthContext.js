import React, { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [userRole, setUserRole] = useState(null);

  const login = (role) => {
    const normalizedRole = typeof role === 'string' ? role.toLowerCase().trim() : '';
    setUserRole(normalizedRole || null);
  };

  const logout = () => setUserRole(null);

  const value = useMemo(
    () => ({
      userRole,
      isAuthenticated: Boolean(userRole),
      login,
      logout,
    }),
    [userRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
