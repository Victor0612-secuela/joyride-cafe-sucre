import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { api, clearStoredTokens, getStoredTokens, setStoredTokens } from '../lib/api';
import { SessionTransitionOverlay } from '../components/ui/SessionTransitionOverlay';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isTransitioningOut: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: { name: string; email: string; password: string; phone?: string }) => Promise<User>;
  logout: (onComplete?: () => void) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTransitioningOut, setIsTransitioningOut] = useState(false);

  const refreshUser = useCallback(async () => {
    const { accessToken } = getStoredTokens();
    if (!accessToken) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get<{ user: User }>('/auth/me');
      setUser(res.data.user);
    } catch {
      clearStoredTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ accessToken: string; refreshToken: string; user: User }>('/auth/login', {
      email,
      password,
    });
    setStoredTokens(res.data.accessToken, res.data.refreshToken);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(
    async (payload: { name: string; email: string; password: string; phone?: string }) => {
      const res = await api.post<{ accessToken: string; refreshToken: string; user: User }>(
        '/auth/register',
        payload
      );
      setStoredTokens(res.data.accessToken, res.data.refreshToken);
      setUser(res.data.user);
      return res.data.user;
    },
    []
  );

  const logout = useCallback((onComplete?: () => void) => {
    setIsTransitioningOut(true);
    setTimeout(() => {
      clearStoredTokens();
      setUser(null);
      onComplete?.();
      setTimeout(() => {
        setIsTransitioningOut(false);
      }, 280);
    }, 520);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, isTransitioningOut, login, register, logout, refreshUser }}
    >
      {children}
      <SessionTransitionOverlay active={isTransitioningOut} />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
