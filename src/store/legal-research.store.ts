// src/store/legal-research.store.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LegalQueryContext } from '@/lib/legal-research/queryProcessor';
import { FilteredSearchResults } from '@/lib/legal-research/sourceFilter';
import { LegalCitation } from '@/lib/legal-research/citationParser';

export interface ResearchSession {
  id: string;
  projectId: string;
  conversationId: string;
  startTime: Date;
  lastActivity: Date;
  queries: ResearchQuery[];
  concepts: string[];
  jurisdictions: string[];
  practiceAreas: string[];
}

export interface ResearchQuery {
  id: string;
  timestamp: Date;
  originalQuery: string;
  enhancedQuery: string;
  queryContext: LegalQueryContext;
  results?: FilteredSearchResults;
  citations: LegalCitation[];
  followUpQueries: string[];
}

interface LegalResearchState {
  // Current session
  currentSession: ResearchSession | null;
  searchHistory: ResearchQuery[];

  // Context tracking
  discoveredConcepts: Map<string, number>; // concept -> frequency
  frequentJurisdictions: string[];
  primaryPracticeAreas: string[];

  // Research suggestions
  suggestedQueries: string[];
  relatedConcepts: string[];

  // Actions
  startSession: (projectId: string, conversationId: string) => void;
  endSession: () => void;
  addQuery: (query: ResearchQuery) => void;
  updateQueryResults: (queryId: string, results: FilteredSearchResults, citations: LegalCitation[]) => void;
  addConcept: (concept: string) => void;
  addConcepts: (concepts: string[]) => void;
  getRelatedQueries: (currentQuery: string) => string[];
  getContextualSuggestions: () => string[];
  clearHistory: () => void;

  // Getters
  getRecentQueries: (limit?: number) => ResearchQuery[];
  getQueriesForProject: (projectId: string) => ResearchQuery[];
  getMostRelevantConcepts: (limit?: number) => string[];
  getResearchSummary: () => {
    totalQueries: number;
    primaryJurisdictions: string[];
    primaryPracticeAreas: string[];
    keyFindings: string[];
  };
}

