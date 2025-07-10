// lib/utils/text.ts 
import slugify from 'slugify';
/**
 * Truncate text to specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Truncate text at word boundaries
 */
export function truncateWords(text: string, maxWords: number, suffix: string = '...'): string {
  if (!text) return text;
  
  const words = text.split(' ');
  if (words.length <= maxWords) {
    return text;
  }
  
  return words.slice(0, maxWords).join(' ') + suffix;
}

/**
 * Capitalize first letter of string
 */
export function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Convert text to title case
 */
export function toTitleCase(text: string): string {
  if (!text) return text;
  
  return text.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

/**
 * Extract initials from name
 */
export function getInitials(name: string, maxInitials: number = 2): string {
  if (!name) return '';
  
  return name
    .split(' ')
    .filter(word => word.length > 0)
    .slice(0, maxInitials)
    .map(word => word.charAt(0).toUpperCase())
    .join('');
}

/**
 * Clean and normalize text for search
 */
export function normalizeForSearch(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ');   // Normalize whitespace
}

/**
 * Highlight search terms in text
 */
export function highlightSearchTerms(
  text: string, 
  searchTerm: string, 
  className: string = 'bg-yellow-200'
): string {
  if (!text || !searchTerm) return text;
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, `<mark class="${className}">$1</mark>`);
}

/**
 * Format text for display in lists
 */
export function formatListText(text: string, maxLength: number = 50): string {
  if (!text) return 'Untitled';
  
  // Clean up text
  const cleaned = text
    .trim()
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .replace(/\n/g, ' ');  // Replace newlines with spaces
  
  return truncateText(cleaned, maxLength);
}

/**
 * Convert text to kebab-case (URL-friendly)
 */
export function toKebabCase(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars except hyphens
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single
    .replace(/^-|-$/g, '');   // Remove leading/trailing hyphens
}

/**
 * Convert text to camelCase
 */
export function toCamelCase(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, '');
}

/**
 * Extract and format excerpts from text
 */
export function extractExcerpt(
  text: string, 
  searchTerm: string, 
  contextLength: number = 100
): string {
  if (!text || !searchTerm) return truncateText(text, contextLength);
  
  const index = text.toLowerCase().indexOf(searchTerm.toLowerCase());
  if (index === -1) return truncateText(text, contextLength);
  
  const start = Math.max(0, index - contextLength / 2);
  const end = Math.min(text.length, index + searchTerm.length + contextLength / 2);
  
  let excerpt = text.substring(start, end);
  
  if (start > 0) excerpt = '...' + excerpt;
  if (end < text.length) excerpt = excerpt + '...';
  
  return excerpt;
}

/**
 * Format file names for display
 */
export function formatFileName(fileName: string, maxLength: number = 30): string {
  if (!fileName) return 'Untitled';
  
  const extension = fileName.split('.').pop();
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
  
  if (fileName.length <= maxLength) return fileName;
  
  const availableLength = maxLength - (extension ? extension.length + 1 : 0) - 3; // 3 for '...'
  const truncatedName = nameWithoutExt.substring(0, availableLength);
  
  return extension ? `${truncatedName}...${extension}` : `${truncatedName}...`;
}

/**
 * Clean text content (remove HTML, extra whitespace, etc.)
 */
export function cleanTextContent(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/<[^>]*>/g, '')     // Remove HTML tags
    .replace(/&[^;]+;/g, ' ')    // Replace HTML entities
    .replace(/\s+/g, ' ')        // Normalize whitespace
    .trim();
}

/**
 * Format content for AI processing
 */
export function formatAIContent(content: string): string {
  if (!content) return '';
  
  // Remove "System:" prefix if it exists at the beginning
  let formattedContent = content.replace(/^System:\s*/i, '');
  
  // Ensure there's a language specified for code blocks
  formattedContent = formattedContent.replace(/```\s*\n/g, '```text\n');
  
  // Add proper spacing for readability
  formattedContent = formattedContent.replace(/\n{3,}/g, '\n\n');
  
  return formattedContent;
}

/**
 * Sanitize web search results
 */
export function sanitizeSearchResults(rawResults: string): string {
  try {
    // Basic sanitization to remove problematic characters and format nicely
    let cleanedResult = rawResults.replace(/\[\\\{/g, "");
    cleanedResult = cleanedResult.replace(/\\\}\]/g, "");
    cleanedResult = cleanedResult.replace(/\\"/g, '"');
    cleanedResult = cleanedResult.replace(/{[^}]*}/g, "");
    cleanedResult = cleanedResult.replace(/\\n/g, "\n");
    
    // Keep only essential information - truncate for speed
    return cleanedResult.substring(0, 1000);
  } catch (error) {
    return "Search results unavailable";
  }
}

/**
 * Generate readable ID from text
 */
export function generateId(text: string): string {
  return slugify(text) + '-' + Date.now().toString(36);
}

/**
 * Format search query for better matching
 */
export function formatSearchQuery(query: string): string {
  if (!query) return '';
  
  return query
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ');   // Normalize spaces
}

/**
 * Check if text contains search term
 */
export function containsSearchTerm(text: string, searchTerm: string): boolean {
  if (!text || !searchTerm) return false;
  
  return normalizeForSearch(text).includes(normalizeForSearch(searchTerm));
}

/**
 * Word count utility
 */
export function getWordCount(text: string): number {
  if (!text) return 0;
  
  return text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
    .length;
}

/**
 * Character count utility (excluding whitespace)
 */
export function getCharacterCount(text: string, includeSpaces: boolean = true): number {
  if (!text) return 0;
  
  return includeSpaces ? text.length : text.replace(/\s/g, '').length;
}

/**
 * Reading time estimation (words per minute)
 */
export function estimateReadingTime(text: string, wordsPerMinute: number = 200): number {
  const wordCount = getWordCount(text);
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Common text constants
 */
export const TEXT_CONSTANTS = {
  DEFAULT_TRUNCATE_LENGTH: 100,
  DEFAULT_WORDS_PER_MINUTE: 200,
  DEFAULT_EXCERPT_LENGTH: 150,
  MAX_SEARCH_RESULTS_LENGTH: 1000,
  MAX_FILENAME_DISPLAY_LENGTH: 30,
} as const;