// Chunking Service for splitting documents into smaller segments
// Preserves section boundaries and maintains context overlap

export interface Chunk {
  text: string;
  index: number;
  startOffset: number;
  endOffset: number;
  sectionTitle?: string;
}

export interface ChunkingOptions {
  maxChunkSize?: number;      // Target chunk size in characters (~1000 tokens ≈ 4000 chars)
  overlapSize?: number;       // Overlap between chunks for context continuity
  preserveSections?: boolean; // Try to preserve legal document section boundaries
}

const DEFAULT_OPTIONS: Required<ChunkingOptions> = {
  maxChunkSize: 4000,   // ~1000 tokens
  overlapSize: 800,     // ~200 tokens overlap
  preserveSections: true
};

// Patterns for detecting legal document sections
const SECTION_PATTERNS = [
  /^#{1,3}\s+(.+)/m,                                    // Markdown headers
  /^(ARTICLE\s+[IVXLCDM\d]+)[.:]\s*(.+)?/im,           // ARTICLE I, ARTICLE 1
  /^(SECTION\s+\d+(?:\.\d+)*)[.:]\s*(.+)?/im,          // SECTION 1, SECTION 1.1
  /^(PART\s+[IVXLCDM\d]+)[.:]\s*(.+)?/im,              // PART I, PART 1
  /^(CHAPTER\s+\d+)[.:]\s*(.+)?/im,                    // CHAPTER 1
  /^(SCHEDULE\s+[A-Z\d]+)[.:]\s*(.+)?/im,              // SCHEDULE A, SCHEDULE 1
  /^(EXHIBIT\s+[A-Z\d]+)[.:]\s*(.+)?/im,               // EXHIBIT A
  /^(ANNEX\s+[A-Z\d]+)[.:]\s*(.+)?/im,                 // ANNEX A
  /^(\d+(?:\.\d+)*)[.:]\s+([A-Z][^.]+)/m,              // 1. Title, 1.1 Subtitle
  /^([A-Z][A-Z\s]+)$/m,                                 // ALL CAPS HEADERS
];

export class ChunkingService {
  /**
   * Split text into chunks while preserving context
   */
  static chunkText(text: string, options?: ChunkingOptions): Chunk[] {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const chunks: Chunk[] = [];

    if (!text || text.length === 0) {
      return chunks;
    }

    // If text is small enough, return as single chunk
    if (text.length <= opts.maxChunkSize) {
      return [{
        text: text,
        index: 0,
        startOffset: 0,
        endOffset: text.length,
        sectionTitle: this.extractSectionTitle(text)
      }];
    }

    if (opts.preserveSections) {
      return this.chunkBySections(text, opts);
    }

    return this.chunkBySize(text, opts);
  }

  /**
   * Chunk text by detecting and preserving section boundaries
   */
  private static chunkBySections(text: string, opts: Required<ChunkingOptions>): Chunk[] {
    const chunks: Chunk[] = [];
    const sections = this.splitIntoSections(text);

    let currentChunk = '';
    let currentStartOffset = 0;
    let currentSectionTitle: string | undefined;

    for (const section of sections) {
      // If adding this section would exceed max size
      if (currentChunk.length + section.text.length > opts.maxChunkSize) {
        // Save current chunk if it has content
        if (currentChunk.length > 0) {
          chunks.push({
            text: currentChunk.trim(),
            index: chunks.length,
            startOffset: currentStartOffset,
            endOffset: currentStartOffset + currentChunk.length,
            sectionTitle: currentSectionTitle
          });
        }

        // If the section itself is too large, break it down
        if (section.text.length > opts.maxChunkSize) {
          const subChunks = this.chunkBySize(section.text, opts);
          for (const subChunk of subChunks) {
            chunks.push({
              ...subChunk,
              index: chunks.length,
              startOffset: section.startOffset + subChunk.startOffset,
              endOffset: section.startOffset + subChunk.endOffset,
              sectionTitle: section.title || currentSectionTitle
            });
          }
          currentChunk = '';
          currentStartOffset = section.startOffset + section.text.length;
          currentSectionTitle = undefined;
        } else {
          // Start new chunk with overlap from previous
          const overlap = this.getOverlapText(currentChunk, opts.overlapSize);
          currentChunk = overlap + section.text;
          currentStartOffset = section.startOffset - overlap.length;
          currentSectionTitle = section.title;
        }
      } else {
        // Add section to current chunk
        if (currentChunk.length === 0) {
          currentStartOffset = section.startOffset;
          currentSectionTitle = section.title;
        }
        currentChunk += section.text;
      }
    }

    // Don't forget the last chunk
    if (currentChunk.trim().length > 0) {
      chunks.push({
        text: currentChunk.trim(),
        index: chunks.length,
        startOffset: currentStartOffset,
        endOffset: currentStartOffset + currentChunk.length,
        sectionTitle: currentSectionTitle
      });
    }

    return chunks;
  }

