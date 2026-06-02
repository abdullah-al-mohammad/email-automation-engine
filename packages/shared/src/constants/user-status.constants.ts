export const USER_NEW = 'new' as const;
export const USER_APPROVED = 'approved' as const;
export const USER_BLOCKED = 'blocked' as const;

export type UserStatus = typeof USER_NEW | typeof USER_APPROVED | typeof USER_BLOCKED;
