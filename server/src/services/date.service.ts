import { HebrewDateInfo } from '../../../shared/services/openai.types';
import * as openaiService from './openai.service';

// Map of Hebrew days of the week
const HEBREW_DAYS = {
  'Sunday': 'יום ראשון',
  'Monday': 'יום שני',
  'Tuesday': 'יום שלישי',
  'Wednesday': 'יום רביעי',
  'Thursday': 'יום חמישי',
  'Friday': 'יום שישי',
  'Saturday': 'יום שבת'
};

// Jewish holidays by month
const JEWISH_HOLIDAYS = {
  1: [ // Tishrei
    { day: 1, name: 'ראש השנה', length: 2 },
    { day: 10, name: 'יום כיפור', length: 1 },
    { day: 15, name: 'סוכות', length: 7 },
    { day: 22, name: 'שמיני עצרת', length: 1 },
    { day: 23, name: 'שמחת תורה', length: 1 }
  ],
  2: [ // Cheshvan
    // No major holidays
  ],
  3: [ // Kislev
    { day: 25, name: 'חנוכה', length: 8 }
  ],
  4: [ // Tevet
    // Continuation of Chanukah
  ],
  5: [ // Shevat
    { day: 15, name: 'ט״ו בשבט', length: 1 }
  ],
  6: [ // Adar (or Adar I in leap years)
    { day: 14, name: 'פורים', length: 1 }
  ],
  7: [ // Nisan
    { day: 15, name: 'פסח', length: 7 }
  ],
  8: [ // Iyar
    { day: 18, name: 'ל״ג בעומר', length: 1 }
  ],
  9: [ // Sivan
    { day: 6, name: 'שבועות', length: 1 }
  ],
  10: [ // Tammuz
    // No major holidays
  ],
  11: [ // Av
    { day: 9, name: 'תשעה באב', length: 1 }
  ],
  12: [ // Elul
    // No major holidays
  ]
};

// Common Hebrew date expressions
const COMMON_DATE_EXPRESSIONS = {
  'היום': 0,
  'מחר': 1,
  'מחרתיים': 2,
  'אתמול': -1,
  'שלשום': -2,
  'עוד שבוע': 7,
  'בעוד שבוע': 7,
  'בעוד שבועיים': 14,
  'עוד חודש': 30,
  'בעוד חודש': 30,
  'עוד שנה': 365,
  'בעוד שנה': 365
};

/**
 * Parse a date string and extract a standardized date
 * For complex or ambiguous date strings, uses OpenAI to assist in parsing
 */
export const parseDate = async (dateText: string, language: 'he' | 'en' = 'he'): Promise<HebrewDateInfo> => {
  try {
    // First try simple date parsing for common expressions
    const simpleResult = parseSimpleDateExpression(dateText, language);
    if (simpleResult) {
      return simpleResult;
    }
    
    // For more complex parsing, use OpenAI
    return await parseComplexDateWithAI(dateText, language);
  } catch (error) {
    console.error('Error parsing date:', error);
    // Return current date as fallback
    const currentDate = new Date();
    return {
      gregorianDate: currentDate.toISOString().split('T')[0],
      hebrewDate: 'לא זוהה',
      dayOfWeek: getDayOfWeekInHebrew(currentDate.getDay()),
      isRecognizedHoliday: false
    };
  }
};

/**
 * Parse simple date expressions like "today", "tomorrow", etc.
 */
