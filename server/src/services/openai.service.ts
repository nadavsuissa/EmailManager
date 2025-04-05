import { Configuration, OpenAIApi } from 'openai';
import { config } from '../config/env';
import { 
  TaskExtractionResult, 
  PriorityAnalysisResult, 
  FollowupEmailResult,
  HebrewDateInfo,
  SYSTEM_PROMPTS,
  openaiUtils
} from '../../../shared/services/openai.types';
import * as dateService from './date.service';

// Configuration for OpenAI API
const getApiKey = (): string => {
  const apiKey = config.openai.apiKey;
  
  if (!apiKey) {
    console.error('OpenAI API key is not configured');
    throw new Error('OpenAI API key is missing');
  }
  
  return apiKey;
};

// Initialize OpenAI configuration
const configuration = new Configuration({
  apiKey: getApiKey(),
});

const openai = new OpenAIApi(configuration);

/**
 * Extract tasks from an email with Hebrew support
 */
export const extractTaskFromEmail = async (
  content: string, 
  subject: string = '', 
  language: 'he' | 'en' = 'he'
): Promise<TaskExtractionResult> => {
  try {
    // Default result in case of error
    const defaultResult: TaskExtractionResult = {
      tasks: [],
      confidence: 0,
      language: language
    };
    
    // Create the prompt
    const systemPrompt = SYSTEM_PROMPTS.TASK_EXTRACTION[language];
    const userPrompt = openaiUtils.createTaskExtractionPrompt(content, subject, language);
    
    // Call OpenAI
    const response = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2,
      max_tokens: 1000
    });
    
    // Extract the content from the response
    const responseContent = response.data.choices[0]?.message?.content;
    
    if (!responseContent) {
      console.error('Empty response from OpenAI');
      return defaultResult;
    }
    
    // Extract JSON from the response
    const extractedData = openaiUtils.extractJsonFromResponse(responseContent);
    
    if (!extractedData) {
      console.error('Failed to extract JSON from response');
      return defaultResult;
    }
    
    // Process and enhance the extracted tasks
    // We'll enrich the task data with better date parsing
    const enhancedTasks = await Promise.all((extractedData.tasks || []).map(async (task: any) => {
      // If we have a deadline text that needs parsing
      if (task.deadline && dateService.containsDate(task.deadline)) {
        try {
          // Try to parse with our specialized date service
          const parsedDate = await dateService.parseDate(task.deadline, language);
          task.deadline = parsedDate.gregorianDate;
          task.parsedDateInfo = parsedDate;
        } catch (error) {
          console.error('Error parsing date:', error);
          // Keep the original deadline if parsing fails
        }
      }
      
      return task;
    }));
    
    // Return the processed result
    return {
      tasks: enhancedTasks,
      confidence: extractedData.confidence || 0,
      language: extractedData.language || language,
      suggestedFollowup: extractedData.suggestedFollowup,
      originalText: content
    };
  } catch (error) {
    console.error('Error extracting tasks from email:', error);
    
    // Return empty result on error
    return {
      tasks: [],
      confidence: 0,
      language: language,
      originalText: content
    };
  }
};

/**
 * Analyze task priority with Hebrew support
 */
export const analyzeTaskPriority = async (
  taskDescriptions: string[], 
  language: 'he' | 'en' = 'he'
): Promise<PriorityAnalysisResult> => {
  try {
    // Default result in case of error
    const defaultResult: PriorityAnalysisResult = {
      priorities: [],
      language: language
    };
    
    // If no tasks provided, return empty result
    if (!taskDescriptions || taskDescriptions.length === 0) {
      return defaultResult;
    }
    
    // Create the prompt
    const systemPrompt = SYSTEM_PROMPTS.PRIORITY_ANALYSIS[language];
    const userPrompt = openaiUtils.createPriorityAnalysisPrompt(taskDescriptions, language);
    
    // Call OpenAI
    const response = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });
    
    // Extract the content from the response
    const responseContent = response.data.choices[0]?.message?.content;
    
    if (!responseContent) {
      console.error('Empty response from OpenAI');
      return defaultResult;
    }
    
    // Extract JSON from the response
    const extractedData = openaiUtils.extractJsonFromResponse(responseContent);
    
    if (!extractedData || !extractedData.priorities) {
      console.error('Failed to extract priorities from response');
      return defaultResult;
    }
    
    // Make sure each priority has the required fields
    const validPriorities = extractedData.priorities.filter((item: any) => 
      typeof item.taskIndex === 'number' && 
      typeof item.priority === 'string' &&
      typeof item.reasoning === 'string'
    );
    
    // Return the processed result
    return {
      priorities: validPriorities,
      language: extractedData.language || language
    };
  } catch (error) {
    console.error('Error analyzing task priorities:', error);
    
    // Return empty result on error
    return {
      priorities: [],
      language: language
    };
  }
};

