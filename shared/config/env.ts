/**
 * Centralized environment configuration
 * 
 * This module provides a unified way to access environment variables
 * across both server and client applications.
 */

import dotenv from 'dotenv';

// Load environment variables from .env file
// This will be ignored in browser environments
try {
  dotenv.config();
} catch (error) {
  // Ignore errors in browser environment
}

// Check if running in browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * Environment Configuration Interface
 */
export interface Config {
  environment: string;
  server: {
    port: number;
    cors: {
      origin: string | string[];
      credentials: boolean;
    };
  };
  openai: {
    apiKey: string | undefined;
    model: string;
    organization?: string;
  };
  firebase: {
    apiKey: string | undefined;
    authDomain: string | undefined;
    projectId: string | undefined;
    storageBucket: string | undefined;
    messagingSenderId: string | undefined;
    appId: string | undefined;
    // Server-only Firebase admin config
    serviceAccount?: any;
    databaseURL?: string;
  };
  email: {
    service: string | undefined;
    host: string | undefined;
    port: number | undefined;
    secure: boolean;
    user: string | undefined;
    password: string | undefined;
    from: string | undefined;
  };
  language: {
    default: string;
    rtlEnabled: boolean;
  };
  security: {
    rateLimiting: {
      windowMs: number;
      max: number;
    };
    helmet: boolean;
  };
  logging: {
    level: string;
    format: string;
  };
}

/**
 * Helper function to parse a comma-separated string into an array
 */
const parseStringArray = (value: string | undefined): string | string[] => {
  if (!value) return '*';
  return value.includes(',') ? value.split(',').map(item => item.trim()) : value;
};

/**
 * Load configuration based on environment
 */
export const loadConfig = (): Config => {
  // Common configuration for both client and server
  const config: Config = {
    environment: process.env.NODE_ENV || 'development',
    server: {
      port: parseInt(isBrowser 
        ? (process.env.REACT_APP_SERVER_PORT || '5000')
        : (process.env.PORT || '5000'), 10),
      cors: {
        origin: parseStringArray(isBrowser 
          ? process.env.REACT_APP_CORS_ORIGIN 
          : process.env.CORS_ORIGIN),
        credentials: (isBrowser 
          ? process.env.REACT_APP_CORS_CREDENTIALS 
          : process.env.CORS_CREDENTIALS) === 'true',
      }
    },
    openai: {
      apiKey: isBrowser ? process.env.REACT_APP_OPENAI_API_KEY : process.env.OPENAI_API_KEY,
      model: (isBrowser ? process.env.REACT_APP_OPENAI_MODEL : process.env.OPENAI_MODEL) || 'gpt-4',
      organization: isBrowser ? process.env.REACT_APP_OPENAI_ORGANIZATION : process.env.OPENAI_ORGANIZATION,
    },
    firebase: {
      apiKey: isBrowser ? process.env.REACT_APP_FIREBASE_API_KEY : process.env.FIREBASE_API_KEY,
      authDomain: isBrowser ? process.env.REACT_APP_FIREBASE_AUTH_DOMAIN : process.env.FIREBASE_AUTH_DOMAIN,
      projectId: isBrowser ? process.env.REACT_APP_FIREBASE_PROJECT_ID : process.env.FIREBASE_PROJECT_ID,
      storageBucket: isBrowser ? process.env.REACT_APP_FIREBASE_STORAGE_BUCKET : process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: isBrowser ? process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID : process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: isBrowser ? process.env.REACT_APP_FIREBASE_APP_ID : process.env.FIREBASE_APP_ID,
    },
    email: {
      service: process.env.EMAIL_SERVICE,
      host: process.env.EMAIL_HOST || process.env.SMTP_HOST,
      port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587', 10),
      secure: (process.env.EMAIL_SECURE || process.env.SMTP_SECURE) === 'true',
      user: process.env.EMAIL_USER || process.env.SMTP_USER,
      password: process.env.EMAIL_PASSWORD || process.env.SMTP_PASSWORD,
      from: process.env.EMAIL_FROM,
    },
    language: {
      default: (isBrowser ? process.env.REACT_APP_DEFAULT_LANGUAGE : process.env.DEFAULT_LANGUAGE) || 'he',
      rtlEnabled: (isBrowser ? process.env.REACT_APP_RTL_ENABLED : process.env.RTL_ENABLED) === 'true',
    },
    security: {
      rateLimiting: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes default
        max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // 100 requests per windowMs default
      },
      helmet: process.env.USE_HELMET !== 'false', // default to true
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      format: process.env.LOG_FORMAT || 'combined',
    },
  };

  // Add server-only configuration if not in browser
  if (!isBrowser) {
    try {
      // Try to parse the Firebase service account if provided as JSON string
      const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (serviceAccountStr) {
        config.firebase.serviceAccount = JSON.parse(serviceAccountStr);
      }
    } catch (error) {
      console.warn('Could not parse Firebase service account:', error);
    }

    // Add other server-only configs
    config.firebase.databaseURL = process.env.FIREBASE_DATABASE_URL;
  }

  return config;
};

// Export the config object
export const config = loadConfig();

// Log configuration loading (server-side only)
if (!isBrowser && process.env.NODE_ENV !== 'test') {
  console.log(`Configuration loaded for ${config.environment} environment`);
}

export default config; 