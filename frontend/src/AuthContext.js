import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    accessToken: localStorage.getItem('access_token') || null,
    refreshToken: localStorage.getItem('refresh_token') || null,
    isAuthenticated: false,
    user: null,
  });

  useEffect(() => {
    const checkAuth = () => {
      if (auth.accessToken) {
        try {
          const decoded = jwtDecode(auth.accessToken);
          const currentTime = Date.now() / 1000;
          if (decoded.exp < currentTime) {
            logout();
          } else {
            setAuth(prev => ({
              ...prev,
              isAuthenticated: true,
              user: decoded,
            }));
          }
        } catch (error) {
          console.error('Invalid token:', error);
          logout();
        }
      }
    };

    checkAuth();
  }, [auth.accessToken]);

  const login = (accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    setAuth({
      accessToken,
      refreshToken,
      isAuthenticated: true,
      user: jwtDecode(accessToken),
    });
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setAuth({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      user: null,
    });
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};