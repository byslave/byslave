import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/src/lib/i18n/en';
import tr from '@/src/lib/i18n/tr';

void i18n.use(initReactI18next).init({ // eslint-disable-line import/no-named-as-default-member
  resources: {
    tr: { translation: tr },
    en: { translation: en },
  },
  lng: 'tr',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export default i18n;
