/**
 * Types for OpenAI task extraction with Hebrew support
 */

export interface TaskBase {
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  deadline?: string; // ISO date string
  assignTo?: string;
  notes?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  language?: 'he' | 'en';
}

export interface Task extends TaskBase {
  id: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  createdBy: string;
  extracted: boolean; // Was this extracted from email
  emailId?: string; // Reference to source email
  sourceType: 'email' | 'manual' | 'imported';
}

export interface TaskExtractionResult {
  tasks: TaskBase[];
  confidence: number; // 0-1 score of extraction confidence
  language: 'he' | 'en';
  suggestedFollowup?: string;
  originalText?: string;
}

export interface HebrewDateInfo {
  gregorianDate: string; // ISO date string
  hebrewDate: string; // Hebrew date representation
  dayOfWeek: string;
  isRecognizedHoliday: boolean;
  holidayName?: string;
}

export interface PriorityAnalysisItem {
  taskIndex: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reasoning: string;
}

export interface PriorityAnalysisResult {
  priorities: PriorityAnalysisItem[];
  language: 'he' | 'en';
}

export interface FollowupEmailResult {
  subject: string;
  emailContent: string;
  sentiment: 'neutral' | 'urgent' | 'friendly' | 'formal';
  language: 'he' | 'en';
}

/**
 * System prompts for different AI tasks
 */