  /**
   * Simple chunking by size with overlap
   */
  private static chunkBySize(text: string, opts: Required<ChunkingOptions>): Chunk[] {
    const chunks: Chunk[] = [];
    let startOffset = 0;

    while (startOffset < text.length) {
      let endOffset = Math.min(startOffset + opts.maxChunkSize, text.length);

      // Try to end at a sentence boundary
      if (endOffset < text.length) {
        const sentenceEnd = this.findSentenceEnd(text, startOffset, endOffset);
        if (sentenceEnd > startOffset + (opts.maxChunkSize * 0.5)) {
          endOffset = sentenceEnd;
        } else {
          // Fall back to paragraph or word boundary
          const paragraphEnd = this.findParagraphEnd(text, startOffset, endOffset);
          if (paragraphEnd > startOffset + (opts.maxChunkSize * 0.5)) {
            endOffset = paragraphEnd;
          } else {
            const wordEnd = this.findWordEnd(text, endOffset);
            if (wordEnd > startOffset) {
              endOffset = wordEnd;
            }
          }
        }
      }

      const chunkText = text.substring(startOffset, endOffset);
      chunks.push({
        text: chunkText.trim(),
        index: chunks.length,
        startOffset,
        endOffset,
        sectionTitle: this.extractSectionTitle(chunkText)
      });

      // Calculate next start with overlap
      startOffset = Math.max(startOffset + 1, endOffset - opts.overlapSize);

      // Make sure we're making progress
      if (startOffset >= text.length) break;
    }

    return chunks;
  }

  /**
   * Split text into logical sections based on headers
   */
  private static splitIntoSections(text: string): Array<{ text: string; title?: string; startOffset: number }> {
    const sections: Array<{ text: string; title?: string; startOffset: number }> = [];
    const lines = text.split('\n');

    let currentSection = { text: '', title: undefined as string | undefined, startOffset: 0 };
    let currentOffset = 0;

    for (const line of lines) {
      let isHeader = false;
      let headerTitle: string | undefined;

      // Check if line matches any section pattern
      for (const pattern of SECTION_PATTERNS) {
        const match = line.match(pattern);
        if (match) {
          isHeader = true;
          headerTitle = match[1] + (match[2] ? ` ${match[2]}` : '');
          break;
        }
      }

      if (isHeader && currentSection.text.trim().length > 0) {
        // Save current section and start new one
        sections.push({ ...currentSection, text: currentSection.text.trim() });
        currentSection = {
          text: line + '\n',
          title: headerTitle,
          startOffset: currentOffset
        };
      } else {
        if (currentSection.text.length === 0) {
          currentSection.startOffset = currentOffset;
          currentSection.title = headerTitle;
        }
        currentSection.text += line + '\n';
      }

      currentOffset += line.length + 1; // +1 for newline
    }

    // Don't forget the last section
    if (currentSection.text.trim().length > 0) {
      sections.push({ ...currentSection, text: currentSection.text.trim() });
    }

    return sections;
  }

  /**
   * Find the end of a sentence within the given range
   */
  private static findSentenceEnd(text: string, start: number, maxEnd: number): number {
    // Look for sentence endings (. ! ?) followed by space or end
    const searchText = text.substring(start, maxEnd);
    const sentenceEndPattern = /[.!?]\s+/g;
    let lastMatch = start;
    let match;

    while ((match = sentenceEndPattern.exec(searchText)) !== null) {
      lastMatch = start + match.index + match[0].length;
    }

    return lastMatch > start ? lastMatch : start;
  }

  /**
   * Find the end of a paragraph within the given range
   */
  private static findParagraphEnd(text: string, start: number, maxEnd: number): number {
    const searchText = text.substring(start, maxEnd);
    const paragraphEnd = searchText.lastIndexOf('\n\n');

    return paragraphEnd > 0 ? start + paragraphEnd + 2 : start;
  }

  /**
   * Find the end of a word at or before the given position
   */
  private static findWordEnd(text: string, position: number): number {
    if (position >= text.length) return text.length;

    // If we're already at a space, we're at a word boundary
    if (text[position] === ' ') return position;

    // Find the last space before position
    const textUpToPosition = text.substring(0, position);
    const lastSpace = textUpToPosition.lastIndexOf(' ');

    // Find the next space after position
    const nextSpace = text.indexOf(' ', position);

    // Return the closer boundary
    if (nextSpace !== -1 && nextSpace - position < position - lastSpace) {
      return nextSpace;
    }

    return lastSpace > 0 ? lastSpace + 1 : position;
  }

  /**
   * Get overlap text from the end of a chunk
   */
  private static getOverlapText(text: string, overlapSize: number): string {
    if (text.length <= overlapSize) return text;

    const overlap = text.substring(text.length - overlapSize);
    // Try to start at a word boundary
    const firstSpace = overlap.indexOf(' ');

    return firstSpace > 0 ? overlap.substring(firstSpace + 1) : overlap;
  }

  /**
   * Extract section title from chunk text
   */
  private static extractSectionTitle(text: string): string | undefined {
    const firstLine = text.split('\n')[0];

    for (const pattern of SECTION_PATTERNS) {
      const match = firstLine.match(pattern);
      if (match) {
        return match[1] + (match[2] ? ` ${match[2]}` : '');
      }
    }

    // If no pattern matched but first line is short and looks like a title
    if (firstLine.length < 100 && firstLine.length > 0) {
      const trimmed = firstLine.trim();
      // Check if it's ALL CAPS or Title Case
      if (trimmed === trimmed.toUpperCase() || /^[A-Z][a-z]/.test(trimmed)) {
        return trimmed;
      }
    }

    return undefined;
  }

  /**
   * Estimate token count for text (rough approximation)
   */
  static estimateTokenCount(text: string): number {
    // Rough estimate: ~4 characters per token for English
    return Math.ceil(text.length / 4);
  }

  /**
   * Get optimal chunk size based on model context
   */
  static getOptimalChunkSize(modelContextSize: number = 8192): number {
    // Use ~1/8 of model context for each chunk
    // This allows for multiple chunks + prompt + response
    return Math.floor(modelContextSize / 8) * 4; // Convert tokens to chars
  }
}
