
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
  
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
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