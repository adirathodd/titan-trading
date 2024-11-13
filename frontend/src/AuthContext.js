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
    username: localStorage.getItem('username') || null,
    cash: parseFloat(localStorage.getItem('cash')) || 0.00,
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

  const login = (accessToken, refreshToken, username, cash) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('username', username);
    localStorage.setItem('cash', cash);
    setAuth({
      accessToken,
      refreshToken,
      isAuthenticated: true,
      user: jwtDecode(accessToken),
      username: username,
      cash: cash
    });
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
    localStorage.removeItem('cash');
    setAuth({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      user: null,
      username: null,
      cash: 0.00
    });
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateCash = (newCash) => {
    localStorage.setItem('cash', newCash);
    setAuth((prev) => ({ ...prev, cash: newCash }));
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout, updateCash }}>
      {children}
    </AuthContext.Provider>
  );
};