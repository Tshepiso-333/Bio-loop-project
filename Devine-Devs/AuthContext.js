import React, { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [userRole, setUserRole] = useState(null);
  const [userEmail, setUserEmail] = useState(null);

  const login = (user) => {
    const normalizedRole =
      typeof user?.role === 'string' ? user.role.toLowerCase().trim() : '';
    const normalizedEmail =
      typeof user?.email === 'string' ? user.email.toLowerCase().trim() : '';

    setUserRole(normalizedRole || null);
    setUserEmail(normalizedEmail || null);
  };

  const logout = () => {
    setUserRole(null);
    setUserEmail(null);
  };

  const value = useMemo(
    () => ({
      userRole,
      userEmail,
      isAuthenticated: Boolean(userRole),
      login,
      logout,
    }),
    [userEmail, userRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
