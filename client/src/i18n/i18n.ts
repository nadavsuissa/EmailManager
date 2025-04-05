import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import config from '../../../shared/config/env';

// Import translation files directly
import translationEN from './locales/en/translation.json';
import translationHE from './locales/he/translation.json';

// Resources containing translations
const resources = {
  en: {
    translation: translationEN
  },
  he: {
    translation: translationHE
  }
};

// Initialize i18next
i18n
  // Load translations from server
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,
    fallbackLng: 'he',
    defaultNS: 'translation',
    lng: config.language.default || 'he', // Default language from config
    
    interpolation: {
      escapeValue: false, // React already safes from XSS
    },
    
    // RTL detection
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      lookupQuerystring: 'lng',
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage', 'cookie'],
    },
    
    react: {
      useSuspense: true,
      bindI18n: 'languageChanged',
    },
  });

// Function to change language
export const changeLanguage = (lng: string) => {
  i18n.changeLanguage(lng);
  // Update HTML dir attribute for RTL support
  if (lng === 'he') {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'he';
  } else {
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = 'en';
  }
};

// Set initial direction based on default language
if (i18n.language === 'he') {
  document.documentElement.dir = 'rtl';
  document.documentElement.lang = 'he';
}

export default i18n; 