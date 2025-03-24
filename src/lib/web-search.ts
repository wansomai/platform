// src/lib/webSearch.ts
import { GoogleCustomSearch } from "@langchain/community/tools/google_custom_search";

/**
 * Perform a web search for information related to a query using LangChain's GoogleCustomSearch tool
 * @param query The search query
 * @returns Search results as string
 */
export async function performWebSearch(query: string): Promise<string> {
  try {
    // Initialize the Google Custom Search tool from LangChain
    const search = new GoogleCustomSearch({
      apiKey: process.env.GOOGLE_API_KEY || "",
      googleCSEId: process.env.GOOGLE_CSE_ID || "",
    });

    // Execute the search
    const results = await search.call({input: query});
    
    // Log search for monitoring/debugging (remove in production or use proper logging)
    console.log(`Web search performed for query: ${query}`);
    
    // Check if we have results
    if (!results || typeof results !== 'string' || results.trim() === '') {
      return "No relevant information found from web search.";
    }
    
    // Format the results for inclusion in AI context
    return `
Web Search Results for "${query}":
${results}
`;
  } catch (error:any) {
   // More detailed error logging
  console.error('Google Search API error details:', {
    message: error.message,
    status: error.status,
    details: error.response?.data || 'No detailed error information'
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