export const useLegalResearchStore = create<LegalResearchState>()(
  persist(
    (set, get) => ({
      currentSession: null,
      searchHistory: [],
      discoveredConcepts: new Map(),
      frequentJurisdictions: [],
      primaryPracticeAreas: [],
      suggestedQueries: [],
      relatedConcepts: [],

      startSession: (projectId: string, conversationId: string) => {
        const session: ResearchSession = {
          id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          projectId,
          conversationId,
          startTime: new Date(),
          lastActivity: new Date(),
          queries: [],
          concepts: [],
          jurisdictions: [],
          practiceAreas: []
        };

        set({ currentSession: session });
      },

      endSession: () => {
        const { currentSession } = get();
        if (currentSession) {
          // Update research history with session queries
          set(state => ({
            currentSession: null,
            searchHistory: [...state.searchHistory, ...currentSession.queries]
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .slice(0, 100) // Keep last 100 queries
          }));
        }
      },

      addQuery: (query: ResearchQuery) => {
        set(state => {
          const updatedSession = state.currentSession ? {
            ...state.currentSession,
            queries: [...state.currentSession.queries, query],
            lastActivity: new Date(),
            // Update session concepts and jurisdictions
            concepts: Array.from(new Set([
              ...state.currentSession.concepts,
              ...query.queryContext.suggestedTerms
            ])),
            jurisdictions: query.queryContext.jurisdiction
              ? Array.from(new Set([...state.currentSession.jurisdictions, query.queryContext.jurisdiction]))
              : state.currentSession.jurisdictions,
            practiceAreas: query.queryContext.practiceArea
              ? Array.from(new Set([...state.currentSession.practiceAreas, query.queryContext.practiceArea]))
              : state.currentSession.practiceAreas
          } : null;

          return {
            currentSession: updatedSession,
            searchHistory: [query, ...state.searchHistory].slice(0, 50)
          };
        });

        // Add concepts to discovered concepts map
        if (query.queryContext.suggestedTerms) {
          get().addConcepts(query.queryContext.suggestedTerms);
        }
      },

      updateQueryResults: (queryId: string, results: FilteredSearchResults, citations: LegalCitation[]) => {
        set(state => {
          // Update in current session
          const updatedSession = state.currentSession ? {
            ...state.currentSession,
            queries: state.currentSession.queries.map(q =>
              q.id === queryId
                ? { ...q, results, citations }
                : q
            )
          } : null;

          // Update in search history
          const updatedHistory = state.searchHistory.map(q =>
            q.id === queryId
              ? { ...q, results, citations }
              : q
          );

          return {
            currentSession: updatedSession,
            searchHistory: updatedHistory
          };
        });

        // Extract and add concepts from citations
        const conceptsFromCitations = citations
          .filter(c => c.caseName || c.title)
          .map(c => c.caseName || c.title)
          .filter(Boolean) as string[];

        if (conceptsFromCitations.length > 0) {
          get().addConcepts(conceptsFromCitations);
        }
      },

      addConcept: (concept: string) => {
        set(state => {
          const newMap = new Map(state.discoveredConcepts);
          newMap.set(concept, (newMap.get(concept) || 0) + 1);
          return { discoveredConcepts: newMap };
        });
      },

      addConcepts: (concepts: string[]) => {
        concepts.forEach(concept => get().addConcept(concept));
      },

      getRelatedQueries: (currentQuery: string) => {
        const { searchHistory, discoveredConcepts } = get();
        const queryLower = currentQuery.toLowerCase();

        // Find related queries based on similar terms
        const relatedQueries = searchHistory
          .filter(q => {
            const originalLower = q.originalQuery.toLowerCase();
            // Check for common words (excluding common legal stop words)
            const currentTerms = queryLower.split(' ').filter(term =>
              term.length > 3 && !['legal', 'case', 'court', 'law'].includes(term)
            );
            const originalTerms = originalLower.split(' ');

            return currentTerms.some(term => originalTerms.includes(term));
          })
          .slice(0, 5)
          .map(q => q.originalQuery);

        // Add concept-based suggestions
        const conceptSuggestions = Array.from(discoveredConcepts.entries())
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([concept]) => `${concept} legal analysis`);

        return Array.from(new Set([...relatedQueries, ...conceptSuggestions])).slice(0, 5);
      },

      getContextualSuggestions: () => {
        const { currentSession, discoveredConcepts, searchHistory } = get();
        const suggestions: string[] = [];

        // Suggestions based on current session
        if (currentSession) {
          const sessionConcepts = currentSession.concepts.slice(0, 3);
          const sessionJurisdictions = currentSession.jurisdictions;
          const sessionPracticeAreas = currentSession.practiceAreas;

          // Combine session context for suggestions
          if (sessionPracticeAreas.length > 0 && sessionJurisdictions.length > 0) {
            suggestions.push(`${sessionPracticeAreas[0]} law in ${sessionJurisdictions[0]}`);
          }

          sessionConcepts.forEach(concept => {
            suggestions.push(`recent developments in ${concept}`);
          });
        }

        // Suggestions based on frequent concepts
        const frequentConcepts = Array.from(discoveredConcepts.entries())
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([concept]) => concept);

        frequentConcepts.forEach(concept => {
          suggestions.push(`${concept} precedent analysis`);
        });

        // Trending suggestions based on recent queries
        const recentQueries = searchHistory.slice(0, 10);
        const recentPracticeAreas = recentQueries
          .map(q => q.queryContext.practiceArea)
          .filter(Boolean) as string[];

        if (recentPracticeAreas.length > 0) {
          const mostRecentArea = recentPracticeAreas[0];
          suggestions.push(`current trends in ${mostRecentArea} law`);
        }

        return Array.from(new Set(suggestions)).slice(0, 6);
      },

      getRecentQueries: (limit = 10) => {
        return get().searchHistory.slice(0, limit);
      },

      getQueriesForProject: (projectId: string) => {
        return get().searchHistory.filter(q =>
          get().currentSession?.projectId === projectId ||
          q.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours as fallback
        );
      },

      getMostRelevantConcepts: (limit = 8) => {
        return Array.from(get().discoveredConcepts.entries())
          .sort(([,a], [,b]) => b - a)
          .slice(0, limit)
          .map(([concept]) => concept);
      },

      getResearchSummary: () => {
        const { searchHistory, discoveredConcepts, currentSession } = get();

        const totalQueries = searchHistory.length + (currentSession?.queries.length || 0);

        // Get primary jurisdictions from recent queries
        const jurisdictions = searchHistory
          .concat(currentSession?.queries || [])
          .map(q => q.queryContext.jurisdiction)
          .filter(Boolean) as string[];
        const primaryJurisdictions = Array.from(new Set(jurisdictions)).slice(0, 3);

        // Get primary practice areas
        const practiceAreas = searchHistory
          .concat(currentSession?.queries || [])
          .map(q => q.queryContext.practiceArea)
          .filter(Boolean) as string[];
        const primaryPracticeAreas = Array.from(new Set(practiceAreas)).slice(0, 3);

        // Get key findings (most frequent concepts)
        const keyFindings = Array.from(discoveredConcepts.entries())
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([concept]) => concept);

        return {
          totalQueries,
          primaryJurisdictions,
          primaryPracticeAreas,
          keyFindings
        };
      },

      clearHistory: () => {
        set({
          currentSession: null,
          searchHistory: [],
          discoveredConcepts: new Map(),
          frequentJurisdictions: [],
          primaryPracticeAreas: [],
          suggestedQueries: [],
          relatedConcepts: []
        });
      }
    }),
    {
      name: 'legal-research-storage',
      partialize: (state) => ({
        searchHistory: state.searchHistory,
        discoveredConcepts: Array.from(state.discoveredConcepts.entries()),
        frequentJurisdictions: state.frequentJurisdictions,
        primaryPracticeAreas: state.primaryPracticeAreas
      }),
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.discoveredConcepts)) {
          // Convert array back to Map after rehydration
          state.discoveredConcepts = new Map(state.discoveredConcepts);
        }
      }
    }
  )
);