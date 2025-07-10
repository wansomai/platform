// lib/utils/date.ts - Centralized date utility functions
import { formatDistanceToNow, format, parseISO, isValid, differenceInDays, startOfDay, endOfDay } from 'date-fns';

/**
 * Format date to relative time (e.g., "2 hours ago")
 * Handles various input formats safely
 */
export function formatRelativeTime(date: string | Date | number): string {
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      dateObj = parseISO(date);
    } else if (typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }
    
    if (!isValid(dateObj)) {
      return 'Invalid date';
    }
    
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    console.warn('Error formatting relative time:', error);
    return 'Unknown time';
  }
}

/**
 * Format date to standard format (e.g., "Jan 15, 2024")
 */
export function formatStandardDate(date: string | Date | number): string {
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      dateObj = parseISO(date);
    } else if (typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }
    
    if (!isValid(dateObj)) {
      return 'Invalid date';
    }
    
    return format(dateObj, 'MMM d, yyyy');
  } catch (error) {
    console.warn('Error formatting standard date:', error);
    return 'Unknown date';
  }
}

/**
 * Format date with time (e.g., "Jan 15, 2024 at 2:30 PM")
 */
export function formatDateTime(date: string | Date | number): string {
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      dateObj = parseISO(date);
    } else if (typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }
    
    if (!isValid(dateObj)) {
      return 'Invalid date';
    }
    
    return format(dateObj, 'MMM d, yyyy \'at\' h:mm a');
  } catch (error) {
    console.warn('Error formatting date time:', error);
    return 'Unknown date';
  }
}

/**
 * Format date for forms/inputs (YYYY-MM-DD)
 */
export function formatInputDate(date: string | Date | number): string {
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      dateObj = parseISO(date);
    } else if (typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }
    
    if (!isValid(dateObj)) {
      return '';
    }
    
    return format(dateObj, 'yyyy-MM-dd');
  } catch (error) {
    console.warn('Error formatting input date:', error);
    return '';
  }
}

/**
 * Format time only (e.g., "2:30 PM")
 */
export function formatTime(date: string | Date | number): string {
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      dateObj = parseISO(date);
    } else if (typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }
    
    if (!isValid(dateObj)) {
      return 'Invalid time';
    }
    
    return format(dateObj, 'h:mm a');
  } catch (error) {
    console.warn('Error formatting time:', error);
    return 'Unknown time';
  }
}

/**
 * Get smart date format - relative for recent, absolute for older
 */
export function formatSmartDate(date: string | Date | number): string {
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      dateObj = parseISO(date);
    } else if (typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }
    
    if (!isValid(dateObj)) {
      return 'Invalid date';
    }
    
    const daysDiff = differenceInDays(new Date(), dateObj);
    
    // Use relative time for recent dates (within 7 days)
    if (daysDiff <= 7) {
      return formatRelativeTime(dateObj);
    }
    
    // Use absolute date for older dates
    return formatStandardDate(dateObj);
  } catch (error) {
    console.warn('Error formatting smart date:', error);
    return 'Unknown date';
  }
}

/**
 * Check if date is today
 */
export function isToday(date: string | Date | number): boolean {
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      dateObj = parseISO(date);
    } else if (typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }
    
    if (!isValid(dateObj)) {
      return false;
    }
    
    const today = new Date();
    return (
      startOfDay(dateObj).getTime() === startOfDay(today).getTime()
    );
  } catch (error) {
    return false;
  }
}

/**
 * Check if date is within the last N days
 */
export function isWithinDays(date: string | Date | number, days: number): boolean {
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      dateObj = parseISO(date);
    } else if (typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }
    
    if (!isValid(dateObj)) {
      return false;
    }
    
    const daysDiff = differenceInDays(new Date(), dateObj);
    return daysDiff >= 0 && daysDiff <= days;
  } catch (error) {
    return false;
  }
}

/**
 * Format date range
 */
export function formatDateRange(startDate: string | Date | number, endDate: string | Date | number): string {
  try {
    const start = formatStandardDate(startDate);
    const end = formatStandardDate(endDate);
    
    if (start === 'Invalid date' || end === 'Invalid date') {
      return 'Invalid date range';
    }
    
    if (start === end) {
      return start;
    }
    
    return `${start} - ${end}`;
  } catch (error) {
    return 'Invalid date range';
  }
}

/**
 * Sort dates helper function
 */
export function sortByDate(
  items: any[], 
  dateKey: string, 
  order: 'asc' | 'desc' = 'desc'
): any[] {
  return [...items].sort((a, b) => {
    const dateA = new Date(a[dateKey]);
    const dateB = new Date(b[dateKey]);
    
    if (!isValid(dateA) || !isValid(dateB)) {
      return 0;
    }
    
    return order === 'desc' 
      ? dateB.getTime() - dateA.getTime()
      : dateA.getTime() - dateB.getTime();
  });
}

/**
 * Date validation
 */
export function isValidDate(date: any): boolean {
  try {
    if (!date) return false;
    
    let dateObj: Date;
    
    if (typeof date === 'string') {
      dateObj = parseISO(date);
    } else if (typeof date === 'number') {
      dateObj = new Date(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      return false;
    }
    
    return isValid(dateObj);
  } catch (error) {
    return false;
  }
}

/**
 * Common date format patterns
 */
export const DATE_FORMATS = {
  STANDARD: 'MMM d, yyyy',
  FULL: 'EEEE, MMMM d, yyyy',
  INPUT: 'yyyy-MM-dd',
  TIME: 'h:mm a',
  DATETIME: 'MMM d, yyyy \'at\' h:mm a',
  ISO: 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx',
  FILE_SAFE: 'yyyy-MM-dd_HH-mm-ss',
} as const;