// src/lib/legal-research/test-legal-research.ts

import { LegalResearch, initializeLegalResearch } from './index';

/**
 * Test script to validate legal research enhancements
 * This can be run to verify the system works correctly
 */

// Test queries for different legal scenarios
const TEST_QUERIES = [
  // Contract law
  "breach of contract remedies California",

  // Case law search
  "Brown v. Board of Education precedent",

  // Statute search
  "Americans with Disabilities Act requirements",

  // Constitutional law
  "First Amendment free speech limitations",

  // Employment law
  "wrongful termination at will employment",

  // Intellectual property
  "trademark infringement fair use defense"
];

/**
 * Test query processing functionality
 */
export async function testQueryProcessing() {
  console.log('🔍 Testing Legal Query Processing...\n');

  for (const query of TEST_QUERIES.slice(0, 3)) {
    console.log(`Query: "${query}"`);

    const processedQuery = LegalResearch.processQuery(query, {
      jurisdiction: 'us-ca',
      includeSecondary: true
    });

    console.log(`Enhanced Query: "${processedQuery.enhancedQuery}"`);
    console.log(`Detected Type: ${processedQuery.queryType}`);
    console.log(`Practice Area: ${processedQuery.practiceArea || 'Not detected'}`);
    console.log(`Suggested Terms: ${processedQuery.suggestedTerms.join(', ')}`);
    console.log('---\n');
  }
}

/**
 * Test citation parsing functionality
 */
export async function testCitationParsing() {
  console.log('📚 Testing Citation Parsing...\n');

  const SAMPLE_TEXT = `
    In Brown v. Board of Education, 347 U.S. 483 (1954), the Supreme Court held that
    separate educational facilities are inherently unequal. This was further reinforced
    in subsequent cases. Under 42 U.S.C. § 1983, individuals can sue for civil rights
    violations. The regulation at 17 C.F.R. § 240.10b-5 prohibits securities fraud.
  `;

  const citations = LegalResearch.extractCitations(SAMPLE_TEXT);

  console.log(`Found ${citations.length} citations:`);

  citations.forEach((citation: any, index: number) => {
    console.log(`${index + 1}. ${citation.type.toUpperCase()}: ${citation.fullCitation}`);
    console.log(`   Confidence: ${citation.confidence}`);
    if (citation.caseName) console.log(`   Case: ${citation.caseName}`);
    if (citation.year) console.log(`   Year: ${citation.year}`);
    console.log('');
  });
}

/**
 * Test source filtering functionality
 */
export async function testSourceFiltering() {
  console.log('🔍 Testing Source Classification...\n');

  const TEST_DOMAINS = [
    'supremecourt.gov',
    'law.cornell.edu',
    'westlaw.com',
    'wikipedia.org',
    'courts.ca.gov',
    'justice.gov',
    'reddit.com'
  ];

  TEST_DOMAINS.forEach(domain => {
    // Note: classifyDomain is not directly exposed, this would need to be imported separately
    console.log(`${domain}: [classification would be shown here]`);
  });
}

/**
 * Test research context functionality
 */
export async function testResearchContext() {
  console.log('📋 Testing Research Context...\n');

  // Initialize research session
  const research = initializeLegalResearch('test-project', 'test-conversation', 'us-ca');

  // Simulate adding some research queries
  const testQuery = LegalResearch.processQuery("contract breach remedies", {
    jurisdiction: 'us-ca',
    practiceArea: 'contract'
  });

  console.log('Research session initialized');
  console.log(`Processed query: ${testQuery.originalQuery}`);
  console.log(`Enhanced to: ${testQuery.enhancedQuery}`);

  // Get contextual suggestions
  const suggestions = research.getContext();
  console.log('\nContextual suggestions:');
  suggestions.forEach((suggestion: string, index: number) => {
    console.log(`${index + 1}. ${suggestion}`);
  });

  // Clean up
  research.endSession();
}

/**
 * Run all tests
 */
export async function runLegalResearchTests() {
  console.log('🏛️  LEGAL RESEARCH SYSTEM TESTS\n');
  console.log('=' .repeat(50) + '\n');

  try {
    await testQueryProcessing();
    await testCitationParsing();
    await testSourceFiltering();
    await testResearchContext();

    console.log('✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Export for use in development/testing
export const TestSuite = {
  runAll: runLegalResearchTests,
  queryProcessing: testQueryProcessing,
  citationParsing: testCitationParsing,
  sourceFiltering: testSourceFiltering,
  researchContext: testResearchContext
};

// For direct execution during development
if (require.main === module) {
  runLegalResearchTests().catch(console.error);
}