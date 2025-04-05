import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslation from './locales/en/translation.json';
import heTranslation from './locales/he/translation.json';

// Set up i18next
i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Init i18next
  .init({
    // Debug mode in development
    debug: process.env.NODE_ENV === 'development',
    
    // Default language
    fallbackLng: 'he',
    
    // Default language when no translation is available
    lng: 'he',
    
    // Namespace used for all translations
    defaultNS: 'translation',
    
    // Resources are structured with namespace -> language -> translations
    resources: {
      en: {
        translation: enTranslation,
      },
      he: {
        translation: heTranslation,
      },
    },
    
    // Interpolation configuration
    interpolation: {
      // No need to escape values as React does this for us
      escapeValue: false,
    },
    
    // Handling RTL
    react: {
      // Update document direction
      hashTransKey: function (defaultValue) {
        return defaultValue;
      },
    },
  });

// Function to change language
export const changeLanguage = (language: string) => {
  i18n.changeLanguage(language);
  
  // Update document direction based on language
  if (language === 'he') {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'he';
  } else {
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = language;
  }
};

export default i18n; 