const parseSimpleDateExpression = (dateText: string, language: 'he' | 'en'): HebrewDateInfo | null => {
  const normalizedText = dateText.trim().toLowerCase();
  
  // Check for common expressions
  let daysToAdd: number | undefined;
  
  if (language === 'he') {
    daysToAdd = COMMON_DATE_EXPRESSIONS[normalizedText];
  } else {
    // English equivalents
    const englishExpressions: {[key: string]: number} = {
      'today': 0,
      'tomorrow': 1,
      'day after tomorrow': 2,
      'yesterday': -1,
      'day before yesterday': -2,
      'in a week': 7,
      'one week from now': 7,
      'in two weeks': 14,
      'in a month': 30,
      'one month from now': 30,
      'in a year': 365,
      'one year from now': 365
    };
    daysToAdd = englishExpressions[normalizedText];
  }
  
  if (daysToAdd !== undefined) {
    const date = new Date();
    date.setDate(date.getDate() + daysToAdd);
    
    return {
      gregorianDate: date.toISOString().split('T')[0],
      hebrewDate: approximateHebrewDate(date),
      dayOfWeek: getDayOfWeekInHebrew(date.getDay()),
      isRecognizedHoliday: false
    };
  }
  
  // Check for day of week matches in Hebrew
  if (language === 'he') {
    const dayMatch = normalizedText.match(/(?:יום\s+)?(ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת)(?:\s+הקרוב)?/);
    if (dayMatch) {
      const dayName = dayMatch[1];
      const targetDay = getHebrewDayIndex(dayName);
      if (targetDay !== null) {
        const date = getNextDayOfWeek(targetDay);
        return {
          gregorianDate: date.toISOString().split('T')[0],
          hebrewDate: approximateHebrewDate(date),
          dayOfWeek: getDayOfWeekInHebrew(targetDay),
          isRecognizedHoliday: false
        };
      }
    }
  } else {
    // English day of week
    const dayMatch = normalizedText.match(/(?:this\s+|next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
    if (dayMatch) {
      const dayName = dayMatch[1];
      const isNext = normalizedText.includes('next');
      
      const targetDay = {
        'sunday': 0,
        'monday': 1,
        'tuesday': 2,
        'wednesday': 3,
        'thursday': 4,
        'friday': 5,
        'saturday': 6
      }[dayName];
      
      if (targetDay !== undefined) {
        const date = getNextDayOfWeek(targetDay, isNext);
        return {
          gregorianDate: date.toISOString().split('T')[0],
          hebrewDate: approximateHebrewDate(date),
          dayOfWeek: getDayOfWeekInHebrew(targetDay),
          isRecognizedHoliday: false
        };
      }
    }
  }
  
  // Check for specific dates in DD/MM/YYYY format
  const dateMatch = normalizedText.match(/(\d{1,2})[\/\.\-](\d{1,2})(?:[\/\.\-](\d{2,4}))?/);
  if (dateMatch) {
    const day = parseInt(dateMatch[1], 10);
    const month = parseInt(dateMatch[2], 10);
    
    let year = dateMatch[3] ? parseInt(dateMatch[3], 10) : new Date().getFullYear();
    // Handle 2-digit years
    if (year < 100) {
      year = year + (year > 50 ? 1900 : 2000);
    }
    
    if (day > 0 && day <= 31 && month > 0 && month <= 12) {
      const date = new Date(year, month - 1, day);
      
      // Check if this is a Jewish holiday
      const holiday = checkForJewishHoliday(day, month);
      
      return {
        gregorianDate: date.toISOString().split('T')[0],
        hebrewDate: approximateHebrewDate(date),
        dayOfWeek: getDayOfWeekInHebrew(date.getDay()),
        isRecognizedHoliday: !!holiday,
        holidayName: holiday
      };
    }
  }
  
  // No simple match found
  return null;
};

/**
 * Parse complex or ambiguous date expressions using OpenAI
 */
const parseComplexDateWithAI = async (dateText: string, language: 'he' | 'en'): Promise<HebrewDateInfo> => {
  try {
    const response = await openaiService.parseDateText(dateText, language);
    
    // Make sure we have a valid date
    const date = new Date(response.gregorianDate);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date returned from AI parsing');
    }
    
    return response;
  } catch (error) {
    console.error('Error parsing complex date with AI:', error);
    throw error;
  }
};

/**
 * Get the next occurrence of a specific day of the week
 */
const getNextDayOfWeek = (dayIndex: number, skipNext: boolean = false): Date => {
  const today = new Date();
  const todayIndex = today.getDay();
  
  let daysToAdd: number;
  
  if (todayIndex === dayIndex) {
    // Today is the target day
    daysToAdd = skipNext ? 7 : 0;
  } else if (todayIndex < dayIndex) {
    // Target day is later this week
    daysToAdd = dayIndex - todayIndex;
  } else {
    // Target day is next week
    daysToAdd = 7 - todayIndex + dayIndex;
  }
  
  // If skipNext is true and we haven't already accounted for it, add 7 days
  if (skipNext && todayIndex !== dayIndex) {
    daysToAdd += 7;
  }
  
  const nextOccurrence = new Date(today);
  nextOccurrence.setDate(today.getDate() + daysToAdd);
  
  return nextOccurrence;
};

/**
 * Get the index of a Hebrew day name
 */
const getHebrewDayIndex = (hebrewDayName: string): number | null => {
  const mapping: {[key: string]: number} = {
    'ראשון': 0,
    'שני': 1,
    'שלישי': 2,
    'רביעי': 3,
    'חמישי': 4,
    'שישי': 5,
    'שבת': 6
  };
  
  return mapping[hebrewDayName] !== undefined ? mapping[hebrewDayName] : null;
};

/**
 * Convert a day index to Hebrew day name
 */
const getDayOfWeekInHebrew = (dayIndex: number): string => {
  const days = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'שבת'];
  return days[dayIndex] || '';
};

