// src/lib/legal-research/enhancedWebSearch.ts

import { GoogleCustomSearch } from "@langchain/community/tools/google_custom_search";
import { processLegalQuery, LegalQueryContext } from './queryProcessor';
import { filterLegalResults, formatLegalResults, FilteredSearchResults } from './sourceFilter';

export interface LegalSearchOptions {
  jurisdiction?: string;
  practiceArea?: string;
  includeSecondary?: boolean;
  maxResults?: number;
}

export interface LegalSearchResult {
  originalQuery: string;
  enhancedQuery: string;
  queryContext: LegalQueryContext;
  results: FilteredSearchResults;
  formattedOutput: string;
  suggestions: string[];
}

/**
 * Perform enhanced legal web search with query processing and result filtering
 */
export async function performLegalWebSearch(
  query: string,
  options: LegalSearchOptions = {}
): Promise<LegalSearchResult> {
  try {
    console.log('Enhanced legal search called with:', {
      query,
      jurisdiction: options.jurisdiction,
      practiceArea: options.practiceArea
    });

    // Process the legal query to enhance it
    const queryContext = processLegalQuery(query, {
      jurisdiction: options.jurisdiction,
      practiceArea: options.practiceArea,
      includeSecondary: options.includeSecondary
    });

    console.log('Query processing result:', {
      originalQuery: queryContext.originalQuery,
      enhancedQuery: queryContext.enhancedQuery,
      detectedJurisdiction: queryContext.jurisdiction,
      detectedPracticeArea: queryContext.practiceArea
    });

    // Initialize the Google Custom Search tool
    const search = new GoogleCustomSearch({
      apiKey: process.env.GOOGLE_API_KEY || "",
      googleCSEId: process.env.GOOGLE_CSE_ID || "",
    });

    // Execute the enhanced search
    const rawResults = await search.call({ input: queryContext.enhancedQuery });

    // Check if we have results
    if (!rawResults || typeof rawResults !== 'string' || rawResults.trim() === '') {
      return {
        originalQuery: query,
        enhancedQuery: queryContext.enhancedQuery,
        queryContext,
        results: {
          primarySources: [],
          secondarySources: [],
          governmentSources: [],
          academicSources: [],
          commercialSources: [],
          totalResults: 0,
          filteredOutCount: 0
        },
        formattedOutput: "No relevant legal information found from web search.",
        suggestions: queryContext.suggestedTerms
      };
    }

    // Filter and categorize results
    const filteredResults = filterLegalResults(rawResults);

    // Format results for display
    const formattedOutput = formatLegalResults(filteredResults, query);

    // Add research suggestions
    const suggestions = [
      ...queryContext.suggestedTerms,
      `${query} precedent`,
      `recent ${queryContext.practiceArea || 'legal'} developments`
    ].filter(Boolean).slice(0, 5);

    return {
      originalQuery: query,
      enhancedQuery: queryContext.enhancedQuery,
      queryContext,
      results: filteredResults,
      formattedOutput,
      suggestions
    };

  } catch (error: any) {
    console.error('Legal web search error:', error);

    return {
      originalQuery: query,
      enhancedQuery: query,
      queryContext: {
        queryType: 'general',
        originalQuery: query,
        enhancedQuery: query,
        suggestedTerms: []
      },
      results: {
        primarySources: [],
        secondarySources: [],
        governmentSources: [],
        academicSources: [],
        commercialSources: [],
        totalResults: 0,
        filteredOutCount: 0
      },
      formattedOutput: "Unable to perform legal web search at this time.",
      suggestions: []
    };
  }
}

/**
 * Check if legal search is properly configured
 */
export function isLegalSearchConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_API_KEY &&
    process.env.GOOGLE_CSE_ID
  );
}

/**
 * Get search suggestions based on query type and practice area
 */
export function getLegalSearchSuggestions(queryContext: LegalQueryContext): string[] {
  const suggestions: string[] = [];
  const { queryType, practiceArea, originalQuery } = queryContext;

  // Add query type specific suggestions
  switch (queryType) {
    case 'case-law':
      suggestions.push(
        `${originalQuery} precedent`,
        `${originalQuery} recent cases`,
        `${originalQuery} court decisions`
      );
      break;
    case 'statute':
      suggestions.push(
        `${originalQuery} interpretation`,
        `${originalQuery} amendments`,
        `${originalQuery} case law`
      );
      break;
    case 'regulation':
      suggestions.push(
        `${originalQuery} compliance`,
        `${originalQuery} enforcement`,
        `${originalQuery} updates`
      );
      break;
    default:
      suggestions.push(
        `${originalQuery} overview`,
        `${originalQuery} legal analysis`,
        `${originalQuery} requirements`
      );
  }

  // Add practice area suggestions
  if (practiceArea) {
    suggestions.push(
      `${practiceArea} law trends`,
      `${practiceArea} recent developments`
    );
  }

  return suggestions.slice(0, 5);
}

/**
 * Extract key legal concepts from search results
 */
export function extractLegalConcepts(results: FilteredSearchResults): string[] {
  const concepts: string[] = [];
  const allText = [
    ...results.primarySources,
    ...results.governmentSources,
    ...results.academicSources
  ].map(s => `${s.title} ${s.snippet}`).join(' ').toLowerCase();

  // Common legal concepts to extract
  const legalConcepts = [
    'due process', 'equal protection', 'burden of proof', 'standard of review',
    'strict scrutiny', 'rational basis', 'intermediate scrutiny',
    'negligence', 'breach of contract', 'damages', 'injunction',
    'summary judgment', 'motion to dismiss', 'discovery',
    'precedent', 'stare decisis', 'jurisdiction', 'venue'
  ];

  legalConcepts.forEach(concept => {
    if (allText.includes(concept)) {
      concepts.push(concept);
    }
  });

  return Array.from(new Set(concepts)).slice(0, 8);
}

/**
 * Generate follow-up research questions
 */
export function generateResearchQuestions(
  queryContext: LegalQueryContext,
  results: FilteredSearchResults
): string[] {
  const questions: string[] = [];
  const { originalQuery, practiceArea, queryType } = queryContext;

  // Extract key concepts for follow-up questions
  const keyConcepts = extractLegalConcepts(results);

  if (keyConcepts.length > 0) {
    questions.push(`How do ${keyConcepts.slice(0, 2).join(' and ')} apply to ${originalQuery}?`);
  }

  // Add type-specific follow-up questions
  if (queryType === 'case-law' && results.primarySources.length > 0) {
    questions.push(`What are the key precedents for ${originalQuery}?`);
    questions.push(`How has ${originalQuery} law evolved over time?`);
  }

  if (practiceArea) {
    questions.push(`What are current trends in ${practiceArea} law?`);
    questions.push(`What compliance requirements apply to ${originalQuery}?`);
  }

  return questions.slice(0, 4);
}