export const SYSTEM_PROMPTS = {
  // Task extraction prompt with Hebrew support
  TASK_EXTRACTION: {
    he: `אתה עוזר מקצועי המומחה בחילוץ משימות מתוך תכני אימייל בעברית. 
    תפקידך הוא לזהות משימות ברורות ומרומזות מתוך הטקסט.
    עבור כל משימה, זהה את המידע הבא אם קיים:
    1. תיאור המשימה
    2. דדליין או תאריך יעד (זיהוי תאריכים בפורמט עברי ולועזי)
    3. סדר עדיפות (גבוה, בינוני, נמוך, דחוף)
    4. למי המשימה מיועדת
    5. הערות נוספות

    החזר את התשובה בפורמט JSON בלבד בפורמט הבא:
    {
      "tasks": [
        {
          "description": "תיאור המשימה",
          "deadline": "YYYY-MM-DD",
          "priority": "high/medium/low/urgent",
          "assignTo": "שם האדם",
          "notes": "הערות נוספות"
        }
      ],
      "confidence": 0.8,
      "language": "he",
      "suggestedFollowup": "הצעה למעקב"
    }

    זיהוי תאריכים עבריים: כאשר מופיעים ביטויים כמו "עד יום ראשון", "עד מחר", "בעוד שבוע", "בעוד חודש", "עד סוף השבוע", המר אותם לפורמט ISO תאריך YYYY-MM-DD.
    אם לא מצאת משימה, החזר מערך ריק של משימות.
    הערך confidence צריך לשקף את רמת הביטחון שלך בזיהוי המשימות (0-1).`,

    en: `You are a professional assistant specialized in extracting tasks from email content.
    Your job is to identify clear and implied tasks from text.
    For each task, identify the following information if present:
    1. Task description
    2. Deadline or due date
    3. Priority level (high, medium, low, urgent)
    4. Who the task is assigned to
    5. Additional notes

    Return your answer in JSON format only as follows:
    {
      "tasks": [
        {
          "description": "Task description",
          "deadline": "YYYY-MM-DD",
          "priority": "high/medium/low/urgent",
          "assignTo": "Person's name",
          "notes": "Additional notes"
        }
      ],
      "confidence": 0.8,
      "language": "en",
      "suggestedFollowup": "suggestion for follow-up"
    }

    Date recognition: When expressions like "by Sunday", "by tomorrow", "in a week", "in a month", "by the end of the week" appear, convert them to ISO date format YYYY-MM-DD.
    If you don't find any tasks, return an empty array of tasks.
    The confidence value should reflect your confidence level in identifying the tasks (0-1).`
  },

  // Priority analysis prompt
  PRIORITY_ANALYSIS: {
    he: `אתה עוזר מקצועי המתמחה בניתוח וקביעת סדרי עדיפויות למשימות.
    קבל רשימה של תיאורי משימות ונתח את רמת העדיפות המתאימה לכל אחת.
    השתמש ברמות העדיפות הבאות: נמוך, בינוני, גבוה, דחוף.
    
    הגורמים שיש לשקול:
    1. דחיפות - האם המשימה זקוקה לטיפול מיידי?
    2. חשיבות - מה ההשפעה של המשימה?
    3. תלויות - האם משימות אחרות תלויות בהשלמתה?
    4. מאמץ - כמה זמן ייקח להשלים את המשימה?
    
    החזר תשובה בפורמט JSON בלבד:
    {
      "priorities": [
        {
          "taskIndex": 0,
          "priority": "high/medium/low/urgent",
          "reasoning": "הסבר קצר לקביעת העדיפות"
        }
      ],
      "language": "he"
    }`,

    en: `You are a professional assistant specialized in analyzing and determining priorities for tasks.
    Receive a list of task descriptions and analyze the appropriate priority level for each.
    Use the following priority levels: low, medium, high, urgent.
    
    Factors to consider:
    1. Urgency - Does the task need immediate attention?
    2. Importance - What is the impact of the task?
    3. Dependencies - Do other tasks depend on its completion?
    4. Effort - How long will it take to complete the task?
    
    Return an answer in JSON format only:
    {
      "priorities": [
        {
          "taskIndex": 0,
          "priority": "high/medium/low/urgent",
          "reasoning": "Brief explanation for the priority determination"
        }
      ],
      "language": "en"
    }`
  },

  // Follow-up email generation prompt
  FOLLOWUP_EMAIL: {
    he: `אתה עוזר מקצועי המתמחה בכתיבת אימיילים לצורך מעקב אחר משימות.
    חבר אימייל מעקב מקצועי, מנומס וברור בעברית.
    
    הקפד על:
    1. כותרת קצרה ומדויקת
    2. פתיחה מנומסת ומקצועית
    3. תזכורת ברורה לגבי המשימה
    4. אזכור התאריך/דדליין אם קיים
    5. בקשה מנומסת לעדכון או משוב
    6. סגירה מנומסת
    
    החזר תשובה בפורמט JSON בלבד:
    {
      "subject": "כותרת האימייל",
      "emailContent": "תוכן האימייל המלא",
      "sentiment": "neutral/urgent/friendly/formal",
      "language": "he"
    }`,

    en: `You are a professional assistant specialized in writing follow-up emails for tasks.
    Compose a professional, polite, and clear follow-up email.
    
    Focus on:
    1. Short and accurate subject line
    2. Polite and professional opening
    3. Clear reminder about the task
    4. Mention of the date/deadline if applicable
    5. Polite request for update or feedback
    6. Polite closing
    
    Return an answer in JSON format only:
    {
      "subject": "Email subject line",
      "emailContent": "Full email content",
      "sentiment": "neutral/urgent/friendly/formal",
      "language": "en"
    }`
  },

  // Hebrew date parsing prompt
  DATE_PARSING: {
    he: `אתה עוזר מקצועי המתמחה בפענוח תאריכים המופיעים בטקסט עברי ותרגומם לפורמט תאריך סטנדרטי.
    
    הבן ביטויי תאריך בעברית כגון:
    1. "מחר", "אתמול", "היום", "בעוד שבוע"
    2. "יום ראשון הקרוב", "שלישי הבא", "בעוד יומיים"
    3. "ה-15 לחודש", "15 למאי", "ט"ו באייר"
    4. "סוף החודש", "תחילת השבוע הבא", "אמצע החודש"
    5. "חג פסח", "ערב ראש השנה", "ל"ג בעומר"
    
    התייחס גם לתאריך הנוכחי בעת הניתוח.
    
    החזר תשובה בפורמט JSON בלבד:
    {
      "gregorianDate": "YYYY-MM-DD",
      "hebrewDate": "ייצוג התאריך העברי",
      "dayOfWeek": "יום בשבוע",
      "isRecognizedHoliday": true/false,
      "holidayName": "שם החג (אם רלוונטי)"
    }`,

    en: `You are a professional assistant specialized in decoding dates appearing in text and translating them to standard date format.
    
    Understand date expressions such as:
    1. "tomorrow", "yesterday", "today", "in a week"
    2. "next Sunday", "this Tuesday", "in two days"
    3. "the 15th of the month", "May 15th", "mid-April" 
    4. "end of the month", "beginning of next week", "mid-month"
    5. "Christmas", "Thanksgiving", "Labor Day"
    
    Also consider the current date when analyzing.
    
    Return an answer in JSON format only:
    {
      "gregorianDate": "YYYY-MM-DD",
      "hebrewDate": "Hebrew date representation",
      "dayOfWeek": "Day of week",
      "isRecognizedHoliday": true/false,
      "holidayName": "Holiday name (if relevant)"
    }`
  }
};

