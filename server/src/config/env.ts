import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Interface to type our config
interface AppConfig {
  environment: 'development' | 'test' | 'production';
  port: number;
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  firebase: {
    projectId: string;
    serviceAccount: object | null;
    databaseURL: string;
    storageBucket: string;
  };
  openai: {
    apiKey: string | null;
    organization: string | null;
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

// Helper function to parse JSON safely
const parseJSON = (jsonString: string | undefined): object | null => {
  if (!jsonString) return null;
  
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return null;
  }
};

// Parse CORS origins
const parseOrigins = (originsString: string | undefined): string | string[] => {
  if (!originsString) return '*';
  
  // If comma separated list, split into array
  if (originsString.includes(',')) {
    return originsString.split(',').map(origin => origin.trim());
  }
  
  return originsString;
};

// Configuration object
export const config: AppConfig = {
  environment: (process.env.NODE_ENV as 'development' | 'test' | 'production') || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  cors: {
    origin: parseOrigins(process.env.CORS_ORIGIN),
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    serviceAccount: parseJSON(process.env.FIREBASE_SERVICE_ACCOUNT),
    databaseURL: process.env.FIREBASE_DATABASE_URL || '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || null,
    organization: process.env.OPENAI_ORGANIZATION || null,
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

// Validate required configuration
const validateConfig = () => {
  const missingVars: string[] = [];
  
  // Required environment variables
  if (!config.firebase.projectId) missingVars.push('FIREBASE_PROJECT_ID');
  if (!config.firebase.databaseURL) missingVars.push('FIREBASE_DATABASE_URL');
  
  // If in production, require Firebase service account
  if (config.environment === 'production' && !config.firebase.serviceAccount) {
    missingVars.push('FIREBASE_SERVICE_ACCOUNT');
  }
  
  // OpenAI API key is required for NLP features
  if (!config.openai.apiKey) {
    console.warn('WARNING: OPENAI_API_KEY is not set. OpenAI features will not work.');
  }
  
  // If missing required variables, log error and exit
  if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    
    // In development, we can continue with warnings
    if (config.environment !== 'development') {
      process.exit(1);
    }
  }
};

// Validate the config in non-test environments
if (process.env.NODE_ENV !== 'test') {
  validateConfig();
}

export default { config }; 