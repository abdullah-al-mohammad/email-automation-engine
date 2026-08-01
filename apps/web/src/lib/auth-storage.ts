export const STORAGE_KEYS = {
  authToken: 'auth_token',
  currentTenantId: 'current_tenant_id',
} as const;

export const AUTH_UNAUTHORIZED_EVENT = 'auth_unauthorized';

/** Clears all auth-related storage in one place — add new keys here as needed. */
export function clearStoredAuth(): void {
  localStorage.removeItem(STORAGE_KEYS.authToken);
  localStorage.removeItem(STORAGE_KEYS.currentTenantId);
}
