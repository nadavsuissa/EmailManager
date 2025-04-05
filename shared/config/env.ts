/**
 * Centralized environment configuration
 * 
 * This module provides a unified way to access environment variables
 * across both server and client applications.
 */

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Environment configuration interface
interface Config {
  environment: string;
  port: number;
  openai: {
    apiKey: string | undefined;
    model: string;
  };
  firebase: {
    apiKey: string | undefined;
    authDomain: string | undefined;
    projectId: string | undefined;
    storageBucket: string | undefined;
    messagingSenderId: string | undefined;
    appId: string | undefined;
  };
  email: {
    service: string | undefined;
    user: string | undefined;
    password: string | undefined;
    from: string | undefined;
  };
  language: {
    default: string;
    rtlEnabled: boolean;
  };
}

// Function to load configuration based on environment
export const loadConfig = (): Config => {
  // Determine if running in browser or Node.js environment
  const isBrowser = typeof window !== 'undefined';
  
  // Common configuration
  const config: Config = {
    environment: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),
    openai: {
      apiKey: isBrowser ? process.env.REACT_APP_OPENAI_API_KEY : process.env.OPENAI_API_KEY,
      model: (isBrowser ? process.env.REACT_APP_OPENAI_MODEL : process.env.OPENAI_MODEL) || 'gpt-4',
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
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASSWORD,
      from: process.env.EMAIL_FROM,
    },
    language: {
      default: (isBrowser ? process.env.REACT_APP_DEFAULT_LANGUAGE : process.env.DEFAULT_LANGUAGE) || 'he',
      rtlEnabled: (isBrowser ? process.env.REACT_APP_RTL_ENABLED : process.env.RTL_ENABLED) === 'true',
    },
  };

  return config;
};

// Export the config object
export const config = loadConfig();

export default config; 