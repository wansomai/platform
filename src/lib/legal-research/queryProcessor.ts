// src/lib/legal-research/queryProcessor.ts

import { getJurisdictionById, JURISDICTIONS } from '../jurisdictions';
import { Jurisdiction } from '../../types/projects';

export interface LegalQueryContext {
  jurisdiction?: string;
  practiceArea?: string;
  queryType: 'case-law' | 'statute' | 'regulation' | 'general';
  originalQuery: string;
  enhancedQuery: string;
  suggestedTerms: string[];
}

// Legal terminology dictionary for query enhancement
export const LEGAL_TERMS = {
  // Contract-related terms
  contract: ['agreement', 'covenant', 'terms', 'conditions', 'breach', 'performance'],
  liability: ['responsibility', 'damages', 'negligence', 'tort', 'duty of care'],
  employment: ['wrongful termination', 'discrimination', 'workplace', 'labor law'],
  corporate: ['corporation', 'LLC', 'partnership', 'governance', 'securities'],
  property: ['real estate', 'landlord', 'tenant', 'lease', 'title', 'zoning'],
  criminal: ['prosecution', 'defense', 'plea', 'sentencing', 'evidence'],
  family: ['divorce', 'custody', 'alimony', 'prenup', 'adoption'],
  intellectual: ['patent', 'trademark', 'copyright', 'trade secret', 'infringement'],

  // Legal concepts
  precedent: ['stare decisis', 'binding authority', 'persuasive authority'],
  jurisdiction: ['venue', 'subject matter jurisdiction', 'personal jurisdiction'],
  procedure: ['civil procedure', 'rules of evidence', 'discovery', 'motion'],

  // Case-related terms
  case: ['opinion', 'decision', 'judgment', 'ruling', 'holding'],
  court: ['supreme court', 'appellate court', 'trial court', 'federal court'],

  // Statutory terms
  statute: ['code', 'act', 'law', 'regulation', 'ordinance', 'rule']
};

// Practice area detection patterns
export const PRACTICE_AREAS = {
  'corporate': ['corporation', 'business', 'company', 'LLC', 'partnership', 'merger', 'acquisition'],
  'contract': ['contract', 'agreement', 'breach', 'terms', 'conditions', 'covenant'],
  'tort': ['negligence', 'liability', 'damages', 'injury', 'malpractice', 'tort'],
  'employment': ['employment', 'workplace', 'discrimination', 'termination', 'labor'],
  'criminal': ['criminal', 'prosecution', 'defense', 'plea', 'sentence', 'crime'],
  'family': ['divorce', 'custody', 'marriage', 'family', 'adoption', 'alimony'],
  'property': ['property', 'real estate', 'lease', 'landlord', 'tenant', 'zoning'],
  'intellectual': ['patent', 'trademark', 'copyright', 'IP', 'intellectual property'],
  'constitutional': ['constitutional', 'rights', 'amendment', 'due process', 'equal protection']
};

// Legal document type patterns
export const DOCUMENT_TYPES = {
  'case-law': ['case', 'opinion', 'decision', 'judgment', 'ruling', 'v.', 'vs.'],
  'statute': ['statute', 'code', 'act', 'law', 'USC', 'CFR'],
  'regulation': ['regulation', 'rule', 'CFR', 'administrative', 'agency'],
  'secondary': ['law review', 'article', 'commentary', 'treatise', 'encyclopedia']
};

/**
 * Detect the practice area from query text
 */
function detectPracticeArea(query: string): string | undefined {
  const lowerQuery = query.toLowerCase();

  for (const [area, keywords] of Object.entries(PRACTICE_AREAS)) {
    if (keywords.some(keyword => lowerQuery.includes(keyword))) {
      return area;
    }
  }

  return undefined;
}

/**
 * Detect the legal document type being searched for
 */
function detectQueryType(query: string): LegalQueryContext['queryType'] {
  const lowerQuery = query.toLowerCase();

  for (const [type, keywords] of Object.entries(DOCUMENT_TYPES)) {
    if (keywords.some(keyword => lowerQuery.includes(keyword))) {
      return type as LegalQueryContext['queryType'];
    }
  }

  return 'general';
}

/**
 * Extract jurisdiction context from query or user context
 */
function detectJurisdiction(query: string, userContext?: any): string | undefined {
  const lowerQuery = query.toLowerCase();

  // Check for explicit jurisdiction mentions
  for (const jurisdiction of JURISDICTIONS) {
    const searchTerms = [
      jurisdiction.name.toLowerCase(),
      jurisdiction.country.toLowerCase(),
      jurisdiction.state?.toLowerCase()
    ].filter((term): term is string => typeof term === 'string');

    if (searchTerms.some(term => lowerQuery.includes(term))) {
      return jurisdiction.id;
    }
  }

  // Fall back to user's default jurisdiction if available
  return userContext?.jurisdiction;
}

/**
 * Generate legal-specific search terms based on the query
 */
function generateSuggestedTerms(query: string, practiceArea?: string, queryType?: string): string[] {
  const suggestions: string[] = [];
  const lowerQuery = query.toLowerCase();

  // Add practice area specific terms
  if (practiceArea && practiceArea in PRACTICE_AREAS) {
    suggestions.push(...PRACTICE_AREAS[practiceArea as keyof typeof PRACTICE_AREAS].slice(0, 3));
  }

  // Add query type specific terms
  if (queryType && queryType in LEGAL_TERMS) {
    suggestions.push(...LEGAL_TERMS[queryType as keyof typeof LEGAL_TERMS].slice(0, 2));
  }

  // Add general legal terms if query contains common legal concepts
  Object.entries(LEGAL_TERMS).forEach(([concept, terms]) => {
    if (lowerQuery.includes(concept)) {
      suggestions.push(...terms.slice(0, 2));
    }
  });

  // Remove duplicates and limit results
  return Array.from(new Set(suggestions)).slice(0, 5);
}

