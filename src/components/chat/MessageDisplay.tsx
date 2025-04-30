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
    <div className={`message-content prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom rendering for code blocks with syntax highlighting
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return  match ? (
            
              <SyntaxHighlighter
                language={match[1]}
                style={tomorrow}
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
          // Custom rendering for tables
          table({ node, children, ...props }) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="min-w-[50%] border-collapse" {...props}>
                  {children}
                </table>
              </div>
            );
          },
          // Custom styling for table headers
          th({ node, children, ...props }) {
            return (
              <th className="border px-4 py-2 text-left font-semibold bg-gray-50 dark:bg-gray-800" {...props}>
                {children}
              </th>
            );
          },
          // Custom styling for table cells
          td({ node, children, ...props }) {
            return (
              <td className="border px-4 py-2" {...props}>
                {children}
              </td>
            );
          },
          // Custom styling for table rows
          tr({ node, children, ...props }) {
            return (
              <tr className="border-b" {...props}>
                {children}
              </tr>
            );
          },
          // Link styling
          a({ node, children, ...props }) {
            return (
              <a className="text-blue-600 hover:underline" {...props}>
                {children}
              </a>
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