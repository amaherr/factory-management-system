export const COLORS = Object.freeze({
  RED: 'red',
  BLUE: 'blue',
  BLACK: 'black',
  WHITE: 'white',
  GREEN: 'green',
  YELLOW: 'yellow',
  GRAY: 'gray',
  NAVY: 'navy',
  BROWN: 'brown',
  BEIGE: 'beige',
  PINK: 'pink',
  PURPLE: 'purple',
  ORANGE: 'orange',
});

export type Color = (typeof COLORS)[keyof typeof COLORS];

export const PRODUCT_STATUS = Object.freeze({
  PENDING: 'pending',
  ACTIVE: 'active',
  DEACTIVE: 'deactive',
});

export type ProductStatus = (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];

export const SEASONS = Object.freeze({
  SPRING: 'spring',
  SUMMER: 'summer',
  AUTUMN: 'autumn',
  WINTER: 'winter',
});

export type Season = (typeof SEASONS)[keyof typeof SEASONS];

export const FACTORY_LOCATIONS = Object.freeze({
  SHOWROOM: 'showroom',
  WAREHOUSE_A: 'warehouse a',
  WAREHOUSE_B: 'warehouse b',
});

export type FactoryLocation = (typeof FACTORY_LOCATIONS)[keyof typeof FACTORY_LOCATIONS];

// Helper to get array of values
export const COLORS_VALUES = Object.values(COLORS);
export const PRODUCT_STATUS_VALUES = Object.values(PRODUCT_STATUS);
export const SEASONS_VALUES = Object.values(SEASONS);
export const FACTORY_LOCATIONS_VALUES = Object.values(FACTORY_LOCATIONS);
