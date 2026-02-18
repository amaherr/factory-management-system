import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import common_en from './resources/en/common.json';
import nav_en from './resources/en/nav.json';
import customers_en from './resources/en/customers.json';
import common_ar from './resources/ar/common.json';
import nav_ar from './resources/ar/nav.json';
import customers_ar from './resources/ar/customers.json';

export const supportedLngs = ['en', 'ar'] as const;
export type SupportedLng = (typeof supportedLngs)[number];

const resources = {
  en: { common: common_en, nav: nav_en, customers: customers_en },
  ar: { common: common_ar, nav: nav_ar, customers: customers_ar },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    ns: ['common', 'nav', 'customers'],
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
