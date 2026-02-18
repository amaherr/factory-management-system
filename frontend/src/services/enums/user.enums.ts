export const ROLES = Object.freeze({
  ADMIN: 'admin',
  SALES: 'sales',
  INVENTORY: 'inventory',
  ACCOUNTING: 'accounting',
  PLANNING: 'planning',
  PRODUCTION: 'production',
} as const);

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_VALUES = Object.values(ROLES) as UserRole[];
