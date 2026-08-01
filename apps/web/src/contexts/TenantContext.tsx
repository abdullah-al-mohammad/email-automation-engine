import React, { createContext, useContext, useState, useEffect } from 'react';
import { type TenantResponse } from '@email-automation-engine/shared';
import { useAuth } from './AuthContext';
import api from '../lib/api';
import { STORAGE_KEYS } from '../lib/auth-storage';

interface TenantContextType {
  currentTenant: TenantResponse | null;
  setCurrentTenant: (tenant: TenantResponse | null) => void;
  tenants: TenantResponse[];
  isLoadingTenants: boolean;
  refreshTenants: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [tenants, setTenants] = useState<TenantResponse[]>([]);
  const [currentTenant, setCurrentTenantState] = useState<TenantResponse | null>(null);
  const [isLoadingTenants, setIsLoadingTenants] = useState(true);

  const fetchTenants = async () => {
    if (!isAuthenticated) {
      setIsLoadingTenants(false);
      return;
    }
    setIsLoadingTenants(true);
    try {
      const response = await api.get<TenantResponse[]>('/tenants');
      setTenants(response.data);

      // Auto-select saved tenant, or first tenant if none is selected
      const savedTenantId = localStorage.getItem(STORAGE_KEYS.currentTenantId);
      const found = savedTenantId ? response.data.find((t) => t.id === savedTenantId) : undefined;
      const selected = found ?? response.data[0] ?? null;
      if (selected) {
        setCurrentTenantState(selected);
        localStorage.setItem(STORAGE_KEYS.currentTenantId, selected.id);
      }
    } catch {
      // leave tenants empty; the 401 interceptor handles auth failures
    } finally {
      setIsLoadingTenants(false);
    }
  };

  useEffect(() => {
    void fetchTenants();
  }, [isAuthenticated]);

  const setCurrentTenant = (tenant: TenantResponse | null) => {
    setCurrentTenantState(tenant);
    if (tenant) {
      localStorage.setItem(STORAGE_KEYS.currentTenantId, tenant.id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.currentTenantId);
    }
  };

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        setCurrentTenant,
        tenants,
        isLoadingTenants,
        refreshTenants: fetchTenants,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
