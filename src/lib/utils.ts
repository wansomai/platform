import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export * from './utils/file';
export * from './utils/date';
export * from './utils/text';
export * from './utils/api';

// Legacy aliases for backward compatibility
export { formatFileSize as formatBytes } from './utils/file';
export { formatRelativeTime as formatDate } from './utils/date';