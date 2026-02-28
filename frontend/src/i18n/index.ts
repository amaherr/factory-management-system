import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import common_en from './resources/en/common.json';
import nav_en from './resources/en/nav.json';
import customers_en from './resources/en/customers.json';
import issues_en from './resources/en/issues.json';
import users_en from './resources/en/users.json';
import products_en from './resources/en/products.json';
import stock_en from './resources/en/stock.json';
import batches_en from './resources/en/batches.json';
import pos_en from './resources/en/pos.json';
import common_ar from './resources/ar/common.json';
import nav_ar from './resources/ar/nav.json';
import customers_ar from './resources/ar/customers.json';
import issues_ar from './resources/ar/issues.json';
import users_ar from './resources/ar/users.json';
import products_ar from './resources/ar/products.json';
import stock_ar from './resources/ar/stock.json';
import batches_ar from './resources/ar/batches.json';
import pos_ar from './resources/ar/pos.json';

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
    batches: batches_en,
    pos: pos_en,
  },
  ar: {
    common: common_ar,
    nav: nav_ar,
    customers: customers_ar,
    issues: issues_ar,
    users: users_ar,
    products: products_ar,
    stock: stock_ar,
    batches: batches_ar,
    pos: pos_ar,
  },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    ns: ['common', 'nav', 'customers', 'issues', 'users', 'products', 'stock', 'batches', 'pos'],
    defaultNS: 'common',
    supportedLngs: [...supportedLngs],
    fallbackLng: 'en',
    interpolation: { escapeValue: false },

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'lang',
    },

    // Helpful during development
    returnNull: false,
  });

export default i18n;
