// src/lib/legal-research/index.ts

import { useLegalResearchStore } from '../../store/legal-research.store';
import { extractCitations, generateCitationQueries, validateCitation } from './citationParser';
import { getLegalSearchSuggestions, isLegalSearchConfigured, LegalSearchOptions, performLegalWebSearch } from './enhancedWebSearch';
import { enhanceSearchQuery, generateFollowUpQueries, processLegalQuery } from './queryProcessor';
import { filterLegalResults } from './sourceFilter';

// Export all legal research functionality from a single entry point

// Query processing
export {
  processLegalQuery,
  enhanceSearchQuery,
  generateFollowUpQueries,
  type LegalQueryContext,
  LEGAL_TERMS,
  PRACTICE_AREAS,
  DOCUMENT_TYPES
} from './queryProcessor';

// Source filtering and categorization
export {
  filterLegalResults,
  formatLegalResults,
  parseSearchResults,
  classifyDomain,
  getDomainSuggestions,
  type LegalSource,
  type FilteredSearchResults,
  LEGAL_DOMAINS,
  COURT_HIERARCHY
} from './sourceFilter';

// Citation recognition and parsing
export {
  extractCitations,
  generateCitationQueries,
  formatCitationsDisplay,
  validateCitation,
  type LegalCitation,
  CITATION_PATTERNS,
  REPORTER_ABBREVIATIONS,
  COURT_ABBREVIATIONS
} from './citationParser';

// Enhanced web search
export {
  performLegalWebSearch,
  isLegalSearchConfigured,
  getLegalSearchSuggestions,
  generateResearchQuestions,
  extractLegalConcepts,
  type LegalSearchOptions,
  type LegalSearchResult
} from './enhancedWebSearch';

// Research context and memory
export {
  useLegalResearchStore,
  type ResearchSession,
  type ResearchQuery
} from '../../store/legal-research.store';

// Utility functions for easy integration
export const LegalResearch = {
  // Main search function
  search: performLegalWebSearch,

  // Query enhancement
  enhanceQuery: enhanceSearchQuery,
  processQuery: processLegalQuery,

  // Result processing
  filterResults: filterLegalResults,
  extractCitations,

  // Suggestions and context
  generateFollowUp: generateFollowUpQueries,
  generateCitationQueries,
  getLegalSearchSuggestions,

  // Validation
  validateCitation,
  isConfigured: isLegalSearchConfigured
};

// Additional type exports are already included above

// Constants for external reference
export const SUPPORTED_JURISDICTIONS = [
  'us-federal', 'us-ca', 'us-ny', 'us-tx', 'us-fl',
  'uk-england-wales', 'uk-scotland', 'ca-federal',
  'au-federal', 'ke', 'ng', 'za'
];

export const SUPPORTED_PRACTICE_AREAS = [
  'corporate', 'contract', 'tort', 'employment',
  'criminal', 'family', 'property', 'intellectual',
  'constitutional'
];

// Quick setup helper
export function initializeLegalResearch(
  projectId: string,
  conversationId: string,
  defaultJurisdiction?: string
) {
  const researchStore = useLegalResearchStore.getState();

  // Start research session
  researchStore.startSession(projectId, conversationId);

  return {
    search: (query: string, options: LegalSearchOptions = {}) =>
      performLegalWebSearch(query, {
        jurisdiction: defaultJurisdiction,
        ...options
      }),

    endSession: () => researchStore.endSession(),

    getContext: () => researchStore.getContextualSuggestions(),

    getSummary: () => researchStore.getResearchSummary()
  };
}