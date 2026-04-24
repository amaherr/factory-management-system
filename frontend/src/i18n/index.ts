import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import common_en from './resources/en/common.json';
import nav_en from './resources/en/nav.json';
import customers_en from './resources/en/customers.json';
import issues_en from './resources/en/issues.json';
import users_en from './resources/en/users.json';
import products_en from './resources/en/inventory/products.json';
import stock_en from './resources/en/inventory/stock.json';
import warehouse_en from './resources/en/inventory/warehouse.json';
import batches_en from './resources/en/production/batches.json';
import pos_en from './resources/en/pos.json';
import notifications_en from './resources/en/notifications.json';
import export_en from './resources/en/export.json';
import dashboard_en from './resources/en/dashboard.json';

import common_ar from './resources/ar/common.json';
import nav_ar from './resources/ar/nav.json';
import customers_ar from './resources/ar/customers.json';
import issues_ar from './resources/ar/issues.json';
import users_ar from './resources/ar/users.json';
import products_ar from './resources/ar/inventory/products.json';
import stock_ar from './resources/ar/inventory/stock.json';
import warehouse_ar from './resources/ar/inventory/warehouse.json';
import batches_ar from './resources/ar/production/batches.json';
import pos_ar from './resources/ar/pos.json';
import notifications_ar from './resources/ar/notifications.json';
import export_ar from './resources/ar/export.json';
import dashboard_ar from './resources/ar/dashboard.json';

export const supportedLngs = ['en', 'ar'] as const;
export type SupportedLng = (typeof supportedLngs)[number];

const resources = {
  en: {
    common: common_en,
    nav: nav_en,
    customers: customers_en,
    issues: issues_en,
    users: users_en,
    products: products_en,
    stock: stock_en,
    warehouse: warehouse_en,
    batches: batches_en,
    pos: pos_en,
    notifications: notifications_en,
    export: export_en,
    analytics: dashboard_en,
  },
  ar: {
    common: common_ar,
    nav: nav_ar,
    customers: customers_ar,
    issues: issues_ar,
    users: users_ar,
    products: products_ar,
    stock: stock_ar,
    warehouse: warehouse_ar,
    batches: batches_ar,
    pos: pos_ar,
    notifications: notifications_ar,
    export: export_ar,
    analytics: dashboard_ar,
  },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    ns: [
      'common',
      'nav',
      'customers',
      'issues',
      'users',
      'products',
      'stock',
      'warehouse',
      'batches',
      'pos',
      'notifications',
      'export',
      'analytics',
    ],
    defaultNS: 'common',
    supportedLngs: [...supportedLngs],
    fallbackLng: 'en',
    interpolation: { escapeValue: false },

    detection: {
      order: ['localStorage'],
      caches: ['localStorage'],
      lookupLocalStorage: 'lang',
    },

    // Helpful during development
    returnNull: false,
  });

export default i18n;
