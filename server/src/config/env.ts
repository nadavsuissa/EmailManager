import { config as sharedConfig } from '@shared/config/env';

/**
 * Re-export the shared configuration for server-side use
 * 
 * This ensures we have a single source of truth for configuration,
 * while allowing server-specific extensions if needed.
 */

export const config = sharedConfig;

// Validate required configuration for server
const validateServerConfig = () => {
  const missingVars: string[] = [];
  
  // Required server environment variables
  if (!config.firebase.projectId) missingVars.push('FIREBASE_PROJECT_ID');
  
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
  validateServerConfig();
}

export default { config }; 