/**
 * Generate a follow-up email based on task information
 */
export const generateFollowupEmail = async (
  taskName: string,
  recipient: string,
  daysOverdue: number,
  language: 'he' | 'en' = 'he'
): Promise<FollowupEmailResult> => {
  try {
    // Default result in case of error
    const defaultResult: FollowupEmailResult = {
      subject: `מעקב: ${taskName}`,
      emailContent: `שלום ${recipient},\n\nזוהי הודעת מעקב לגבי המשימה "${taskName}".\n\nבברכה,`,
      sentiment: 'neutral',
      language: language
    };
    
    // Create the prompt
    const systemPrompt = SYSTEM_PROMPTS.FOLLOWUP_EMAIL[language];
    const userPrompt = openaiUtils.createFollowupEmailPrompt(taskName, recipient, daysOverdue, language);
    
    // Call OpenAI
    const response = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.5,
      max_tokens: 1000
    });
    
    // Extract the content from the response
    const responseContent = response.data.choices[0]?.message?.content;
    
    if (!responseContent) {
      console.error('Empty response from OpenAI');
      return defaultResult;
    }
    
    // Extract JSON from the response
    const extractedData = openaiUtils.extractJsonFromResponse(responseContent);
    
    if (!extractedData) {
      console.error('Failed to extract email from response');
      return defaultResult;
    }
    
    // Return the processed result
    return {
      subject: extractedData.subject || defaultResult.subject,
      emailContent: extractedData.emailContent || defaultResult.emailContent,
      sentiment: extractedData.sentiment || 'neutral',
      language: extractedData.language || language
    };
  } catch (error) {
    console.error('Error generating follow-up email:', error);
    
    // Return default result on error
    return defaultResult;
  }
};

/**
 * Parse date text with Hebrew support using OpenAI
 */
export const parseDateText = async (
  dateText: string, 
  language: 'he' | 'en' = 'he'
): Promise<HebrewDateInfo> => {
  try {
    // Default result in case of error
    const currentDate = new Date();
    const defaultResult: HebrewDateInfo = {
      gregorianDate: currentDate.toISOString().split('T')[0],
      hebrewDate: 'לא זוהה',
      dayOfWeek: language === 'he' ? 'לא זוהה' : 'Unknown',
      isRecognizedHoliday: false
    };
    
    // Create the prompt
    const systemPrompt = SYSTEM_PROMPTS.DATE_PARSING[language];
    const userPrompt = openaiUtils.createDateParsingPrompt(dateText, language);
    
    // Call OpenAI
    const response = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2,
      max_tokens: 500
    });
    
    // Extract the content from the response
    const responseContent = response.data.choices[0]?.message?.content;
    
    if (!responseContent) {
      console.error('Empty response from OpenAI');
      return defaultResult;
    }
    
    // Extract JSON from the response
    const extractedData = openaiUtils.extractJsonFromResponse(responseContent);
    
    if (!extractedData || !extractedData.gregorianDate) {
      console.error('Failed to extract date from response');
      return defaultResult;
    }
    
    // Validate the gregorian date
    const date = new Date(extractedData.gregorianDate);
    if (isNaN(date.getTime())) {
      console.error('Invalid date returned:', extractedData.gregorianDate);
      return defaultResult;
    }
    
    // Return the processed result
    return {
      gregorianDate: extractedData.gregorianDate,
      hebrewDate: extractedData.hebrewDate || defaultResult.hebrewDate,
      dayOfWeek: extractedData.dayOfWeek || defaultResult.dayOfWeek,
      isRecognizedHoliday: extractedData.isRecognizedHoliday || false,
      holidayName: extractedData.holidayName
    };
  } catch (error) {
    console.error('Error parsing date text:', error);
    
    // Return default result on error
    const currentDate = new Date();
    return {
      gregorianDate: currentDate.toISOString().split('T')[0],
      hebrewDate: 'לא זוהה',
      dayOfWeek: language === 'he' ? 'לא זוהה' : 'Unknown',
      isRecognizedHoliday: false
    };
  }
};

export default {
  extractTaskFromEmail,
  analyzeTaskPriority,
  generateFollowupEmail,
  parseDateText
}; 