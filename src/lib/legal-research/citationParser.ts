// src/lib/legal-research/citationParser.ts

export interface LegalCitation {
  type: 'case' | 'statute' | 'regulation' | 'law-review' | 'unknown';
  fullCitation: string;
  caseName?: string;
  court?: string;
  year?: number;
  volume?: string;
  reporter?: string;
  page?: string;
  title?: string;
  author?: string;
  journal?: string;
  section?: string;
  confidence: 'high' | 'medium' | 'low';
  jurisdiction?: string;
}

// Common legal citation patterns
export const CITATION_PATTERNS = {
  // Case citations (e.g., "Brown v. Board, 347 U.S. 483 (1954)")
  case: [
    /([A-Z][a-zA-Z\s&.,']+)\s+v\.?\s+([A-Z][a-zA-Z\s&.,']+),?\s+(\d+)\s+([A-Z][a-z.]*\s*\d*[da]*)\s+(\d+)\s*\((\d{4})\)/gi,
    /([A-Z][a-zA-Z\s&.,']+)\s+v\.?\s+([A-Z][a-zA-Z\s&.,']+),?\s+(\d+)\s+([A-Z][a-z.]*)\s+(\d+)/gi,
    /([A-Z][a-zA-Z\s&.,']+)\s+v\.?\s+([A-Z][a-zA-Z\s&.,']+)\s*,?\s*(\d{4})/gi
  ],

  // Statute citations (e.g., "42 U.S.C. § 1983", "Cal. Civ. Code § 1542")
  statute: [
    /(\d+)\s+([A-Z][a-z.]*\s*[A-Z][a-z.]*)\s*§\s*(\d+[\w.-]*)/gi,
    /([A-Z][a-z.]+)\s+([A-Z][a-z.]+)\s+([A-Z][a-z.]+)\s*§\s*(\d+[\w.-]*)/gi,
    /Title\s+(\d+),?\s*([A-Z][a-z.]*\s*[A-Z][a-z.]*)\s*§\s*(\d+[\w.-]*)/gi
  ],

  // Regulation citations (e.g., "17 C.F.R. § 240.10b-5")
  regulation: [
    /(\d+)\s+C\.F\.R\.\s*§\s*(\d+[\w.-]*)/gi,
    /(\d+)\s+Fed\.\s*Reg\.\s*(\d+)/gi
  ],

  // Law review citations
  lawReview: [
    /([A-Z][a-zA-Z\s,.']+),\s*(\d+)\s+([A-Z][a-zA-Z\s.&]+)\s+([A-Z][a-z.]*)\s+(\d+)\s*\((\d{4})\)/gi,
    /([A-Z][a-zA-Z\s,.']+),\s*([A-Z][a-zA-Z\s.&]+),\s*(\d+)\s+([A-Z][a-z.]*)\s+(\d+)/gi
  ],

  // Constitutional citations
  constitutional: [
    /U\.S\.\s*Const\.\s*([a-zA-Z]+\.?\s*[IVX]*),?\s*§\s*(\d+)/gi,
    /([A-Z][a-z.]+)\s*Const\.\s*([a-zA-Z]+\.?\s*[IVX]*),?\s*§\s*(\d+)/gi
  ]
};

// Reporter abbreviations and their full names
export const REPORTER_ABBREVIATIONS = {
  'U.S.': 'United States Reports',
  'S. Ct.': 'Supreme Court Reporter',
  'L. Ed.': 'Lawyers\' Edition',
  'F.3d': 'Federal Reporter, Third Series',
  'F.2d': 'Federal Reporter, Second Series',
  'F. Supp.': 'Federal Supplement',
  'F. Supp. 2d': 'Federal Supplement, Second Series',
  'F. Supp. 3d': 'Federal Supplement, Third Series',
  'Cal. Rptr.': 'California Reporter',
  'P.3d': 'Pacific Reporter, Third Series',
  'N.E.3d': 'North Eastern Reporter, Third Series',
  'S.E.2d': 'South Eastern Reporter, Second Series',
  'So. 3d': 'Southern Reporter, Third Series',
  'A.3d': 'Atlantic Reporter, Third Series'
};

// Court abbreviations
export const COURT_ABBREVIATIONS = {
  'S.D.N.Y.': 'Southern District of New York',
  'E.D.N.Y.': 'Eastern District of New York',
  'N.D. Cal.': 'Northern District of California',
  'C.D. Cal.': 'Central District of California',
  '9th Cir.': 'Ninth Circuit Court of Appeals',
  '2d Cir.': 'Second Circuit Court of Appeals',
  'D.D.C.': 'District of Columbia District Court',
  'Fed. Cir.': 'Federal Circuit Court of Appeals'
};

/**
 * Extract case name from citation text
 */
function extractCaseName(match: RegExpMatchArray): string {
  if (match[1] && match[2]) {
    return `${match[1].trim()} v. ${match[2].trim()}`;
  }
  return match[0];
}

/**
 * Determine jurisdiction from reporter or court information
 */
function determineJurisdiction(reporter: string, court?: string): string | undefined {
  const reporterLower = reporter.toLowerCase();

  if (reporterLower.includes('u.s') || reporterLower.includes('s. ct')) {
    return 'us-federal';
  }

  if (reporterLower.includes('cal') || court?.toLowerCase().includes('cal')) {
    return 'us-ca';
  }

  if (reporterLower.includes('n.y') || court?.toLowerCase().includes('n.y')) {
    return 'us-ny';
  }

  return undefined;
}

/**
 * Calculate confidence score based on citation completeness
 */
function calculateConfidence(citation: LegalCitation): LegalCitation['confidence'] {
  let score = 0;

  // Complete citations get higher scores
  if (citation.caseName) score += 2;
  if (citation.year) score += 2;
  if (citation.volume && citation.reporter && citation.page) score += 3;
  if (citation.court) score += 1;

  if (score >= 6) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}

/**
 * Parse case citations from text
 */
function parseCaseCitations(text: string): LegalCitation[] {
  const citations: LegalCitation[] = [];

  CITATION_PATTERNS.case.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const citation: LegalCitation = {
        type: 'case',
        fullCitation: match[0],
        caseName: extractCaseName(match),
        volume: match[3],
        reporter: match[4],
        page: match[5],
        year: match[6] ? parseInt(match[6]) : undefined,
        confidence: 'medium',
        jurisdiction: match[4] ? determineJurisdiction(match[4]) : undefined
      };

      citation.confidence = calculateConfidence(citation);
      citations.push(citation);
    }
  });

  return citations;
}

/**
 * Parse statute citations from text
 */
function parseStatuteCitations(text: string): LegalCitation[] {
  const citations: LegalCitation[] = [];

  CITATION_PATTERNS.statute.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const citation: LegalCitation = {
        type: 'statute',
        fullCitation: match[0],
        title: match[2],
        section: match[3],
        confidence: 'medium'
      };

      if (match[0].includes('U.S.C')) {
        citation.jurisdiction = 'us-federal';
      } else if (match[0].toLowerCase().includes('cal')) {
        citation.jurisdiction = 'us-ca';
      }

      citation.confidence = calculateConfidence(citation);
      citations.push(citation);
    }
  });

  return citations;
}

