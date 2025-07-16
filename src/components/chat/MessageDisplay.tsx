// src/components/chat/MessageDisplay.tsx
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  tomorrow,
  oneLight,
} from "react-syntax-highlighter/dist/cjs/styles/prism";

interface MessageDisplayProps {
  content: string;
  className?: string;
}

/**
 * Renders message content using react-markdown with enhanced typography
 */
const MessageDisplay: React.FC<MessageDisplayProps> = ({
  content,
  className = "",
}) => {
  return (
    <div
      className={`message-content prose prose-gray max-w-none ${className}`}
      style={{
        fontFamily: "inherit",
        fontSize: "inherit",
        lineHeight: "inherit",
        color: "inherit",
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Enhanced code blocks with better styling
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            return match ? (
              <div className="overflow-hidden rounded-lg my-4 border border-gray-200">
                <SyntaxHighlighter
                  language={match[1]}
                  style={oneLight}
                  PreTag="div"
                  className="!my-0 !bg-gray-50 text-sm overflow-x-auto"
                  customStyle={{
                    margin: 0,
                    borderRadius: 0,
                    fontSize: "14px",
                    lineHeight: "1.5",
                    padding: "16px",
                    fontFamily:
                      'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  }}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code
                className="bg-gray-100 px-1.5 py-0.5 rounded text-sm break-words font-mono"
                style={{
                  fontFamily:
                    'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  fontWeight: "normal",
                }}
                {...props}
              >
                {children}
              </code>
            );
          },

          // Enhanced table styling
          table({ node, children, ...props }) {
            return (
              <div className="overflow-x-auto my-6 border rounded-lg border-gray-200">
                <table
                  className="min-w-full border-collapse bg-white"
                  style={{ fontSize: "inherit" }}
                  {...props}
                >
                  {children}
                </table>
              </div>
            );
          },

          th({ node, children, ...props }) {
            return (
              <th
                className="border-b border-gray-300 px-4 py-3 text-left bg-gray-50 font-semibold text-sm"
                {...props}
              >
                {children}
              </th>
            );
          },

          td({ node, children, ...props }) {
            return (
              <td
                className="border-b border-gray-100 px-4 py-3 text-sm break-words"
                {...props}
              >
                {children}
              </td>
            );
          },

          // Enhanced headings with better spacing
          h1({ node, children, ...props }) {
            return (
              <h1
                className="text-2xl font-bold mt-8 mb-4 first:mt-0 break-words text-gray-900"
                {...props}
              >
                {children}
              </h1>
            );
          },

          h2({ node, children, ...props }) {
            return (
              <h2
                className="text-xl font-semibold mt-6 mb-3 first:mt-0 break-words text-gray-900"
                {...props}
              >
                {children}
              </h2>
            );
          },

          h3({ node, children, ...props }) {
            return (
              <h3
                className="text-lg font-semibold mt-5 mb-2 first:mt-0 break-words text-gray-900"
                {...props}
              >
                {children}
              </h3>
            );
          },

          h4({ node, children, ...props }) {
            return (
              <h4
                className="text-base font-semibold mt-4 mb-2 first:mt-0 break-words text-gray-900"
                {...props}
              >
                {children}
              </h4>
            );
          },

          // Enhanced paragraphs with better line height
          p({ node, children, ...props }) {
            return (
              <p
                className="mb-4 last:mb-0 break-words leading-7 text-gray-800"
                {...props}
              >
                {children}
              </p>
            );
          },

          // Enhanced lists with better spacing
          ul({ node, children, ...props }) {
            return (
              <ul
                className="mb-4 space-y-1 pl-6 break-words list-disc"
                style={{
                  listStylePosition: "outside",
                  paddingLeft: "1.5rem",
                }}
                {...props}
              >
                {children}
              </ul>
            );
          },

          ol({ node, children, ...props }) {
            return (
              <ol
                className="mb-4 space-y-1 pl-6 break-words list-decimal"
                style={{
                  listStylePosition: "outside",
                  paddingLeft: "1.5rem",
                }}
                {...props}
              >
                {children}
              </ol>
            );
          },

          li({ node, children, ...props }) {
            // Convert children to string to check for colon pattern
            const textContent = React.Children.toArray(children)
              .map((child) => (typeof child === "string" ? child : ""))
              .join("");

            // Check if the list item follows the "title: description" pattern
            const colonIndex = textContent.indexOf(":");
            if (colonIndex > 0 && colonIndex < textContent.length - 1) {
              const beforeColon = textContent.substring(0, colonIndex).trim();
              const afterColon = textContent.substring(colonIndex + 1).trim();

              return (
                <li
                  className="break-words mb-1 leading-6 text-gray-800"
                  {...props}
                >
                  <strong
                    style={{ fontWeight: "700" }}
                    className="text-black font-bold"
                  >
                    {beforeColon}
                  </strong>
                  : {afterColon}
                </li>
              );
            }

            return (
              <li
                className="break-words mb-1 leading-6 text-gray-800"
                {...props}
              >
                {children}
              </li>
            );
          },
          // Enhanced blockquotes
          blockquote({ node, children, ...props }) {
            return (
              <blockquote
                className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 rounded-r break-words italic text-gray-700"
                {...props}
              >
                {children}
              </blockquote>
            );
          },

          // Enhanced links
          a({ node, children, ...props }) {
            return (
              <a
                className="text-blue-600 hover:text-blue-800 hover:underline break-words font-medium"
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              >
                {children}
              </a>
            );
          },

          strong({ node, children, ...props }) {
            return (
              <strong
                className="break-words text-gray-900"
                style={{
                  fontWeight: "700 !important", // Force bold weight
                  color: "inherit",
                }}
                {...props}
              >
                {children}
              </strong>
            );
          },

          // Enhanced emphasis
          em({ node, children, ...props }) {
            return (
              <em className="break-words italic text-gray-700" {...props}>
                {children}
              </em>
            );
          },

          // Enhanced horizontal rules
          hr({ node, ...props }) {
            return <hr className="my-6 border-gray-300" {...props} />;
          },

          // Enhanced images
          img({ node, alt, src, ...props }) {
            return (
              <div className="my-4">
                <img
                  src={src}
                  alt={alt}
                  className="max-w-full h-auto rounded-lg border shadow-sm"
                  loading="lazy"
                  {...props}
                />
                {alt && (
                  <p className="text-xs text-gray-500 mt-2 text-center italic">
                    {alt}
                  </p>
                )}
              </div>
            );
          },

          // Enhanced preformatted text
          pre({ node, children, ...props }) {
            return (
              <pre
                className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap break-words my-4 border border-gray-200"
                style={{
                  fontFamily:
                    'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  fontWeight: "normal",
                }}
                {...props}
              >
                {children}
              </pre>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MessageDisplay;
