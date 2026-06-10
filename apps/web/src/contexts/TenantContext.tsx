import React, { createContext, useContext, useState, useEffect } from 'react';
import { type TenantResponse } from '@email-automation-engine/shared';
import { useAuth } from './AuthContext';
import api from '../lib/api';

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
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);

  const fetchTenants = async () => {
    if (!isAuthenticated) return;
    setIsLoadingTenants(true);
    try {
      const response = await api.get<TenantResponse[]>('/tenants');
      setTenants(response.data);
      
      // Auto-select first tenant if none is selected
      const savedTenantId = localStorage.getItem('current_tenant_id');
      if (savedTenantId) {
        const found = response.data.find(t => t.id === savedTenantId);
        if (found) {
          setCurrentTenantState(found);
        } else if (response.data.length > 0) {
          const first = response.data[0];
          if (first) {
            setCurrentTenantState(first);
            localStorage.setItem('current_tenant_id', first.id);
          }
        }
      } else if (response.data.length > 0) {
        const first = response.data[0];
        if (first) {
          setCurrentTenantState(first);
          localStorage.setItem('current_tenant_id', first.id);
        }
      }
    } catch (error) {
      console.error('Failed to load tenants', error);
    } finally {
      setIsLoadingTenants(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, [isAuthenticated]);

  const setCurrentTenant = (tenant: TenantResponse | null) => {
    setCurrentTenantState(tenant);
    if (tenant) {
      localStorage.setItem('current_tenant_id', tenant.id);
    } else {
      localStorage.removeItem('current_tenant_id');
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
