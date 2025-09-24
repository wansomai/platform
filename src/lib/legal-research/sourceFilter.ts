// src/lib/legal-research/sourceFilter.ts

export interface LegalSource {
  title: string;
  url: string;
  snippet: string;
  domain: string;
  sourceType: 'primary' | 'secondary' | 'government' | 'academic' | 'commercial';
  authority: 'high' | 'medium' | 'low';
  jurisdiction?: string;
  datePublished?: string;
  courtLevel?: string;
}

export interface FilteredSearchResults {
  primarySources: LegalSource[];
  secondarySources: LegalSource[];
  governmentSources: LegalSource[];
  academicSources: LegalSource[];
  commercialSources: LegalSource[];
  totalResults: number;
  filteredOutCount: number;
}

// Trusted legal domains with their classification
export const LEGAL_DOMAINS = {
  // High Authority - Government/Court Sites
  high: {
    primary: [
      'supremecourt.gov',
      'uscourts.gov',
      'ca.gov',
      'courts.ca.gov',
      'nycourts.gov',
      'gov.uk',
      'judiciary.uk',
      'scc-csc.ca',
      'courts.ca',
      'hcourt.gov.au',
      'fedcourt.gov.au',
      'kenyalaw.org'
    ],
    government: [
      'justice.gov',
      'sec.gov',
      'irs.gov',
      'dol.gov',
      'ftc.gov',
      'fda.gov',
      'epa.gov',
      'treasury.gov',
      'congress.gov',
      'gpo.gov',
      'cftc.gov'
    ]
  },

  // Medium Authority - Academic/Professional
  medium: {
    academic: [
      'law.cornell.edu',
      'law.harvard.edu',
      'law.yale.edu',
      'law.stanford.edu',
      'law.columbia.edu',
      'law.nyu.edu',
      'law.georgetown.edu',
      'law.ucla.edu',
      'law.berkeley.edu',
      'lawreview.org'
    ],
    professional: [
      'americanbar.org',
      'lawsociety.org.uk',
      'lsac.org',
      'abajournal.com',
      'barassociation.org',
      'martindale.com'
    ]
  },

  // Commercial Legal Databases (when accessible)
  commercial: [
    'westlaw.com',
    'lexisnexis.com',
    'bloomberg.com/law',
    'reuters.com/legal',
    'law360.com',
    'legalzoom.com',
    'nolo.com',
    'findlaw.com',
    'justia.com',
    'avvo.com'
  ],

  // Low quality sources to de-prioritize or exclude
  excluded: [
    'quora.com',
    'answers.yahoo.com',
    'reddit.com',
    'facebook.com',
    'twitter.com',
    'instagram.com',
    'pinterest.com',
    'linkedin.com/posts',
    'medium.com',
    'blogspot.com'
  ]
};

// Court hierarchy for authority ranking
export const COURT_HIERARCHY = {
  'supreme court': 10,
  'court of appeals': 8,
  'appellate court': 8,
  'circuit court': 7,
  'district court': 6,
  'federal court': 7,
  'high court': 8,
  'superior court': 6,
  'trial court': 5,
  'municipal court': 3,
  'small claims': 2
};

/**
 * Classify a domain by its legal authority and source type
 */
export function classifyDomain(domain: string): {
  sourceType: LegalSource['sourceType'];
  authority: LegalSource['authority'];
} {
  const lowerDomain = domain.toLowerCase();

  // Check high authority domains
  if (LEGAL_DOMAINS.high.primary.some(d => lowerDomain.includes(d))) {
    return { sourceType: 'primary', authority: 'high' };
  }
  if (LEGAL_DOMAINS.high.government.some(d => lowerDomain.includes(d))) {
    return { sourceType: 'government', authority: 'high' };
  }

  // Check medium authority domains
  if (LEGAL_DOMAINS.medium.academic.some(d => lowerDomain.includes(d))) {
    return { sourceType: 'academic', authority: 'medium' };
  }
  if (LEGAL_DOMAINS.medium.professional.some(d => lowerDomain.includes(d))) {
    return { sourceType: 'secondary', authority: 'medium' };
  }

  // Check commercial domains
  if (LEGAL_DOMAINS.commercial.some(d => lowerDomain.includes(d))) {
    return { sourceType: 'commercial', authority: 'medium' };
  }

  // Default classification
  return { sourceType: 'secondary', authority: 'low' };
}

/**
 * Extract court level from title or content
 */
function extractCourtLevel(title: string, snippet: string): string | undefined {
  const text = (title + ' ' + snippet).toLowerCase();

  for (const [court, score] of Object.entries(COURT_HIERARCHY)) {
    if (text.includes(court)) {
      return court;
    }
  }

  return undefined;
}

/**
 * Calculate authority score for ranking
 */
