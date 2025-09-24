import React from 'react';
import { Search, Shield, GraduationCap, Building, FileText, ExternalLink } from 'lucide-react';
import MessageDisplay from './MessageDisplay';

interface SourcesDisplayProps {
  content: string;
  className?: string;
}

interface ParsedSource {
  title: string;
  url?: string;
  snippet: string;
  type: 'primary' | 'government' | 'academic' | 'secondary' | 'commercial' | 'unknown';
  authority?: 'high' | 'medium' | 'low';
}

// Helper function to detect enhanced legal research format
const isEnhancedLegalResult = (content: string): boolean => {
  return content.includes('📋 PRIMARY LEGAL SOURCES') ||
         content.includes('🏛️ GOVERNMENT SOURCES') ||
         content.includes('🎓 ACADEMIC SOURCES') ||
         content.includes('Legal Research Results for');
};

// Helper function to parse enhanced legal research results
const parseEnhancedLegalResults = (content: string): {
  categories: { type: string, sources: ParsedSource[], count: number }[],
  totalResults: number
} => {
  const categories = [];
  let totalResults = 0;

  // Extract total results
  const totalMatch = content.match(/Found (\d+) relevant legal sources/);
  if (totalMatch) {
    totalResults = parseInt(totalMatch[1]);
  }

  // Parse different categories
  const categoryPatterns = [
    { type: 'Primary Legal Sources', icon: '📋', sourceType: 'primary' as const },
    { type: 'Government Sources', icon: '🏛️', sourceType: 'government' as const },
    { type: 'Academic Sources', icon: '🎓', sourceType: 'academic' as const },
    { type: 'Secondary Sources', icon: '📚', sourceType: 'secondary' as const }
  ];

  for (const category of categoryPatterns) {
    const regex = new RegExp(`${category.icon}\\s*${category.type.toUpperCase().replace(/\s/g, '\\s*')}\\s*\\((\\d+)\\):(.*?)(?=${categoryPatterns.map(c => c.icon).join('|')}|$)`, 's');
    const match = content.match(regex);

    if (match) {
      const count = parseInt(match[1]);
      const sectionContent = match[2];

      // Parse individual sources within this category
      const sourceRegex = /(\d+)\.\s*(.*?)\n.*?🔗\s*(https?:\/\/[^\s\n]+)\n.*?📄\s*(.*?)(?=\n\d+\.|$)/g;
      const sourceMatches = [];
      let sourceMatch;
      while ((sourceMatch = sourceRegex.exec(sectionContent)) !== null) {
        sourceMatches.push(sourceMatch);
      }

      const sources: ParsedSource[] = sourceMatches.map(sourceMatch => ({
        title: sourceMatch[2].trim(),
        url: sourceMatch[3],
        snippet: sourceMatch[4].trim(),
        type: category.sourceType,
        authority: category.sourceType === 'primary' ? 'high' as const :
                  category.sourceType === 'government' ? 'high' as const :
                  category.sourceType === 'academic' ? 'medium' as const : 'medium' as const
      }));

      if (sources.length > 0) {
        categories.push({
          type: category.type,
          sources,
          count
        });
      }
    }
  }

  return { categories, totalResults };
};

// Helper function to parse basic web search results
const parseBasicWebResults = (content: string): ParsedSource[] => {
  const sources: ParsedSource[] = [];

  // Try to parse structured results
  const resultPattern = /Result\s+(\d+):\s*\nTitle:\s*(.*?)\n(?:Link:\s*(.*?)\n)?Summary:\s*(.*?)(?=\n\nResult|\n*$)/g;
  let match;

  while ((match = resultPattern.exec(content)) !== null) {
    sources.push({
      title: match[2].trim(),
      url: match[3]?.trim(),
      snippet: match[4].trim(),
      type: 'unknown',
      authority: 'medium'
    });
  }

  return sources;
};

const getSourceIcon = (type: string) => {
  switch (type) {
    case 'primary': return <Shield size={16} className="text-red-600" />;
    case 'government': return <Building size={16} className="text-blue-600" />;
    case 'academic': return <GraduationCap size={16} className="text-green-600" />;
    case 'secondary': return <FileText size={16} className="text-purple-600" />;
    default: return <Search size={16} className="text-gray-600" />;
  }
};

const getAuthorityBadge = (authority?: string) => {
  if (!authority) return null;

  const colors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${colors[authority as keyof typeof colors]}`}>
      {authority.toUpperCase()}
    </span>
  );
};

export const SourcesDisplay: React.FC<SourcesDisplayProps> = ({ content, className = '' }) => {
  const isEnhanced = isEnhancedLegalResult(content);

  if (isEnhanced) {
    const { categories, totalResults } = parseEnhancedLegalResults(content);

    if (categories.length === 0) {
      return (
        <div className={`space-y-3 ${className}`}>
          <div className="text-gray-600 text-sm">No categorized sources found in enhanced results.</div>
          <MessageDisplay content={content} className="text-gray-700 text-xs" />
        </div>
      );
    }

    return (
      <div className={`space-y-4 ${className}`}>
        {totalResults > 0 && (
          <div className="text-sm text-blue-700 font-medium">
            Found {totalResults} legal sources
          </div>
        )}

        {categories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-800 border-b border-gray-200 pb-1">
              {getSourceIcon(category.sources[0]?.type || 'unknown')}
              <span>{category.type}</span>
              <span className="text-gray-500">({category.count})</span>
            </div>

            <div className="space-y-3">
              {category.sources.map((source, sourceIndex) => (
                <div key={sourceIndex} className="bg-white p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2">
                          {source.title}
                        </h4>
                        {getAuthorityBadge(source.authority)}
                      </div>

                      <p className="text-xs text-gray-600 line-clamp-3 mb-2">
                        {source.snippet}
                      </p>

                      {source.url && (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          <ExternalLink size={12} />
                          View Source
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  } else {
    // Handle basic web search results
    const sources = parseBasicWebResults(content);

    if (sources.length === 0) {
      return <MessageDisplay content={content} className={className} />;
    }

    return (
      <div className={`space-y-3 ${className}`}>
        {sources.map((source, index) => (
          <div key={index} className="bg-white p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2 mb-1">
                  {source.title}
                </h4>

                <p className="text-xs text-gray-600 line-clamp-3 mb-2">
                  {source.snippet}
                </p>

                {source.url && (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <ExternalLink size={12} />
                    View Source
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
};