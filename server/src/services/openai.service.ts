import { Configuration, OpenAIApi } from 'openai';
import { 
  TaskExtractionResult, 
  PriorityAnalysisResult, 
  FollowupEmailResult,
  SYSTEM_PROMPTS,
  openaiUtils 
} from '../../../shared/services/openai.types';
import config from '../../../shared/config/env';

// OpenAI Configuration
const configuration = new Configuration({
  apiKey: config.openai.apiKey
});

// Check if API key is available
if (!config.openai.apiKey) {
  console.error('OpenAI API key is not provided. Please set OPENAI_API_KEY environment variable.');
  // We don't exit the process here to allow the application to start,
  // but the OpenAI functions will throw errors when called
}

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
    if (!config.openai.apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const model = config.openai.model;
    
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
      temperature: 0.3, // Lower temperature for more deterministic outputs
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
      console.error('Error parsing OpenAI response:', parseError);
      return {
        success: false,
        error: 'Failed to parse task data',
        rawResponse: responseContent,
      };
    }
  } catch (error) {
    console.error('OpenAI API error:', error);
    return {
      success: false,
      error: 'Failed to extract task from email',
    };
  }
}

/**
 * Function to analyze task priority for reminders (supports Hebrew)
 */
export async function analyzeTaskPriority(
  taskTitle: string,
  taskDescription: string,
  dueDate: string | null,
  language: 'he' | 'en' = 'he'
): Promise<PriorityAnalysisResult> {
  try {
    if (!config.openai.apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const model = config.openai.model;
    
    // Get system prompt from shared constants
    const systemPrompt = SYSTEM_PROMPTS.PRIORITY_ANALYSIS[language];

    // Create the completion prompt using shared utility
    const prompt = openaiUtils.createPriorityAnalysisPrompt(
      taskTitle, 
      taskDescription, 
      dueDate, 
      language
    );

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
      max_tokens: 500,
    });

    // Parse the response
    const responseContent = completion.data.choices[0]?.message?.content || '';
    
    try {
      // Extract JSON from the response using shared utility
      const analysisData = openaiUtils.extractJsonFromResponse(responseContent);
      return {
        success: true,
        analysis: analysisData,
      };
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      return {
        success: false,
        error: 'Failed to parse priority analysis',
        rawResponse: responseContent,
      };
    }
  } catch (error) {
    console.error('OpenAI API error:', error);
    return {
      success: false,
      error: 'Failed to analyze task priority',
    };
  }
}

/**
 * Function to generate a follow-up email (supports Hebrew)
 */
export async function generateFollowupEmail(
  taskTitle: string,
  taskDescription: string,
  dueDate: string | null,
  recipientName: string,
  followupCount: number,
  language: 'he' | 'en' = 'he'
): Promise<FollowupEmailResult> {
  try {
    if (!config.openai.apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const model = config.openai.model;
    
    // Get system prompt from shared constants
    const systemPrompt = SYSTEM_PROMPTS.FOLLOWUP_EMAIL[language];

    // Create the completion prompt using shared utility
    const prompt = openaiUtils.createFollowupEmailPrompt(
      taskTitle,
      taskDescription,
      dueDate,
      recipientName,
      followupCount,
      language
    );

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
      temperature: 0.5, // Allow some creativity in email generation
      max_tokens: 1000,
    });

    // Parse the response
    const responseContent = completion.data.choices[0]?.message?.content || '';
    
    try {
      // Extract JSON from the response using shared utility
      const emailData = openaiUtils.extractJsonFromResponse(responseContent);
      return {
        success: true,
        email: emailData,
      };
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      return {
        success: false,
        error: 'Failed to generate follow-up email',
        rawResponse: responseContent,
      };
    }
  } catch (error) {
    console.error('OpenAI API error:', error);
    return {
      success: false,
      error: 'Failed to generate follow-up email',
    };
  }
}

export default {
  extractTaskFromEmail,
  analyzeTaskPriority,
  generateFollowupEmail
}; 