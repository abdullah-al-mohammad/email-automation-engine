import {
  type AuthResponse,
  type SigninDto,
  type SignupDto,
  type UserResponse,
} from '@email-automation-engine/shared';
import React, { createContext, useContext, useEffect, useState } from 'react';

import api from '../lib/api';
import { AUTH_UNAUTHORIZED_EVENT, clearStoredAuth, STORAGE_KEYS } from '../lib/auth-storage';

interface AuthContextType {
  user: UserResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: SigninDto) => Promise<void>;
  register: (data: SignupDto) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = async () => {
    const token = localStorage.getItem(STORAGE_KEYS.authToken);
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get<UserResponse>('/auth/me');
      setUser(response.data);
    } catch {
      clearStoredAuth();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadUser();

    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, []);

  const authenticate = async (
    data: SigninDto | SignupDto,
    path: '/auth/signin' | '/auth/signup',
  ) => {
    const response = await api.post<AuthResponse>(path, data);
    localStorage.setItem(STORAGE_KEYS.authToken, response.data.accessToken);
    await loadUser();
  };

  const login = (data: SigninDto) => authenticate(data, '/auth/signin');

  const register = (data: SignupDto) => authenticate(data, '/auth/signup');

  const logout = () => {
    clearStoredAuth();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
