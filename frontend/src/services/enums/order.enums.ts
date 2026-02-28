export const CURRENCY = 'EGP';

export const ORDER_TYPES = Object.freeze({
  ON_SHELF: 'on shelf',
  ON_DEMAND: 'on demand',
});

export type OrderType = (typeof ORDER_TYPES)[keyof typeof ORDER_TYPES];

export const ORDER_STATUS = Object.freeze({
  DRAFT: 'draft',
  FINALIZED: 'finalized',
  CANCELLED: 'cancelled',
});

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];
