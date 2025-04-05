// Export shared configuration
export { config, loadConfig } from './config/env';

// Export shared OpenAI types and utilities
export {
  TaskExtractionResult,
  PriorityAnalysisResult,
  FollowupEmailResult,
  SYSTEM_PROMPTS,
  openaiUtils
} from './services/openai.types';

// Set default export
export default {
  config: require('./config/env').config,
  openai: require('./services/openai.types')
}; 