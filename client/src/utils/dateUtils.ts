import { format, formatDistance, differenceInCalendarDays, isToday as dateFnsIsToday, isSameDay as dateFnsIsSameDay } from 'date-fns';
import { he } from 'date-fns/locale';
import i18next from 'i18next';

/**
 * Format a date according to the provided format string or the default format
 * using the current locale
 * @param date The date to format
 * @param formatStr Optional format string
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string, formatStr: string = 'PPP'): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const locale = i18next.language === 'he' ? he : undefined;
  
  return format(dateObj, formatStr, { locale });
};

/**
 * Format a date in Hebrew, including Hebrew month names and day of week
 * @param date The date to format
 * @returns A string with the Hebrew formatted date
 */
export const formatHebrewDate = (date: Date | string): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Hebrew day names (starting from Sunday = 0)
  const hebrewDays = [
    'ראשון',
    'שני',
    'שלישי',
    'רביעי',
    'חמישי',
    'שישי',
    'שבת'
  ];
  
  // Hebrew month names
  const hebrewMonths = [
    'ינואר',
    'פברואר',
    'מרץ',
    'אפריל',
    'מאי',
    'יוני',
    'יולי',
    'אוגוסט',
    'ספטמבר',
    'אוקטובר',
    'נובמבר',
    'דצמבר'
  ];
  
  const day = dateObj.getDate();
  const month = dateObj.getMonth();
  const year = dateObj.getFullYear();
  const dayOfWeek = dateObj.getDay();
  
  return `${day} ${hebrewMonths[month]} ${year}, יום ${hebrewDays[dayOfWeek]}`;
};

/**
 * Format a date as today, tomorrow, yesterday, or a formatted date
 * @param date The date to format
 * @returns A string with the relative date
 */
export const formatRelativeDate = (date: Date | string): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  const diffDays = differenceInCalendarDays(dateObj, today);
  
  const t = i18next.t;
  
  if (diffDays === 0) {
    return t('date.today');
  } else if (diffDays === 1) {
    return t('date.tomorrow');
  } else if (diffDays === -1) {
    return t('date.yesterday');
  } else if (diffDays > 0 && diffDays < 7) {
    return formatDistance(dateObj, today, { addSuffix: true, locale: i18next.language === 'he' ? he : undefined });
  } else {
    return formatDate(dateObj, 'PP');
  }
};

/**
 * Check if a date is today
 * @param date The date to check
 * @returns Boolean indicating if the date is today
 */
export const isToday = (date: Date | string): boolean => {
  if (!date) return false;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateFnsIsToday(dateObj);
};

/**
 * Check if two dates are the same day
 * @param date1 First date
 * @param date2 Second date 
 * @returns Boolean indicating if the dates are the same day
 */
export const isSameDay = (date1: Date | string, date2: Date | string): boolean => {
  if (!date1 || !date2) return false;
  
  const dateObj1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const dateObj2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  return dateFnsIsSameDay(dateObj1, dateObj2);
};

/**
 * Format a date in Israeli format (dd/MM/yyyy)
 * @param date The date to format
 * @returns A string with the date in Israeli format
 */
export const formatIsraeliDate = (date: Date | string): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd/MM/yyyy');
};

/**
 * Get Jewish holiday for a specific date, if any
 * This is a placeholder function that would use a Hebrew calendar library
 * @param date The date to check
 * @returns The name of the holiday or undefined
 */
export const getJewishHoliday = (date: Date | string): string | undefined => {
  // This would use a Hebrew calendar library like hebcal
  // For now, return undefined as a placeholder
  return undefined;
};

/**
 * Check if a date is a weekend day (Friday or Saturday in Israel)
 * @param date The date to check
 * @returns Boolean indicating if the date is a weekend
 */
export const isWeekend = (date: Date | string): boolean => {
  if (!date) return false;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const day = dateObj.getDay();
  
  // In Israel, weekend is Friday (5) and Saturday (6)
  return day === 5 || day === 6;
};

/**
 * Format time in 24-hour format
 * @param date The date to format
 * @returns A string with the time in 24-hour format
 */
export const formatTime24Hour = (date: Date | string): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'HH:mm');
}; 