// Legal Document Classification Service
// Uses AI to automatically classify uploaded legal documents

import { GoogleGenAI } from '@google/genai';
import type { LegalKnowledgeType, Jurisdiction } from '@/types/legalKnowledge';
import { PracticeArea } from '@/prisma/client';

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || ''
});

interface ClassificationResult {
  type: LegalKnowledgeType;
  jurisdiction: Jurisdiction;
  practiceAreas: PracticeArea[];
  tags: string[];
  confidence: number;
}

const VALID_TYPES: LegalKnowledgeType[] = [
  'TEMPLATE',
  'CASE_LAW',
  'STATUTE',
  'REGULATION',
  'LEGAL_OPINION',
  'PRACTICE_GUIDE'
];

const VALID_JURISDICTIONS: Jurisdiction[] = [
  'KENYA',
  'INTERNATIONAL',
  'GENERAL'
];

const VALID_PRACTICE_AREAS: PracticeArea[] = [
  'CONTRACTS_COMMERCIAL',
  'CORPORATE_GOVERNANCE',
  'EMPLOYMENT_LABOR',
  'INTELLECTUAL_PROPERTY',
  'REAL_ESTATE',
  'LITIGATION_DISPUTE_RESOLUTION',
  'BANKING_FINANCE',
  'MERGERS_AND_ACQUISITIONS',
  'TAX_LAW',
  'COMPLIANCE_REGULATORY',
  'SECURITIES',
  'ANTITRUST_COMPETITION',
  'BANKRUPTCY_RESTRUCTURING',
  'ENVIRONMENTAL_LAW',
  'HEALTHCARE_LIFE_SCIENCES',
  'IMMIGRATION',
  'PRIVACY_DATA_PROTECTION',
  'TECHNOLOGY_LICENSING',
  'INTERNATIONAL_TRADE',
  'GENERAL_PRACTICE'
];

/**
 * Classify a legal document using AI
 * Analyzes title and content to determine type, jurisdiction, practice areas, and tags
 */
export async function classifyLegalDocument(
  title: string,
  content: string
): Promise<ClassificationResult> {
  // Use first 8000 chars for classification (enough context, saves tokens)
  const contentSample = content.substring(0, 8000);

  const prompt = `Analyze this legal document and classify it.

DOCUMENT TITLE: ${title}

DOCUMENT CONTENT (first portion):
${contentSample}

---

Classify this document by providing a JSON response with:

1. "type": One of: ${VALID_TYPES.join(', ')}
   - TEMPLATE: Reusable document templates (NDAs, contracts, agreements)
   - CASE_LAW: Court decisions, judgments, legal precedents
   - STATUTE: Laws, acts, legislation
   - REGULATION: Rules, regulations, government orders
   - LEGAL_OPINION: Legal advice, memos, opinions
   - PRACTICE_GUIDE: How-to guides, best practices, checklists

2. "jurisdiction": One of: ${VALID_JURISDICTIONS.join(', ')}
   - KENYA: Kenyan law
   - INTERNATIONAL: Cross-border, international law
   - GENERAL: Not jurisdiction-specific

3. "practiceAreas": Array of relevant areas from: ${VALID_PRACTICE_AREAS.join(', ')}
   (Select 1-3 most relevant)

4. "tags": Array of 3-5 descriptive keywords (lowercase, e.g., "nda", "confidentiality", "employment")

5. "confidence": 0.0 to 1.0 (how confident you are in this classification)

Respond ONLY with valid JSON, no other text:`;

  try {
    const result = await genAI.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.1,
        maxOutputTokens: 500
      }
    });

    const responseText = result.text || '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and sanitize the response
      const type = VALID_TYPES.includes(parsed.type) ? parsed.type : 'TEMPLATE';
      const jurisdiction = VALID_JURISDICTIONS.includes(parsed.jurisdiction)
        ? parsed.jurisdiction
        : 'GENERAL';
      const practiceAreas = (parsed.practiceAreas || [])
        .filter((pa: string) => VALID_PRACTICE_AREAS.includes(pa as PracticeArea))
        .slice(0, 3) as PracticeArea[];
      const tags = (parsed.tags || [])
        .filter((t: any) => typeof t === 'string')
        .map((t: string) => t.toLowerCase().trim())
        .slice(0, 5);
      const confidence = typeof parsed.confidence === 'number'
        ? Math.min(1, Math.max(0, parsed.confidence))
        : 0.5;

      return {
        type,
        jurisdiction,
        practiceAreas,
        tags,
        confidence
      };
    }
  } catch (error) {
    console.error('AI classification parsing failed:', error);
  }

  // Return defaults if AI fails
  return {
    type: 'TEMPLATE',
    jurisdiction: 'GENERAL',
    practiceAreas: [],
    tags: [],
    confidence: 0
  };
}
