import { Request, Response, NextFunction } from 'express';
import * as openaiService from '../services/openai.service';
import { createBadRequestError } from '../middleware/errorHandler';

/**
 * Extract tasks from text content
 */
export const extractTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, subject, language = 'he' } = req.body;
    
    if (!content) {
      return next(createBadRequestError('Content is required'));
    }

    const result = await openaiService.extractTaskFromEmail(content, subject, language);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Analyze email content
 */
export const analyzeEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, subject, language = 'he' } = req.body;
    
    if (!content) {
      return next(createBadRequestError('Content is required'));
    }

    // Extract tasks first
    const tasks = await openaiService.extractTaskFromEmail(content, subject, language);
    
    // If tasks were found, analyze their priority
    let priorityResults = null;
    if (tasks.tasks && tasks.tasks.length > 0) {
      const taskTexts = tasks.tasks.map(task => task.description);
      priorityResults = await openaiService.analyzeTaskPriority(taskTexts, language);
    }
    
    res.status(200).json({
      success: true,
      data: {
        extraction: tasks,
        priority: priorityResults
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Analyze task priority
 */
export const analyzeTaskPriority = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tasks, language = 'he' } = req.body;
    
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return next(createBadRequestError('Tasks array is required'));
    }

    const result = await openaiService.analyzeTaskPriority(tasks, language);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate follow-up email
 */
export const generateFollowupEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { task, recipient, daysOverdue, language = 'he' } = req.body;
    
    if (!task) {
      return next(createBadRequestError('Task is required'));
    }
    
    if (!recipient) {
      return next(createBadRequestError('Recipient is required'));
    }

    const result = await openaiService.generateFollowupEmail(task, recipient, daysOverdue, language);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate response to email
 */
export const generateResponseToEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { originalEmail, context, language = 'he' } = req.body;
    
    if (!originalEmail) {
      return next(createBadRequestError('Original email is required'));
    }

    // Use the follow-up email generation with modifications
    const result = await openaiService.generateFollowupEmail(
      originalEmail,
      originalEmail.sender || 'Recipient',
      0,
      language,
      context
    );
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Summarize text
 */
export const summarizeText = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, language = 'he' } = req.body;
    
    if (!text) {
      return next(createBadRequestError('Text is required'));
    }

    // Use OpenAI to generate a summary
    // Since we don't have a dedicated function for this, we'll adapt extractTaskFromEmail
    const prompt = `
    Please summarize the following text in ${language === 'he' ? 'Hebrew' : 'English'}:

    ${text}
    
    Provide a concise summary that captures the main points.
    `;

    // Use the OpenAI service with a customized prompt
    // This is a placeholder and would need to be implemented
    const summary = "Summary functionality needs to be implemented";
    
    res.status(200).json({
      success: true,
      data: {
        summary
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Detect language
 */
export const detectLanguage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return next(createBadRequestError('Text is required'));
    }

    // For now, we'll use a simple heuristic
    // Check if the text contains Hebrew characters
    const hebrewPattern = /[\u0590-\u05FF]/;
    const isHebrew = hebrewPattern.test(text);
    
    res.status(200).json({
      success: true,
      data: {
        detectedLanguage: isHebrew ? 'he' : 'en',
        confidence: 0.8 // Placeholder confidence level
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Translate text
 */
export const translateText = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, sourceLanguage, targetLanguage } = req.body;
    
    if (!text) {
      return next(createBadRequestError('Text is required'));
    }
    
    if (!targetLanguage) {
      return next(createBadRequestError('Target language is required'));
    }

    // Placeholder for translation functionality
    // This would need to be implemented using OpenAI or another translation service
    const translatedText = "Translation functionality needs to be implemented";
    
    res.status(200).json({
      success: true,
      data: {
        originalText: text,
        translatedText,
        sourceLanguage: sourceLanguage || 'auto',
        targetLanguage
      }
    });
  } catch (error) {
    next(error);
  }
}; 