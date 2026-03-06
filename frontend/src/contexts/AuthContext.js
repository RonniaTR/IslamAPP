import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (sessionId) {
      api.post(`/auth/session?session_id=${sessionId}`)
        .then(({ data }) => {
          setUser(data);
          window.history.replaceState({}, '', window.location.pathname);
        })
        .catch(() => checkAuth());
    } else {
      checkAuth();
    }
  }, [checkAuth]);

  const loginAsGuest = async () => {
    try {
      const { data } = await api.post('/auth/guest');
      setUser(data);
      return data;
    } catch (e) {
      console.error('Guest login failed:', e);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginAsGuest, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
