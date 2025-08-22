import { Delta } from 'quill/core';

/**
 * Convert HTML to Quill Delta format
 * This is a basic implementation - for production use, consider using quill-delta-from-html
 */
export function htmlToQuillDelta(html: string): Delta {
  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  const ops: any[] = [];
  
  function processNode(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (text) {
        ops.push({ insert: text });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();
      
      // Handle different HTML elements
      switch (tagName) {
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          const headerLevel = parseInt(tagName[1]);
          const headerText = element.textContent || '';
          if (headerText) {
            ops.push({ 
              insert: headerText,
              attributes: { header: headerLevel }
            });
            ops.push({ insert: '\n' });
          }
          break;
          
        case 'p':
          // Process paragraph content
          for (let child of Array.from(element.childNodes)) {
            processNode(child);
          }
          ops.push({ insert: '\n' });
          break;
          
        case 'strong':
        case 'b':
          const boldText = element.textContent || '';
          if (boldText) {
            ops.push({ 
              insert: boldText,
              attributes: { bold: true }
            });
          }
          break;
          
        case 'em':
        case 'i':
          const italicText = element.textContent || '';
          if (italicText) {
            ops.push({ 
              insert: italicText,
              attributes: { italic: true }
            });
          }
          break;
          
        case 'u':
          const underlineText = element.textContent || '';
          if (underlineText) {
            ops.push({ 
              insert: underlineText,
              attributes: { underline: true }
            });
          }
          break;
          
        case 'ul':
          // Process list items
          for (let child of Array.from(element.childNodes)) {
            if (child.nodeType === Node.ELEMENT_NODE && (child as Element).tagName.toLowerCase() === 'li') {
              const listText = child.textContent || '';
              if (listText) {
                ops.push({ 
                  insert: listText,
                  attributes: { list: 'bullet' }
                });
                ops.push({ insert: '\n' });
              }
            }
          }
          break;
          
        case 'ol':
          // Process ordered list items
          for (let child of Array.from(element.childNodes)) {
            if (child.nodeType === Node.ELEMENT_NODE && (child as Element).tagName.toLowerCase() === 'li') {
              const listText = child.textContent || '';
              if (listText) {
                ops.push({ 
                  insert: listText,
                  attributes: { list: 'ordered' }
                });
                ops.push({ insert: '\n' });
              }
            }
          }
          break;
          
        case 'br':
          ops.push({ insert: '\n' });
          break;
          
        case 'div':
          // Process div content
          for (let child of Array.from(element.childNodes)) {
            processNode(child);
          }
          ops.push({ insert: '\n' });
          break;
          
        default:
          // For other elements, just process their children
          for (let child of Array.from(element.childNodes)) {
            processNode(child);
          }
          break;
      }
    }
  }
  
  // Process all child nodes
  for (let child of Array.from(tempDiv.childNodes)) {
    processNode(child);
  }
  
  // Ensure we end with a newline if we have content
  if (ops.length > 0 && ops[ops.length - 1].insert !== '\n') {
    ops.push({ insert: '\n' });
  }
  
  return new Delta(ops);
}

/**
 * Convert Quill Delta to plain text
 */
export function deltaToPlainText(delta: Delta): string {
  if (!delta || !delta.ops) return '';
  
  return delta.ops
    .map((op: any) => {
      if (typeof op.insert === 'string') {
        return op.insert;
      }
      return '';
    })
    .join('')
    .replace(/\n+/g, ' ')
    .trim();
}

/**
 * Strip HTML tags and decode entities
 */
export function stripHtml(html: string): string {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
}