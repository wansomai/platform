import { PracticeArea } from '@/types/associates';

/**
 * Registry of every tool an associate can be given.
 * Key = the exact tool name used in geminiTools.ts / functionExecutor.ts.
 * Value = human-readable label shown in the creation UI.
 */
export const ASSOCIATE_AVAILABLE_TOOLS: Record<string, string> = {
  reviewDocument:             'Review Documents',
  searchProjectDocuments:     'Search Project Documents',
  generateDocumentInline:     'Draft Documents (inline)',
  editCanvasDocument:         'Edit Canvas Document',
  batchEditCanvasDocument:    'Batch Edit Canvas Document',
  draftNewDocument:           'Draft New Canvas Document',
  searchAfricanLegalSources:  'Search Legal Sources (African LII)',
};

/**
 * Default tool suggestions per practice area.
 * Computed instantly from this map — no Gemini call required.
 * Used both for UI pre-selection and for populating premade associate defaults.
 */
export const DEFAULT_TOOLS_BY_PRACTICE_AREA: Partial<Record<PracticeArea, string[]>> = {
  [PracticeArea.CONTRACTS_COMMERCIAL]: [
    'reviewDocument',
    'searchProjectDocuments',
    'generateDocumentInline',
    'editCanvasDocument',
    'batchEditCanvasDocument',
    'searchAfricanLegalSources',
  ],
  [PracticeArea.MERGERS_AND_ACQUISITIONS]: [
    'reviewDocument',
    'searchProjectDocuments',
    'generateDocumentInline',
    'editCanvasDocument',
    'batchEditCanvasDocument',
  ],
  [PracticeArea.CORPORATE_GOVERNANCE]: [
    'reviewDocument',
    'searchProjectDocuments',
    'generateDocumentInline',
    'editCanvasDocument',
  ],
  [PracticeArea.LITIGATION_DISPUTE_RESOLUTION]: [
    'searchProjectDocuments',
    'reviewDocument',
    'generateDocumentInline',
    'searchAfricanLegalSources',
  ],
  [PracticeArea.COMPLIANCE_REGULATORY]: [
    'reviewDocument',
    'searchProjectDocuments',
    'generateDocumentInline',
    'searchAfricanLegalSources',
  ],
  [PracticeArea.PRIVACY_DATA_PROTECTION]: [
    'reviewDocument',
    'searchProjectDocuments',
    'generateDocumentInline',
    'searchAfricanLegalSources',
  ],
  [PracticeArea.EMPLOYMENT_LABOR]: [
    'reviewDocument',
    'searchProjectDocuments',
    'generateDocumentInline',
    'editCanvasDocument',
    'batchEditCanvasDocument',
  ],
  [PracticeArea.INTELLECTUAL_PROPERTY]: [
    'reviewDocument',
    'searchProjectDocuments',
    'generateDocumentInline',
    'searchAfricanLegalSources',
  ],
  [PracticeArea.TECHNOLOGY_LICENSING]: [
    'reviewDocument',
    'searchProjectDocuments',
    'generateDocumentInline',
    'editCanvasDocument',
    'searchAfricanLegalSources',
  ],
  [PracticeArea.REAL_ESTATE]: [
    'reviewDocument',
    'searchProjectDocuments',
    'generateDocumentInline',
    'editCanvasDocument',
    'batchEditCanvasDocument',
  ],
  [PracticeArea.BANKING_FINANCE]: [
    'reviewDocument',
    'searchProjectDocuments',
    'generateDocumentInline',
    'searchAfricanLegalSources',
  ],
  [PracticeArea.TAX_LAW]: [
    'searchProjectDocuments',
    'reviewDocument',
    'generateDocumentInline',
    'searchAfricanLegalSources',
  ],
  [PracticeArea.SECURITIES]: [
    'reviewDocument',
    'searchProjectDocuments',
    'generateDocumentInline',
    'searchAfricanLegalSources',
  ],
  [PracticeArea.ANTITRUST_COMPETITION]: [
    'searchProjectDocuments',
    'reviewDocument',
    'searchAfricanLegalSources',
  ],
  [PracticeArea.BANKRUPTCY_RESTRUCTURING]: [
    'reviewDocument',
    'searchProjectDocuments',
    'generateDocumentInline',
    'searchAfricanLegalSources',
  ],
  [PracticeArea.ENVIRONMENTAL_LAW]: [
    'searchProjectDocuments',
    'reviewDocument',
    'searchAfricanLegalSources',
  ],
  [PracticeArea.HEALTHCARE_LIFE_SCIENCES]: [
    'searchProjectDocuments',
    'reviewDocument',
    'generateDocumentInline',
    'searchAfricanLegalSources',
  ],
  [PracticeArea.IMMIGRATION]: [
    'searchProjectDocuments',
    'reviewDocument',
    'generateDocumentInline',
  ],
  [PracticeArea.INTERNATIONAL_TRADE]: [
    'searchProjectDocuments',
    'reviewDocument',
    'searchAfricanLegalSources',
  ],
  [PracticeArea.GENERAL_PRACTICE]: [
    'reviewDocument',
    'searchProjectDocuments',
    'generateDocumentInline',
    'searchAfricanLegalSources',
  ],
};

/**
 * Derives the suggested tool set for a given array of practice areas.
 * Returns the union of all defaults for each area, deduplicated,
 * preserving the order of ASSOCIATE_AVAILABLE_TOOLS.
 */
export function getSuggestedTools(practiceAreas: PracticeArea[]): string[] {
  const union = new Set<string>();
  for (const area of practiceAreas) {
    const tools = DEFAULT_TOOLS_BY_PRACTICE_AREA[area] ?? [];
    for (const tool of tools) union.add(tool);
  }
  // Return in registry order so the UI renders consistently
  return Object.keys(ASSOCIATE_AVAILABLE_TOOLS).filter(t => union.has(t));
}