/**
 * Parse regulation citations from text
 */
function parseRegulationCitations(text: string): LegalCitation[] {
  const citations: LegalCitation[] = [];

  CITATION_PATTERNS.regulation.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const citation: LegalCitation = {
        type: 'regulation',
        fullCitation: match[0],
        title: match[1],
        section: match[2],
        jurisdiction: 'us-federal',
        confidence: 'medium'
      };

      citation.confidence = calculateConfidence(citation);
      citations.push(citation);
    }
  });

  return citations;
}

/**
 * Parse law review citations from text
 */
function parseLawReviewCitations(text: string): LegalCitation[] {
  const citations: LegalCitation[] = [];

  CITATION_PATTERNS.lawReview.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const citation: LegalCitation = {
        type: 'law-review',
        fullCitation: match[0],
        author: match[1],
        volume: match[2] || match[3],
        journal: match[3] || match[2],
        page: match[4] || match[5],
        year: match[6] ? parseInt(match[6]) : undefined,
        confidence: 'medium'
      };

      citation.confidence = calculateConfidence(citation);
      citations.push(citation);
    }
  });

  return citations;
}

/**
 * Main function to extract all legal citations from text
 */
export function extractCitations(text: string): LegalCitation[] {
  const allCitations: LegalCitation[] = [];

  // Extract different types of citations
  allCitations.push(...parseCaseCitations(text));
  allCitations.push(...parseStatuteCitations(text));
  allCitations.push(...parseRegulationCitations(text));
  allCitations.push(...parseLawReviewCitations(text));

  // Remove duplicates based on full citation text
  const uniqueCitations = allCitations.filter((citation, index, self) =>
    index === self.findIndex(c => c.fullCitation === citation.fullCitation)
  );

  // Sort by confidence and type priority
  return uniqueCitations.sort((a, b) => {
    const confidenceOrder: Record<string, number> = { 'high': 3, 'medium': 2, 'low': 1 };
    const typeOrder: Record<string, number> = { 'case': 4, 'statute': 3, 'regulation': 2, 'law-review': 1, 'unknown': 0 };

    const confidenceDiff = confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
    if (confidenceDiff !== 0) return confidenceDiff;

    return typeOrder[b.type] - typeOrder[a.type];
  });
}

