import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebase/config';
import config from '../../../shared/config/env';
import { TaskExtractionResult } from '../../../shared/services/openai.types';

// Initialize Firebase Functions
const functions = getFunctions(app);

/**
 * Process email content with OpenAI via Firebase Functions
 * 
 * @param content Email content to process
 * @param subject Email subject
 * @param language Language of the email (he/en)
 * @returns Task extraction result
 */
export const processEmailContent = async (
  content: string,
  subject: string,
  language: 'he' | 'en' = config.language.default as 'he' | 'en'
): Promise<TaskExtractionResult> => {
  try {
    const processEmailFn = httpsCallable<
      { content: string; subject: string; language: 'he' | 'en' },
      TaskExtractionResult
    >(functions, 'processEmail');
    
    const result = await processEmailFn({
      content,
      subject,
      language
    });
    
    return result.data;
  } catch (error) {
    console.error('Error processing email content:', error);
    return {
      success: false,
      error: 'Failed to process email content'
    };
  }
};

export default {
  processEmailContent
}; 