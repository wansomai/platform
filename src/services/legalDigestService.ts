// src/services/legalDigestService.ts
import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

/**
 * Jurisdiction definitions mapping codes to names and key legal sources
 */
export const JURISDICTIONS: Record<string, { name: string; sources: string }> = {
  KE: { name: 'Kenya', sources: 'Kenya Law Reports (kenyalaw.org), Kenya Gazette, Judiciary of Kenya' },
  TZ: { name: 'Tanzania', sources: 'Tanzania Legal Information Institute (tanzlii.org), Tanzania Gazette' },
  UG: { name: 'Uganda', sources: 'Uganda Legal Information Institute (ulii.org), Uganda Gazette' },
  NG: { name: 'Nigeria', sources: 'Nigerian Law Reports, Law Pavilion, Nigerian Gazette' },
  GH: { name: 'Ghana', sources: 'Ghana Legal Information Institute (ghalii.org), Ghana Gazette' },
  ZA: { name: 'South Africa', sources: 'Southern African Legal Information Institute (saflii.org), Government Gazette' },
  RW: { name: 'Rwanda', sources: 'Rwanda Legal Information Institute, Official Gazette of Rwanda' },
  ET: { name: 'Ethiopia', sources: 'Ethiopian Legal Information Institute, Federal Negarit Gazette' },
  US: { name: 'United States', sources: 'Supreme Court opinions, Federal Register, state court decisions' },
  GB: { name: 'United Kingdom', sources: 'UK Supreme Court, legislation.gov.uk, The Law Gazette' },
  IN: { name: 'India', sources: 'Supreme Court of India, Indian Kanoon, Gazette of India' },
  AU: { name: 'Australia', sources: 'AustLII, Federal Court of Australia, Commonwealth Gazette' },
  CA: { name: 'Canada', sources: 'CanLII, Supreme Court of Canada, Canada Gazette' },
  EU: { name: 'European Union', sources: 'EUR-Lex, CJEU decisions, Official Journal of the EU' },
};

export interface DigestSection {
  category: string;
  items: {
    title: string;
    summary: string;
    sourceUrl?: string;
    sourceName?: string;
  }[];
}

export interface DigestContent {
  headline: string;
  summary: string;
  sections: DigestSection[];
  sources: { title: string; url: string }[];
  generatedAt: string;
}

/**
 * Generates a legal news digest using Gemini with Google Search grounding
 */
export async function generateLegalDigest(
  topics: string[],
  jurisdictions: string[],
  frequency: 'daily' | 'weekly'
): Promise<DigestContent> {
  const timeframe = frequency === 'daily' ? 'the past 24 hours' : 'the past week';
  const topicList = topics.length > 0 ? topics.join(', ') : 'general legal news';

  // Build jurisdiction context for the prompt
  const jurisdictionDetails = jurisdictions
    .map((code) => {
      const j = JURISDICTIONS[code];
      return j ? `- ${j.name}: Search ${j.sources}` : null;
    })
    .filter(Boolean)
    .join('\n');

  const jurisdictionNames = jurisdictions
    .map((code) => JURISDICTIONS[code]?.name)
    .filter(Boolean)
    .join(', ');

  const jurisdictionPrompt = jurisdictionNames
    ? `\n\nFocus specifically on these jurisdictions:\n${jurisdictionDetails}\n\nPrioritize legal developments from: ${jurisdictionNames}. Search for jurisdiction-specific legal databases, law reports, and official gazettes for these countries.`
    : '';

  const prompt = `You are a legal news research assistant. Search for the most important and recent legal news, case law updates, and regulatory changes from ${timeframe} related to: ${topicList}.${jurisdictionPrompt}

Organize your findings into these categories:
1. **Case Law Updates** - Notable court decisions, rulings, and judicial opinions
2. **Regulatory Changes** - New regulations, policy updates, government agency actions
3. **Legal News** - Industry developments, law firm news, legal technology updates

For each item provide:
- A clear, concise title (include the jurisdiction/country name in the title)
- A 2-3 sentence summary explaining the significance
- The source name and URL where possible

Focus on developments that would be most relevant to practicing attorneys in the specified jurisdictions. Prioritize accuracy and cite specific sources.

Format your response as JSON with this structure:
{
  "headline": "Brief one-line overview of the most significant development",
  "summary": "2-3 sentence executive summary of key developments",
  "sections": [
    {
      "category": "Case Law Updates",
      "items": [{ "title": "...", "summary": "...", "sourceName": "...", "sourceUrl": "..." }]
    },
    {
      "category": "Regulatory Changes",
      "items": [{ "title": "...", "summary": "...", "sourceName": "...", "sourceUrl": "..." }]
    },
    {
      "category": "Legal News",
      "items": [{ "title": "...", "summary": "...", "sourceName": "...", "sourceUrl": "..." }]
    }
  ],
  "sources": [{ "title": "Source Name", "url": "https://..." }]
}

Return ONLY valid JSON, no markdown code fences.`;

  const response = await genAI.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      temperature: 0.3,
    },
  });

  const text = response.text?.trim() || '';

  // Parse the JSON response, stripping any markdown fences
  let cleanText = text;
  if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  try {
    const parsed = JSON.parse(cleanText) as DigestContent;
    parsed.generatedAt = new Date().toISOString();

    // Extract grounding sources from response metadata if available
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    if (groundingMetadata?.groundingChunks) {
      const groundingSources = groundingMetadata.groundingChunks
        .filter((chunk) => chunk.web?.uri)
        .map((chunk) => ({
          title: chunk.web?.title || 'Source',
          url: chunk.web?.uri || '',
        }));

      if (groundingSources.length > 0) {
        // Merge grounding sources with parsed sources, avoiding duplicates
        const existingUrls = new Set(parsed.sources.map((s) => s.url));
        for (const source of groundingSources) {
          if (!existingUrls.has(source.url)) {
            parsed.sources.push(source);
          }
        }
      }
    }

    return parsed;
  } catch {
    // If JSON parsing fails, create a structured response from the raw text
    return {
      headline: 'Law 360 Digest',
      summary: text.slice(0, 300),
      sections: [
        {
          category: 'Legal News',
          items: [
            {
              title: 'Legal News Summary',
              summary: text.slice(0, 500),
            },
          ],
        },
      ],
      sources: [],
      generatedAt: new Date().toISOString(),
    };
  }
}