/**
 * Create an approximate Hebrew date representation
 * Note: For accurate Hebrew calendar conversion, a specialized library would be required
 */
const approximateHebrewDate = (date: Date): string => {
  // This is just a placeholder. In a real implementation, you would use a Hebrew
  // calendar library to convert between Gregorian and Hebrew dates.
  const day = date.getDate();
  const month = date.getMonth() + 1; // JavaScript months are 0-based
  const year = date.getFullYear();
  
  // Return a simple string representation
  return `${day}/${month}/${year} (גרגוריאני)`;
};

/**
 * Check if a date corresponds to a Jewish holiday
 */
const checkForJewishHoliday = (day: number, month: number): string | null => {
  // This is a simplified approach. In a real implementation, you would need
  // to convert from Gregorian to Hebrew calendar to accurately identify holidays.
  
  // For demonstration, we'll just check against common Gregorian dates
  // of major holidays (approximate and can vary by year)
  const commonHolidays: {[key: string]: string} = {
    '15/4': 'פסח', // Passover
    '5/10': 'יום כיפור', // Yom Kippur
    '25/12': 'חנוכה', // Chanukah
    '14/3': 'פורים', // Purim
    '6/6': 'שבועות' // Shavuot
  };
  
  const dateKey = `${day}/${month}`;
  return commonHolidays[dateKey] || null;
};

/**
 * Check if a string contains a date
 */
export const containsDate = (text: string): boolean => {
  // Check for common date formats and expressions
  const datePatterns = [
    // DD/MM/YYYY or DD.MM.YYYY or DD-MM-YYYY
    /\d{1,2}[\/\.\-]\d{1,2}(?:[\/\.\-]\d{2,4})?/,
    
    // Hebrew day names
    /(?:יום\s+)?(?:ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת)(?:\s+הקרוב)?/,
    
    // Common Hebrew expressions
    /היום|מחר|מחרתיים|אתמול|שלשום|עוד שבוע|בעוד שבוע|בעוד שבועיים|עוד חודש|בעוד חודש/,
    
    // English day names
    /(?:this\s+|next\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)/,
    
    // Common English expressions
    /today|tomorrow|yesterday|in a week|in a month|next week|next month/,
    
    // Month names
    /ינואר|פברואר|מרץ|אפריל|מאי|יוני|יולי|אוגוסט|ספטמבר|אוקטובר|נובמבר|דצמבר/,
    /january|february|march|april|may|june|july|august|september|october|november|december/
  ];
  
  return datePatterns.some(pattern => pattern.test(text.toLowerCase()));
};

/**
 * Check if a date is a weekend (Friday or Saturday in Israel)
 */
export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 5 || day === 6; // Friday or Saturday
};

/**
 * Check if a date is a workday in Israel
 */
export const isWorkday = (date: Date): boolean => {
  return !isWeekend(date);
};

/**
 * Add working days to a date (skipping weekends)
 */
export const addWorkdays = (date: Date, days: number): Date => {
  const result = new Date(date);
  let remainingDays = days;
  
  while (remainingDays > 0) {
    result.setDate(result.getDate() + 1);
    if (isWorkday(result)) {
      remainingDays--;
    }
  }
  
  return result;
};

/**
 * Format a date according to Israeli locale
 */
export const formatDateForIsrael = (date: Date, format: 'short' | 'medium' | 'long' = 'medium'): string => {
  const options: Intl.DateTimeFormatOptions = { 
    timeZone: 'Asia/Jerusalem' 
  };
  
  if (format === 'short') {
    options.day = 'numeric';
    options.month = 'numeric';
    options.year = 'numeric';
  } else if (format === 'medium') {
    options.day = 'numeric';
    options.month = 'long';
    options.year = 'numeric';
  } else {
    options.day = 'numeric';
    options.month = 'long';
    options.year = 'numeric';
    options.weekday = 'long';
  }
  
  return new Intl.DateTimeFormat('he-IL', options).format(date);
}; 