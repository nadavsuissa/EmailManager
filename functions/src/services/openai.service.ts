import { Configuration, OpenAIApi } from 'openai';
import * as functions from 'firebase-functions';
import { 
  TaskExtractionResult,
  SYSTEM_PROMPTS,
  openaiUtils
} from '../../../shared/services/openai.types';

// Get API key from environment variables or Firebase config
const getApiKey = () => {
  // First try environment variable
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }
  
  // Then try Firebase Functions config
  if (functions.config().openai?.apikey) {
    return functions.config().openai.apikey;
  }
  
  // No API key found
  functions.logger.error('OpenAI API key is not provided. Please set it using Firebase Functions config or environment variables.');
  return null;
};

const apiKey = getApiKey();

// OpenAI Configuration
const configuration = new Configuration({
  apiKey: apiKey || undefined // OpenAI SDK requires undefined rather than null
});

// Create OpenAI API instance
const openai = new OpenAIApi(configuration);

/**
 * Function to extract tasks from email content (supports Hebrew)
 */
export async function extractTaskFromEmail(
  emailContent: string,
  emailSubject: string,
  language: 'he' | 'en' = 'he'
): Promise<TaskExtractionResult> {
  try {
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured');
    }
    
    // Get model from config or default to gpt-4
    const model = process.env.OPENAI_MODEL || functions.config().openai?.model || 'gpt-4';
    
    // Get system prompt from shared constants
    const systemPrompt = SYSTEM_PROMPTS.TASK_EXTRACTION[language];

    // Create the completion prompt using shared utility
    const prompt = openaiUtils.createTaskExtractionPrompt(emailContent, emailSubject, language);

    // Call the OpenAI API with support for Hebrew content
    const completion = await openai.createChatCompletion({
      model,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: prompt,
        }
      ],
      temperature: 0.3,
      max_tokens: 800,
    });

    // Parse the response
    const responseContent = completion.data.choices[0]?.message?.content || '';
    
    try {
      // Extract JSON from the response using shared utility
      const taskData = openaiUtils.extractJsonFromResponse(responseContent);
      return {
        success: true,
        task: taskData,
      };
    } catch (parseError) {
      functions.logger.error('Error parsing OpenAI response:', parseError);
      return {
        success: false,
        error: 'Failed to parse task data',
        rawResponse: responseContent,
      };
    }
  } catch (error) {
    functions.logger.error('OpenAI API error:', error);
    return {
      success: false,
      error: 'Failed to extract task from email',
    };
  }
}

// Export the service functions
export default {
  extractTaskFromEmail,
}; 