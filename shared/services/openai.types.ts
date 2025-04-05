/**
 * Task extraction result interface
 */
export interface TaskExtractionResult {
  success: boolean;
  task?: {
    title: string;
    description: string;
    dueDate: string | null;
    priority: 'low' | 'medium' | 'high' | 'urgent' | 'נמוכה' | 'בינונית' | 'גבוהה' | 'דחופה';
    tags: string[];
    containsTask: boolean;
  };
  error?: string;
  rawResponse?: string;
}

/**
 * Task priority analysis result interface
 */
export interface PriorityAnalysisResult {
  success: boolean;
  analysis?: {
    priority: 'low' | 'medium' | 'high' | 'urgent' | 'נמוכה' | 'בינונית' | 'גבוהה' | 'דחופה';
    reminderFrequency: 'daily' | 'weekly' | 'custom';
    customReminderDays: number;
    reasoning: string;
  };
  error?: string;
  rawResponse?: string;
}

/**
 * Follow-up email generation result interface
 */
export interface FollowupEmailResult {
  success: boolean;
  email?: {
    subject: string;
    body: string;
  };
  error?: string;
  rawResponse?: string;
}

/**
 * Shared prompt templates for system messages (Hebrew and English)
 */
export const SYSTEM_PROMPTS = {
  TASK_EXTRACTION: {
    he: 'אתה עוזר מומחה שמזהה ומחלץ משימות מתוך תוכן אימייל. תחלץ את הפרטים הבאים: כותרת המשימה, תיאור, תאריך יעד (אם מצוין), רמת עדיפות (נמוכה, בינונית, גבוהה, דחופה), ותגיות רלוונטיות. אם האימייל אינו מכיל משימה, ציין זאת.',
    en: 'You are an expert assistant that identifies and extracts tasks from email content. Extract the following details: task title, description, due date (if specified), priority level (low, medium, high, urgent), and relevant tags. If the email does not contain a task, indicate that.'
  },
  PRIORITY_ANALYSIS: {
    he: 'אתה עוזר מומחה שמנתח משימות וקובע את רמת העדיפות והדחיפות שלהן.',
    en: 'You are an expert assistant that analyzes tasks and determines their priority and urgency.'
  },
  FOLLOWUP_EMAIL: {
    he: 'אתה עוזר מומחה שכותב הודעות מעקב מקצועיות ומנומסות למשימות שממתינות להשלמה.',
    en: 'You are an expert assistant that writes professional and polite follow-up messages for tasks that are pending completion.'
  }
};

/**
 * Shared utility functions for OpenAI service
 */
export const openaiUtils = {
  /**
   * Extracts JSON from OpenAI response text
   */
  extractJsonFromResponse(responseContent: string): any {
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }
    
    const jsonStr = jsonMatch[0];
    return JSON.parse(jsonStr);
  },
  
  /**
   * Creates a task extraction prompt based on language
   */
  createTaskExtractionPrompt(emailContent: string, emailSubject: string, language: 'he' | 'en'): string {
    return language === 'he'
      ? `נושא האימייל: ${emailSubject}\n\nתוכן האימייל:\n${emailContent}\n\nתחלץ משימה מהאימייל הזה בפורמט JSON הבא:\n{\n  "title": "כותרת המשימה",\n  "description": "תיאור המשימה",\n  "dueDate": "YYYY-MM-DD או null אם לא צוין",\n  "priority": "נמוכה/בינונית/גבוהה/דחופה",\n  "tags": ["תגית1", "תגית2"],\n  "containsTask": true/false\n}`
      : `Email Subject: ${emailSubject}\n\nEmail Content:\n${emailContent}\n\nExtract a task from this email in the following JSON format:\n{\n  "title": "Task title",\n  "description": "Task description",\n  "dueDate": "YYYY-MM-DD or null if not specified",\n  "priority": "low/medium/high/urgent",\n  "tags": ["tag1", "tag2"],\n  "containsTask": true/false\n}`;
  },
  
  /**
   * Creates a task priority analysis prompt based on language
   */
  createPriorityAnalysisPrompt(
    taskTitle: string,
    taskDescription: string,
    dueDate: string | null,
    language: 'he' | 'en'
  ): string {
    return language === 'he'
      ? `כותרת המשימה: ${taskTitle}\n\nתיאור המשימה: ${taskDescription}\n\nתאריך יעד: ${dueDate || 'לא צוין'}\n\nנתח את המשימה הזו וקבע את רמת העדיפות שלה (נמוכה, בינונית, גבוהה, דחופה) וכמה תזכורות יש לשלוח לפני התאריך. החזר את התשובה בפורמט JSON הבא:\n{\n  "priority": "נמוכה/בינונית/גבוהה/דחופה",\n  "reminderFrequency": "daily/weekly/custom",\n  "customReminderDays": 3,\n  "reasoning": "הסבר קצר לקביעה שלך"\n}`
      : `Task Title: ${taskTitle}\n\nTask Description: ${taskDescription}\n\nDue Date: ${dueDate || 'Not specified'}\n\nAnalyze this task and determine its priority level (low, medium, high, urgent) and how many reminders should be sent before the deadline. Return the answer in the following JSON format:\n{\n  "priority": "low/medium/high/urgent",\n  "reminderFrequency": "daily/weekly/custom",\n  "customReminderDays": 3,\n  "reasoning": "Brief explanation for your determination"\n}`;
  },
  
  /**
   * Creates a follow-up email prompt based on language and follow-up count
   */
  createFollowupEmailPrompt(
    taskTitle: string,
    taskDescription: string,
    dueDate: string | null,
    recipientName: string,
    followupCount: number,
    language: 'he' | 'en'
  ): string {
    // Determine tone based on follow-up count
    let tone = 'polite';
    if (followupCount > 2) {
      tone = 'urgent';
    } else if (followupCount > 1) {
      tone = 'assertive';
    }
    
    return language === 'he'
      ? `כותרת המשימה: ${taskTitle}\n\nתיאור המשימה: ${taskDescription}\n\nתאריך יעד: ${dueDate || 'לא צוין'}\n\nשם הנמען: ${recipientName}\n\nזוהי הודעת המעקב מספר ${followupCount}.\n\nכתוב הודעת מעקב בטון ${tone === 'polite' ? 'מנומס' : tone === 'assertive' ? 'תקיף' : 'דחוף'} עבור המשימה הזו. ההודעה צריכה לכלול:\n1. שורת נושא\n2. פנייה אישית\n3. תזכורת לגבי המשימה\n4. בקשה לעדכון סטטוס\n5. תאריך היעד (אם רלוונטי)\n6. חתימה\n\nהחזר את התשובה בפורמט JSON:\n{\n  "subject": "שורת הנושא",\n  "body": "תוכן ההודעה המלא"\n}`
      : `Task Title: ${taskTitle}\n\nTask Description: ${taskDescription}\n\nDue Date: ${dueDate || 'Not specified'}\n\nRecipient Name: ${recipientName}\n\nThis is follow-up number ${followupCount}.\n\nWrite a follow-up message in a ${tone} tone for this task. The message should include:\n1. Subject line\n2. Personal greeting\n3. Reminder about the task\n4. Request for status update\n5. Due date (if relevant)\n6. Signature\n\nReturn the answer in JSON format:\n{\n  "subject": "The subject line",\n  "body": "The full message content"\n}`;
  }
}; 