function calculateAuthorityScore(source: LegalSource): number {
  let score = 0;

  // Base score by authority level
  switch (source.authority) {
    case 'high': score += 100; break;
    case 'medium': score += 50; break;
    case 'low': score += 10; break;
  }

  // Bonus for source type
  switch (source.sourceType) {
    case 'primary': score += 50; break;
    case 'government': score += 40; break;
    case 'academic': score += 30; break;
    case 'secondary': score += 20; break;
    case 'commercial': score += 10; break;
  }

  // Bonus for court level
  if (source.courtLevel && source.courtLevel in COURT_HIERARCHY) {
    score += COURT_HIERARCHY[source.courtLevel as keyof typeof COURT_HIERARCHY] * 5;
  }

  // Penalty for very old sources (if date available)
  if (source.datePublished) {
    const publishDate = new Date(source.datePublished);
    const now = new Date();
    const yearsOld = (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

    if (yearsOld > 10) score -= 20;
    else if (yearsOld > 5) score -= 10;
  }

  return score;
}

/**
 * Check if a domain should be excluded from results
 */
function shouldExcludeDomain(domain: string): boolean {
  return LEGAL_DOMAINS.excluded.some(excluded =>
    domain.toLowerCase().includes(excluded)
  );
}

/**
 * Parse raw search results and convert to LegalSource objects
 */
export function parseSearchResults(rawResults: string): LegalSource[] {
  const sources: LegalSource[] = [];

  try {
    // Try to parse structured results first
    if (rawResults.includes('{') && rawResults.includes('}')) {
      const regex = /{[^{}]*}/g;
      let match;

      while ((match = regex.exec(rawResults)) !== null) {
        try {
          const result = JSON.parse(match[0].replace(/\\"/g, '"'));

          if (result.title && result.snippet && result.link) {
            const url = new URL(result.link);
            const domain = url.hostname;

            // Skip excluded domains
            if (shouldExcludeDomain(domain)) {
              continue;
            }

            const classification = classifyDomain(domain);
            const courtLevel = extractCourtLevel(result.title, result.snippet);

            sources.push({
              title: result.title,
              url: result.link,
              snippet: result.snippet,
              domain,
              sourceType: classification.sourceType,
              authority: classification.authority,
              courtLevel,
              datePublished: result.datePublished // if available
            });
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  } catch (error) {
    console.error('Error parsing search results:', error);
  }

  return sources;
}

/**
 * Filter and categorize legal search results
 */
export function filterLegalResults(rawResults: string): FilteredSearchResults {
  const sources = parseSearchResults(rawResults);
  const totalResults = sources.length;

  // Sort by authority score
  sources.sort((a, b) => calculateAuthorityScore(b) - calculateAuthorityScore(a));

  // Categorize results
  const categorized: FilteredSearchResults = {
    primarySources: sources.filter(s => s.sourceType === 'primary'),
    governmentSources: sources.filter(s => s.sourceType === 'government'),
    academicSources: sources.filter(s => s.sourceType === 'academic'),
    secondarySources: sources.filter(s => s.sourceType === 'secondary'),
    commercialSources: sources.filter(s => s.sourceType === 'commercial'),
    totalResults,
    filteredOutCount: 0 // We'll calculate this if we have access to pre-filter count
  };

  return categorized;
}

/**
 * Format filtered results for display
 */
export function formatLegalResults(filteredResults: FilteredSearchResults, query: string): string {
  let formattedOutput = `Legal Research Results for "${query}"\n\n`;
  formattedOutput += `Found ${filteredResults.totalResults} relevant legal sources\n\n`;

  // Primary Sources (Cases, Statutes, Regulations)
  if (filteredResults.primarySources.length > 0) {
    formattedOutput += `📋 PRIMARY LEGAL SOURCES (${filteredResults.primarySources.length}):\n`;
    filteredResults.primarySources.slice(0, 5).forEach((source, index) => {
      formattedOutput += `\n${index + 1}. ${source.title}\n`;
      formattedOutput += `   🏛️ Authority: ${source.authority.toUpperCase()}`;
      if (source.courtLevel) formattedOutput += ` (${source.courtLevel})`;
      formattedOutput += `\n   🔗 ${source.url}\n`;
      formattedOutput += `   📄 ${source.snippet}\n`;
    });
    formattedOutput += '\n';
  }

  // Government Sources
  if (filteredResults.governmentSources.length > 0) {
    formattedOutput += `🏛️ GOVERNMENT SOURCES (${filteredResults.governmentSources.length}):\n`;
    filteredResults.governmentSources.slice(0, 3).forEach((source, index) => {
      formattedOutput += `\n${index + 1}. ${source.title}\n`;
      formattedOutput += `   🔗 ${source.url}\n`;
      formattedOutput += `   📄 ${source.snippet}\n`;
    });
    formattedOutput += '\n';
  }

  // Academic Sources
  if (filteredResults.academicSources.length > 0) {
    formattedOutput += `🎓 ACADEMIC SOURCES (${filteredResults.academicSources.length}):\n`;
    filteredResults.academicSources.slice(0, 3).forEach((source, index) => {
      formattedOutput += `\n${index + 1}. ${source.title}\n`;
      formattedOutput += `   🔗 ${source.url}\n`;
      formattedOutput += `   📄 ${source.snippet}\n`;
    });
    formattedOutput += '\n';
  }

  // Secondary Sources
  if (filteredResults.secondarySources.length > 0) {
    formattedOutput += `📚 SECONDARY SOURCES (${filteredResults.secondarySources.length}):\n`;
    filteredResults.secondarySources.slice(0, 2).forEach((source, index) => {
      formattedOutput += `\n${index + 1}. ${source.title}\n`;
      formattedOutput += `   🔗 ${source.url}\n`;
      formattedOutput += `   📄 ${source.snippet}\n`;
    });
  }

  return formattedOutput;
}

/**
 * Get domain-specific search suggestions
 */
export function getDomainSuggestions(sourceType: LegalSource['sourceType']): string[] {
  switch (sourceType) {
    case 'primary':
      return ['site:uscourts.gov', 'site:supremecourt.gov', 'site:courts.ca.gov'];
    case 'government':
      return ['site:gov', 'site:justice.gov', 'site:congress.gov'];
    case 'academic':
      return ['site:edu', 'site:law.cornell.edu', 'filetype:pdf'];
    case 'secondary':
      return ['law review', 'legal commentary', 'bar journal'];
    default:
      return ['legal analysis', 'court decision', 'statute'];
  }
}