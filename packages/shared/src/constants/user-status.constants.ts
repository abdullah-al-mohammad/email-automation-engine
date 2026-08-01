export const USER_STATUS = {
  NEW: 'new',
  APPROVED: 'approved',
  BLOCKED: 'blocked',
} as const;

export const USER_STATUSES = Object.values(USER_STATUS);

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];