/**
 * Utility functions for OpenAI
 */
export const openaiUtils = {
  /**
   * Create a task extraction prompt with Hebrew support
   */
  createTaskExtractionPrompt: (content: string, subject: string, language: 'he' | 'en'): string => {
    const prompt = language === 'he' 
      ? `תוכן האימייל הבא: 
        כותרת: ${subject}
        
        ${content}
        
        זהה משימות מהטקסט הזה ותן תשובה בפורמט JSON בלבד.`
      : `Analyze the following email content:
        Subject: ${subject}
        
        ${content}
        
        Identify tasks from this text and give an answer in JSON format only.`;
    
    return prompt;
  },

  /**
   * Create a priority analysis prompt
   */
  createPriorityAnalysisPrompt: (tasks: string[], language: 'he' | 'en'): string => {
    const tasksText = tasks.map((task, index) => `${index + 1}. ${task}`).join('\n');
    
    const prompt = language === 'he'
      ? `נתח את רמת העדיפות של המשימות הבאות:
        
        ${tasksText}
        
        קבע רמת עדיפות לכל משימה והסבר את החלטתך. תן תשובה בפורמט JSON בלבד.`
      : `Analyze the priority level of the following tasks:
        
        ${tasksText}
        
        Determine a priority level for each task and explain your decision. Give your answer in JSON format only.`;
    
    return prompt;
  },

  /**
   * Create a follow-up email prompt
   */
  createFollowupEmailPrompt: (
    taskName: string, 
    recipient: string, 
    daysOverdue: number,
    language: 'he' | 'en'
  ): string => {
    const overdueText = daysOverdue > 0
      ? language === 'he'
        ? `המשימה באיחור של ${daysOverdue} ימים.`
        : `The task is ${daysOverdue} days overdue.`
      : '';
    
    const prompt = language === 'he'
      ? `כתוב אימייל מעקב קצר ומקצועי עבור המשימה: "${taskName}".
        האימייל מיועד ל: ${recipient}.
        ${overdueText}
        
        יש לכלול כותרת ותוכן אימייל. תן תשובה בפורמט JSON בלבד.`
      : `Write a short, professional follow-up email for the task: "${taskName}".
        The email is addressed to: ${recipient}.
        ${overdueText}
        
        Include a subject line and email content. Give your answer in JSON format only.`;
    
    return prompt;
  },

  /**
   * Create a date parsing prompt
   */
  createDateParsingPrompt: (dateText: string, language: 'he' | 'en'): string => {
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const prompt = language === 'he'
      ? `התאריך הנוכחי: ${currentDate}
        
        פענח את התאריך הבא מטקסט בעברית: "${dateText}"
        
        המר לפורמט תאריך גרגוריאני סטנדרטי וספק מידע על התאריך העברי המקביל. תן תשובה בפורמט JSON בלבד.`
      : `Current date: ${currentDate}
        
        Decode the following date from text: "${dateText}"
        
        Convert to standard Gregorian date format and provide information about the corresponding Hebrew date if relevant. Give your answer in JSON format only.`;
    
    return prompt;
  },

  /**
   * Extract JSON from OpenAI response
   */
  extractJsonFromResponse: (text: string): any => {
    // Find content between first { and last }
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (error) {
        console.error('Error parsing JSON from response:', error);
      }
    }
    
    // If no JSON or parsing failed, return null
    return null;
  }
}; 