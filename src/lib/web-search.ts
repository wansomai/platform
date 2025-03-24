// Update to src/lib/webSearch.ts to return human-readable format directly

import { GoogleCustomSearch } from "@langchain/community/tools/google_custom_search";

/**
 * Perform a web search for information related to a query using LangChain's GoogleCustomSearch tool
 * @param query The search query
 * @returns Search results as formatted, human-readable string
 */
export async function performWebSearch(query: string): Promise<string> {
  try {
    // Initialize the Google Custom Search tool from LangChain
    const search = new GoogleCustomSearch({
      apiKey: process.env.GOOGLE_API_KEY || "",
      googleCSEId: process.env.GOOGLE_CSE_ID || "",
    });

    // Execute the search
    const rawResults = await search.call({input: query});
    
    // Log search for monitoring/debugging
    console.log(`Web search performed for query: ${query}`);
    
    // Check if we have results
    if (!rawResults || typeof rawResults !== 'string' || rawResults.trim() === '') {
      return "No relevant information found from web search.";
    }
    
    // Process and format results for human readability
    try {
      // Try to parse as JSON if it looks like JSON
      let results = [];
      if (rawResults.includes('{') && rawResults.includes('}')) {
        // Extract all JSON objects
        const regex = /{[^{}]*}/g;
        let match;
        while ((match = regex.exec(rawResults)) !== null) {
          try {
            const result = JSON.parse(match[0].replace(/\\"/g, '"'));
            if (result.title && result.snippet) {
              results.push(result);
            }
          } catch (e) {
            // Skip invalid JSON
            console.warn("Invalid JSON in search results:", match[0]);
          }
        }
      }
      
      // Format results in human-readable text
      if (results.length > 0) {
        let formattedResults = `Web Search Results for "${query}":\n\n`;
        
        results.forEach((result, index) => {
          formattedResults += `Result ${index + 1}:\n`;
          formattedResults += `Title: ${result.title}\n`;
          if (result.link) formattedResults += `Link: ${result.link}\n`;
          if (result.snippet) formattedResults += `Summary: ${result.snippet}\n`;
          formattedResults += '\n';
        });
        
        return formattedResults;
      } else {
        // Just return the raw results if we couldn't parse them
        return `Web Search Results for "${query}":\n\n${rawResults}`;
      }
    } catch (error) {
      console.error('Error formatting search results:', error);
      return `Web Search Results for "${query}":\n\n${rawResults}`;
    }
  } catch (error:any) {
    // More detailed error logging
    console.error('Google Search API error details:', {
      message: error
    });
    return "Unable to perform web search at this time.";
  }
}

/**
 * Check if Google Search API configuration is available
 * @returns Boolean indicating if search can be performed
 */
export function isWebSearchConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_API_KEY && 
    process.env.GOOGLE_CSE_ID
  );
}