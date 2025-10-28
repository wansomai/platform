
export const FILE_UPLOAD_CONFIG = {
  ALLOWED_TYPES: [
   'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/plain',
  'text/csv',
  'image/jpeg',
  'image/png'
  ],
  
  MAX_SIZE: 20 * 1024 * 1024, // 20MB
  CHUNK_SIZE: 1024, // For text chunking
} as const;

export const DOCUMENT_CATEGORIES = [
  { id: "all", label: "All Documents" },
  { id: "evidence", label: "Evidence" },
  { id: "pleadings", label: "Pleadings" },
  { id: "correspondence", label: "Correspondence" },
  { id: "contracts", label: "Contracts" },
  { id: "research", label: "Research" },
] as const;

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/plain',
  'text/csv',
  'image/jpeg',
  'image/png'
];

export const API_CONSTANTS = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  CACHE_DURATION: 30000, // 30 seconds
  MAX_FILE_SIZE: 20 * 1024 * 1024, // 20MB
  
  STATUS_CODES: {
    SUCCESS: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_ERROR: 500,
  },
  
  ERROR_CODES: {
    AUTH_REQUIRED: 'AUTH_REQUIRED',
    ACCESS_DENIED: 'ACCESS_DENIED',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
  },
} as const;