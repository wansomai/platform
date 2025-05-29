// src/components/chat/MessageDisplay.tsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface MessageDisplayProps {
  content: string;
  className?: string;
}

/**
 * Renders message content using react-markdown with GitHub Flavored Markdown support
 */
const MessageDisplay: React.FC<MessageDisplayProps> = ({ content, className = '' }) => {
  return (
    <div className={`message-content prose prose-sm max-w-none ${className}`} style={{ 
      fontFamily: 'inherit',
      fontSize: 'inherit',
      lineHeight: 'inherit',
      color: 'inherit'
    }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom rendering for code blocks with syntax highlighting
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return match ? (
              <div className="overflow-hidden rounded-md my-2">
                <SyntaxHighlighter
                  language={match[1]}
                  style={tomorrow}
                  PreTag="div"
                  className="!my-0 !bg-gray-900 !text-sm overflow-x-auto"
                  customStyle={{
                    margin: 0,
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    lineHeight: '1.25rem',
                    fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace'
                  }}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code 
                className="bg-gray-100 px-1 py-0.5 rounded text-sm break-words"
                style={{ 
                  fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
                  fontWeight: 'normal'
                }}
                {...props}
              >
                {children}
              </code>
            );
          },
          
          // Custom rendering for tables with overflow handling
          table({ node, children, ...props }) {
            return (
              <div className="overflow-x-auto my-4 border rounded-md">
                <table className="min-w-full border-collapse bg-white" style={{ fontSize: 'inherit' }} {...props}>
                  {children}
                </table>
              </div>
            );
          },
          
          // Custom styling for table headers
          th({ node, children, ...props }) {
            return (
              <th 
                className="border border-gray-300 px-4 py-2 text-left bg-gray-50 text-sm" 
                style={{ fontWeight: '600' }}
                {...props}
              >
                {children}
              </th>
            );
          },
          
          // Custom styling for table cells
          td({ node, children, ...props }) {
            return (
              <td className="border border-gray-300 px-4 py-2 text-sm break-words" {...props}>
                {children}
              </td>
            );
          },
          
          // Custom styling for table rows
          tr({ node, children, ...props }) {
            return (
              <tr className="border-b hover:bg-gray-50" {...props}>
                {children}
              </tr>
            );
          },
          
          // Link styling with word break
          a({ node, children, ...props }) {
            return (
              <a 
                className="text-blue-600 hover:text-blue-800 hover:underline break-words" 
                style={{ fontWeight: 'inherit' }}
                target="_blank" 
                rel="noopener noreferrer"
                {...props}
              >
                {children}
              </a>
            );
          },
          
          // Headings with proper spacing and sizes - Override global styles
          h1({ node, children, ...props }) {
            return (
              <h1 
                className="text-xl mt-6 mb-4 first:mt-0 break-words" 
                style={{ 
                  fontWeight: '700',
                  fontSize: '1.25rem',
                  lineHeight: '1.75rem',
                  color: 'inherit'
                }}
                {...props}
              >
                {children}
              </h1>
            );
          },
          
          h2({ node, children, ...props }) {
            return (
              <h2 
                className="text-lg mt-5 mb-3 first:mt-0 break-words" 
                style={{ 
                  fontWeight: '700',
                  fontSize: '1.125rem',
                  lineHeight: '1.75rem',
                  color: 'inherit'
                }}
                {...props}
              >
                {children}
              </h2>
            );
          },
          
          h3({ node, children, ...props }) {
            return (
              <h3 
                className="text-base mt-4 mb-2 first:mt-0 break-words" 
                style={{ 
                  fontWeight: '700',
                  fontSize: '1rem',
                  lineHeight: '1.5rem',
                  color: 'inherit'
                }}
                {...props}
              >
                {children}
              </h3>
            );
          },
          
          h4({ node, children, ...props }) {
            return (
              <h4 
                className="text-sm mt-3 mb-2 first:mt-0 break-words" 
                style={{ 
                  fontWeight: '700',
                  fontSize: '0.875rem',
                  lineHeight: '1.25rem',
                  color: 'inherit'
                }}
                {...props}
              >
                {children}
              </h4>
            );
          },
          
          // Paragraphs with word breaking
          p({ node, children, ...props }) {
            return (
              <p 
                className="mb-3 last:mb-0 break-words" 
                style={{ 
                  lineHeight: '1.6',
                  fontWeight: 'inherit',
                  color: 'inherit'
                }}
                {...props}
              >
                {children}
              </p>
            );
          },
          
          // Unordered lists
          ul({ node, children, ...props }) {
            return (
              <ul 
                className="mb-4 space-y-1 pl-4 break-words" 
                style={{ 
                  listStyleType: 'disc',
                  listStylePosition: 'outside',
                  paddingLeft: '1.5rem'
                }}
                {...props}
              >
                {children}
              </ul>
            );
          },
          
          // Ordered lists
          ol({ node, children, ...props }) {
            return (
              <ol 
                className="mb-4 space-y-1 pl-4 break-words" 
                style={{ 
                  listStyleType: 'decimal',
                  listStylePosition: 'outside',
                  paddingLeft: '1.5rem'
                }}
                {...props}
              >
                {children}
              </ol>
            );
          },
          
          // List items with auto-bold formatting for "title: description" pattern
          li({ node, children, ...props }) {
            // Convert children to string to check for colon pattern
            const textContent = React.Children.toArray(children)
              .map(child => typeof child === 'string' ? child : '')
              .join('');
            
            // Check if the list item follows the "title: description" pattern
            const colonIndex = textContent.indexOf(':');
            if (colonIndex > 0 && colonIndex < textContent.length - 1) {
              const beforeColon = textContent.substring(0, colonIndex).trim();
              const afterColon = textContent.substring(colonIndex + 1).trim();
              
              return (
                <li 
                  className="break-words mb-2" 
                  style={{ 
                    lineHeight: '1.6',
                    color: 'inherit'
                  }}
                  {...props}
                >
                  <strong style={{ fontWeight: '600' }}>{beforeColon}</strong>: {afterColon}
                </li>
              );
            }
            
            return (
              <li 
                className="break-words" 
                style={{ 
                  lineHeight: '1.6',
                  color: 'inherit'
                }}
                {...props}
              >
                {children}
              </li>
            );
          },
          
          // Blockquotes
          blockquote({ node, children, ...props }) {
            return (
              <blockquote 
                className="border-l-4 border-gray-300 pl-4 py-2 my-4 bg-gray-50 rounded-r break-words" 
                style={{ 
                  fontStyle: 'italic',
                  color: 'inherit'
                }}
                {...props}
              >
                {children}
              </blockquote>
            );
          },
          
          // Horizontal rules
          hr({ node, ...props }) {
            return (
              <hr className="my-6 border-gray-300" {...props} />
            );
          },
          
          // Strong/bold text - Force proper font weight
          strong({ node, children, ...props }) {
            return (
              <strong 
                className="break-words" 
                style={{ 
                  fontWeight: '600',
                  color: 'inherit'
                }}
                {...props}
              >
                {children}
              </strong>
            );
          },
          
          // Emphasis/italic text
          em({ node, children, ...props }) {
            return (
              <em 
                className="break-words" 
                style={{ 
                  fontStyle: 'italic',
                  color: 'inherit'
                }}
                {...props}
              >
                {children}
              </em>
            );
          },
          
          // Images with responsive handling
          img({ node, alt, src, ...props }) {
            return (
              <div className="my-4">
                <img 
                  src={src} 
                  alt={alt} 
                  className="max-w-full h-auto rounded-md border shadow-sm"
                  loading="lazy"
                  {...props} 
                />
                {alt && (
                  <p className="text-xs text-gray-500 mt-1 text-center italic">
                    {alt}
                  </p>
                )}
              </div>
            );
          },
          
          // Preformatted text blocks
          pre({ node, children, ...props }) {
            return (
              <pre 
                className="bg-gray-100 p-3 rounded-md overflow-x-auto text-sm whitespace-pre-wrap break-words my-3" 
                style={{ 
                  fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
                  fontWeight: 'normal'
                }}
                {...props}
              >
                {children}
              </pre>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MessageDisplay;