// src/components/chat/MessageDisplay.tsx
import React from 'react';

interface MessageDisplayProps {
  content: string;
  className?: string;
}

/**
 * Applies basic formatting to message text without using markdown libraries
 */
const MessageDisplay: React.FC<MessageDisplayProps> = ({ content, className = '' }) => {
  // Split content into blocks (paragraphs, code blocks, lists, etc.)
  const blocks = parseContentBlocks(content);
  
  return (
    <div className={`message-content ${className}`}>
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
};

/**
 * Identifies different content blocks in the message
 */
function parseContentBlocks(content: string): Array<{ type: string; content: string }> {
  const lines = content.split('\n');
  const blocks: Array<{ type: string; content: string }> = [];
  
  let currentBlock: { type: string; content: string } | null = null;
  let inCodeBlock = false;
  let codeLanguage = '';
  
  lines.forEach((line, index) => {
    // Check for code block markers
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        // Start of code block
        inCodeBlock = true;
        codeLanguage = line.slice(3).trim();
        currentBlock = { type: 'code', content: '' };
      } else {
        // End of code block
        inCodeBlock = false;
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = null;
      }
      return;
    }
    
    if (inCodeBlock) {
      // Inside code block
      if (currentBlock) currentBlock.content += (currentBlock.content ? '\n' : '') + line;
      return;
    }
    
    // Check for list items
    if (/^\s*[-•*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      if (!currentBlock || currentBlock.type !== 'list') {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = { type: 'list', content: line };
      } else {
        currentBlock.content += '\n' + line;
      }
      return;
    }
    
    // Check for headings
    if (/^#+\s+/.test(line)) {
      if (currentBlock) blocks.push(currentBlock);
      blocks.push({ type: 'heading', content: line });
      currentBlock = null;
      return;
    }
    
    // Empty line - potential paragraph break
    if (line.trim() === '') {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      return;
    }
    
    // Regular paragraph text
    if (!currentBlock || currentBlock.type !== 'paragraph') {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = { type: 'paragraph', content: line };
    } else {
      currentBlock.content += ' ' + line;
    }
  });
  
  // Add the final block if there is one
  if (currentBlock) blocks.push(currentBlock);
  
  return blocks;
}

/**
 * Renders a content block based on its type
 */
function renderBlock(block: { type: string; content: string }, index: number) {
  switch (block.type) {
    case 'code':
      return (
        <pre key={index} className="bg-gray-100 p-3 rounded my-2 overflow-x-auto">
          <code>{block.content}</code>
        </pre>
      );
    
    case 'list':
      return (
        <div key={index} className="my-2 pl-4">
          {block.content.split('\n').map((item, i) => {
            // Check if it's a bullet point or numbered item
            const isBullet = /^\s*[-•*]\s+/.test(item);
            const match = item.match(/^(\s*)([-•*]|\d+\.)\s+(.*)/);
            
            if (match) {
              const [, indent, marker, text] = match;
              
              return (
                <div key={i} className="flex">
                  <div style={{ width: '20px', marginRight: '5px' }}>
                    {isBullet ? '•' : marker}
                  </div>
                  <div>{text}</div>
                </div>
              );
            }
            
            return <div key={i}>{item}</div>;
          })}
        </div>
      );
    
    case 'heading':
      const level = (block.content.match(/^(#+)/) || ['#'])[0].length;
      const text = block.content.replace(/^#+\s+/, '');
      
      const headingClasses = [
        'font-bold mt-3 mb-1',
        level === 1 ? 'text-xl' : level === 2 ? 'text-lg' : 'text-base'
      ].join(' ');
      
      return (
        <div key={index} className={headingClasses}>
          {text}
        </div>
      );
    
    case 'paragraph':
    default:
      return <p key={index} className="my-2">{block.content}</p>;
  }
}

export default MessageDisplay;