/**
 * Generate related search queries based on citations found
 */
export function generateCitationQueries(citations: LegalCitation[]): string[] {
  const queries: string[] = [];

  citations.slice(0, 3).forEach(citation => {
    switch (citation.type) {
      case 'case':
        if (citation.caseName) {
          queries.push(`${citation.caseName} subsequent history`);
          queries.push(`cases citing ${citation.caseName}`);
        }
        break;
      case 'statute':
        if (citation.title && citation.section) {
          queries.push(`${citation.title} § ${citation.section} interpretation`);
          queries.push(`cases interpreting ${citation.title} § ${citation.section}`);
        }
        break;
      case 'regulation':
        if (citation.section) {
          queries.push(`${citation.section} CFR compliance`);
        }
        break;
    }
  });

  return queries.filter(Boolean).slice(0, 5);
}

/**
 * Format citations for display
 */
export function formatCitationsDisplay(citations: LegalCitation[]): string {
  if (citations.length === 0) {
    return "No legal citations found in the search results.";
  }

  let output = `📚 LEGAL CITATIONS FOUND (${citations.length}):\n\n`;

  citations.forEach((citation, index) => {
    const typeEmoji = citation.type === 'case' ? '⚖️' :
                     citation.type === 'statute' ? '📜' :
                     citation.type === 'regulation' ? '📋' : '📖';

    output += `${index + 1}. ${typeEmoji} ${citation.fullCitation}\n`;
    output += `   Type: ${citation.type.toUpperCase()}`;

    if (citation.jurisdiction) {
      output += ` | Jurisdiction: ${citation.jurisdiction}`;
    }

    output += ` | Confidence: ${citation.confidence.toUpperCase()}\n`;

    if (citation.caseName && citation.year) {
      output += `   Case: ${citation.caseName} (${citation.year})\n`;
    } else if (citation.title && citation.section) {
      output += `   Reference: ${citation.title} § ${citation.section}\n`;
    }

    output += '\n';
  });

  return output;
}

/**
 * Validate citation format
 */
export function validateCitation(citation: string): {
  isValid: boolean;
  type: LegalCitation['type'] | null;
  errors: string[];
} {
  const errors: string[] = [];
  let type: LegalCitation['type'] | null = null;
  let isValid = false;

  // Test against each citation pattern
  if (CITATION_PATTERNS.case.some(pattern => pattern.test(citation))) {
    type = 'case';
    isValid = true;
  } else if (CITATION_PATTERNS.statute.some(pattern => pattern.test(citation))) {
    type = 'statute';
    isValid = true;
  } else if (CITATION_PATTERNS.regulation.some(pattern => pattern.test(citation))) {
    type = 'regulation';
    isValid = true;
  } else if (CITATION_PATTERNS.lawReview.some(pattern => pattern.test(citation))) {
    type = 'law-review';
    isValid = true;
  }

  if (!isValid) {
    errors.push("Citation does not match standard legal citation formats");
  }

  return { isValid, type, errors };
}