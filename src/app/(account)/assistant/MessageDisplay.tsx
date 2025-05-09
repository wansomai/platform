// src/components/chat/MessageDisplay.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { okaidia } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import remarkGfm from 'remark-gfm';

interface MessageDisplayProps {
  content: string;
  isLoading?: boolean;
  className?: string;
}

const MessageDisplay: React.FC<MessageDisplayProps> = ({ 
  content, 
  isLoading = false, 
  className 
}) => {
  const [processedContent, setProcessedContent] = useState(content);
  const contentRef = useRef(content);
  const lastUpdateRef = useRef(Date.now());
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Process the content to handle special cases and incomplete markdown
  const processContent = useCallback((text: string) => {
    // Handle incomplete code blocks (open ``` without close ```)
    let fixedContent = text;
    
    // Look for unmatched code blocks
    const codeBlockRegex = /```([a-z]*)\n([\s\S]*?)(?:```|$)/g;
    const codeBlockMatches = Array.from(text.matchAll(codeBlockRegex));
    
    for (const match of codeBlockMatches) {
      const [fullMatch, lang, codeContent] = match;
      if (!fullMatch.endsWith('```')) {
        // Add closing backticks if missing
        const fixedMatch = `\`\`\`${lang}\n${codeContent}\n\`\`\``;
        fixedContent = fixedContent.replace(fullMatch, fixedMatch);
      }
    }
    
    // Clean up intermediate processing indicators
    return fixedContent
      .replace(/\/\/ Running code\.\.\.\n/g, '')
      .replace(/Using tool: [a-z_]+\.\.\.\n/g, '');
  }, []);

  // Handle content updates with debouncing for streaming
  useEffect(() => {
    if (content !== contentRef.current) {
      contentRef.current = content;
      
      // For very short content or initial load, update immediately
      if (content.length < 100 || processedContent === '') {
        setProcessedContent(processContent(content));
        lastUpdateRef.current = Date.now();
        return;
      }
      
      // For streaming content, debounce updates to avoid excessive re-renders
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateRef.current;
      
      // Clear any pending timeout
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
      
      // If it's been a while since the last update, update immediately
      if (timeSinceLastUpdate > 500) {
        setProcessedContent(processContent(content));
        lastUpdateRef.current = now;
      } else {
        // Otherwise, debounce
        updateTimeoutRef.current = setTimeout(() => {
          setProcessedContent(processContent(content));
          lastUpdateRef.current = Date.now();
        }, 100);
      }
    }
    
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [content, processContent, processedContent]);
  
  // Return empty div if no content
  if (!processedContent.trim() && !isLoading) {
    return <div className={className}></div>;
  }

  return (
    <div className={`prose prose-sm max-w-none prose-pre:p-0 ${className}`}>
      {isLoading && (
        <div 
          className="h-4 w-2 inline-block ml-1 bg-current opacity-70 animate-blink"
          style={{ animation: 'blink 1s step-start infinite' }}
        />
      )}
      <style jsx global>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : 'javascript';
            
            return  match ? (
            
                <SyntaxHighlighter
                  language={match[1]}
                  style={okaidia}
                  PreTag="div"
                 
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          p({ children }) {
            return <p className="mb-2 last:mb-0">{children}</p>;
          },
          ul({ children }) {
            return <ul className="list-disc pl-6 mb-2 last:mb-0">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-6 mb-2 last:mb-0">{children}</ol>;
          },
          li({ children }) {
            return <li className="mb-1">{children}</li>;
          },
          h1({ children }) {
            return <h1 className="text-lg font-bold mb-2">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-base font-bold mb-2">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-sm font-bold mb-2">{children}</h3>;
          },
          a({ children, href }) {
            // Make sure legal citation links are properly handled
            const isLegalCitation = href && /^(https?:\/\/)?(www\.)?lexisnexis|westlaw|casetext|findlaw|justia|law\.cornell\.edu|scholarship\.law/i.test(href);
            
            return (
              <a 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`text-blue-600 hover:underline ${isLegalCitation ? 'font-medium' : ''}`}
              >
                {children}
              </a>
            );
          },
          blockquote({ children }) {
            // Check if this might be a legal citation
            const blockquoteText = Array.isArray(children) 
              ? children.map(child => typeof child === 'string' ? child : '').join('') 
              : '';
            
            const mightBeLegalCitation = /v\.|[A-Z]\.\s?[0-9]d|U\.S\.|F\.[0-9]d|S\.Ct\.|([A-Z][a-z]+\s)+v\.(\s[A-Z][a-z]+)+/g.test(blockquoteText);
            
            return (
              <blockquote className={`border-l-4 pl-4 mb-2 ${
                mightBeLegalCitation 
                  ? 'border-indigo-300 bg-indigo-50 py-1 text-indigo-900' 
                  : 'border-gray-300 italic text-gray-600'
              }`}>
                {children}
              </blockquote>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto mb-2">
                <table className="border-collapse table-auto w-full text-sm">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="border border-gray-300 px-3 py-1 bg-gray-100 font-medium text-left">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="border border-gray-300 px-3 py-1">
                {children}
              </td>
            );
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MessageDisplay;