/**
 * Enhance a search query with legal-specific terms and context
 */
export function enhanceSearchQuery(query: string, context?: {
  jurisdiction?: string;
  practiceArea?: string;
  includeSecondary?: boolean;
}): string {
  const practiceArea = context?.practiceArea || detectPracticeArea(query);
  const queryType = detectQueryType(query);
  const jurisdiction = context?.jurisdiction || detectJurisdiction(query);

  let enhancedQuery = query;

  // Add jurisdiction context
  if (jurisdiction) {
    const jurisdictionData = getJurisdictionById(jurisdiction);
    if (jurisdictionData) {
      enhancedQuery += ` site:${getJurisdictionDomains(jurisdictionData).join(' OR site:')}`;
    }
  }

  // Add legal-specific search operators
  switch (queryType) {
    case 'case-law':
      enhancedQuery += ' ("case law" OR "court decision" OR "opinion" OR "judgment")';
      break;
    case 'statute':
      enhancedQuery += ' ("statute" OR "code" OR "act" OR "law")';
      break;
    case 'regulation':
      enhancedQuery += ' ("regulation" OR "rule" OR "administrative" OR "CFR")';
      break;
  }

  // Add practice area context
  if (practiceArea && practiceArea in PRACTICE_AREAS) {
    const areaTerms = PRACTICE_AREAS[practiceArea as keyof typeof PRACTICE_AREAS].slice(0, 2);
    enhancedQuery += ` (${areaTerms.join(' OR ')})`;
  }

  return enhancedQuery;
}

/**
 * Get relevant domains for a jurisdiction
 */
function getJurisdictionDomains(jurisdiction: any): string[] {
  const domains: string[] = [];

  console.log('Getting jurisdiction domains for:', jurisdiction);

  // Add government domains based on jurisdiction
  if (jurisdiction.country === 'United States') {
    domains.push('gov', 'uscourts.gov', 'supremecourt.gov');
    if (jurisdiction.state) {
      // Add state-specific domains (simplified)
      domains.push(`${jurisdiction.state.toLowerCase().replace(' ', '')}.gov`);
    }
  } else if (jurisdiction.country === 'United Kingdom') {
    domains.push('gov.uk', 'judiciary.uk');
  } else if (jurisdiction.country === 'Canada') {
    domains.push('gc.ca', 'courts.ca');
  } else if (jurisdiction.country === 'Kenya') {
    domains.push('kenyalaw.org', 'judiciary.go.ke', 'parliament.go.ke');
  } else if (jurisdiction.country === 'Nigeria') {
    domains.push('lawpavilionplus.com', 'nigerialii.org', 'lawnigeria.com');
  } else if (jurisdiction.country === 'South Africa') {
    domains.push('justice.gov.za', 'saflii.org');
  } else if (jurisdiction.country === 'Australia') {
    domains.push('gov.au', 'hcourt.gov.au', 'fedcourt.gov.au');
  } else {
    // For other jurisdictions, use country code and generic legal domains
    const countryCode = jurisdiction.id;
    if (countryCode && countryCode.length === 2) {
      domains.push(`${countryCode}`, `gov.${countryCode}`);
    }
  }

  // Add academic and legal research domains for all jurisdictions
  domains.push('edu', 'org');

  console.log('Generated domains for', jurisdiction.country, ':', domains);

  return domains;
}

/**
 * Process a legal query and return enhanced context
 */
export function processLegalQuery(
  originalQuery: string,
  userContext?: {
    jurisdiction?: string;
    practiceArea?: string;
    includeSecondary?: boolean;
  }
): LegalQueryContext {
  const practiceArea = userContext?.practiceArea || detectPracticeArea(originalQuery);
  const queryType = detectQueryType(originalQuery);
  const jurisdiction = userContext?.jurisdiction || detectJurisdiction(originalQuery, userContext);

  const enhancedQuery = enhanceSearchQuery(originalQuery, {
    jurisdiction,
    practiceArea,
    includeSecondary: userContext?.includeSecondary
  });

  const suggestedTerms = generateSuggestedTerms(originalQuery, practiceArea, queryType);

  return {
    jurisdiction,
    practiceArea,
    queryType,
    originalQuery,
    enhancedQuery,
    suggestedTerms
  };
}

/**
 * Generate follow-up research suggestions based on query results
 */
export function generateFollowUpQueries(context: LegalQueryContext): string[] {
  const suggestions: string[] = [];
  const { practiceArea, queryType, originalQuery } = context;

  // Add related legal concept searches
  if (practiceArea) {
    suggestions.push(`${practiceArea} law overview`);
    suggestions.push(`recent ${practiceArea} cases`);
  }

  // Add procedural suggestions
  if (queryType === 'case-law') {
    suggestions.push(`${originalQuery} precedent`);
    suggestions.push(`${originalQuery} statutory basis`);
  } else if (queryType === 'statute') {
    suggestions.push(`${originalQuery} case interpretation`);
    suggestions.push(`${originalQuery} recent amendments`);
  }

  return suggestions.slice(0, 3);
}