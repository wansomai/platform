'use client';
// Guest-mode Lexical canvas editor.
// No auth, no DB saves. Watermarked. Export button triggers Paystack gate.
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Download,
  Bold, Italic, Underline, Strikethrough,
  List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Undo2, Redo2, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import DiffMatchPatch from 'diff-match-patch';

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import {
  $getRoot, $getSelection, $isRangeSelection, $createParagraphNode,
  FORMAT_TEXT_COMMAND, FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND, REDO_COMMAND,
  LexicalEditor, EditorState,
  $isElementNode, $isDecoratorNode, LexicalNode,
} from 'lexical';
import {
  INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND, $isListNode,
} from '@lexical/list';
import { $isHeadingNode, $createHeadingNode } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import { $getNearestNodeOfType } from '@lexical/utils';
import Link from 'next/link';
import Image from 'next/image';

// ─── Utilities ───────────────────────────────────────────────────────────────

function buildDiffHtml(originalHtml: string, suggestedHtml: string): string {
  const dmp = new DiffMatchPatch();
  const diffs = dmp.diff_main(originalHtml, suggestedHtml);
  dmp.diff_cleanupSemantic(diffs);
  let result = '';
  for (const [op, text] of diffs) {
    if (op === 0) result += text;
    else if (op === 1) result += `<ins style="background:#d4edda;color:#155724;text-decoration:none;">${text}</ins>`;
    else if (op === -1) result += `<del style="background:#f8d7da;color:#721c24;text-decoration:line-through;">${text}</del>`;
  }
  return result;
}

function wrapTopLevelNodes(nodes: LexicalNode[]): LexicalNode[] {
  return nodes.map((node) => {
    if ($isElementNode(node) || $isDecoratorNode(node)) return node;
    const p = $createParagraphNode();
    p.append(node);
    return p;
  });
}

const editorTheme = {
  paragraph: 'lexical-paragraph',
  heading: { h1: 'lexical-h1', h2: 'lexical-h2', h3: 'lexical-h3' },
  list: { ol: 'lexical-ol', ul: 'lexical-ul', listitem: 'lexical-li', nested: { listitem: 'lexical-nested-li' } },
  link: 'lexical-link',
  text: { bold: 'lexical-bold', italic: 'lexical-italic', underline: 'lexical-underline', strikethrough: 'lexical-strikethrough', code: 'lexical-code' },
  quote: 'lexical-quote',
};

// ─── Lexical Plugins ─────────────────────────────────────────────────────────

function EditorRefPlugin({ editorRef }: { editorRef: React.MutableRefObject<LexicalEditor | null> }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => { editorRef.current = editor; }, [editor, editorRef]);
  return null;
}

function LoadHtmlPlugin({ htmlContent }: { htmlContent: string | null }) {
  const [editor] = useLexicalComposerContext();
  const loadedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!htmlContent || loadedRef.current === htmlContent) return;
    loadedRef.current = htmlContent;
    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const parser = new DOMParser();
      const dom = parser.parseFromString(htmlContent, 'text/html');
      const nodes = $generateNodesFromDOM(editor, dom);
      if (nodes.length > 0) root.append(...wrapTopLevelNodes(nodes));
    });
  }, [htmlContent, editor]);

  return null;
}

const A4_HEIGHT_PX = 1123;
const PAGE_CONTENT_HEIGHT = A4_HEIGHT_PX - 96 - 96; // ~931px

function PageLayoutPlugin() {
  const [editor] = useLexicalComposerContext();
  const [pageBreaks, setPageBreaks] = useState<number[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    const calculate = () => {
      const pages = Math.max(1, Math.ceil(rootElement.scrollHeight / PAGE_CONTENT_HEIGHT));
      setTotalPages(pages);
      const breaks: number[] = [];
      for (let i = 1; i < pages; i++) breaks.push(i * PAGE_CONTENT_HEIGHT);
      setPageBreaks(breaks);
    };

    calculate();
    const observer = new ResizeObserver(calculate);
    observer.observe(rootElement);
    const unregister = editor.registerUpdateListener(() => requestAnimationFrame(calculate));
    return () => { observer.disconnect(); unregister(); };
  }, [editor]);

  return (
    <>
      {pageBreaks.map((top, i) => (
        <div key={i} className="page-break-indicator" style={{ top: `${top}px` }}>
          <div className="page-break-line" />
          <div className="page-number-label">Page {i + 1} of {totalPages}</div>
        </div>
      ))}
      <div className="page-footer-current">Page {totalPages} of {totalPages}</div>
    </>
  );
}

// Simplified toolbar (no colour pickers — keeps component lean)
function GuestToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [blockType, setBlockType] = useState('paragraph');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrike, setIsStrike] = useState(false);
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const blockMenuRef = useRef<HTMLDivElement>(null);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;
    setIsBold(selection.hasFormat('bold'));
    setIsItalic(selection.hasFormat('italic'));
    setIsUnderline(selection.hasFormat('underline'));
    setIsStrike(selection.hasFormat('strikethrough'));

    const anchorNode = selection.anchor.getNode();
    const element = anchorNode.getKey() === 'root'
      ? anchorNode
      : anchorNode.getTopLevelElementOrThrow();

    if ($isListNode(element)) {
      const parentList = $getNearestNodeOfType(anchorNode, ListNode);
      setBlockType(parentList ? parentList.getListType() : element.getListType());
    } else if ($isHeadingNode(element)) {
      setBlockType(element.getTag());
    } else {
      setBlockType('paragraph');
    }
  }, []);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(updateToolbar);
    });
  }, [editor, updateToolbar]);

  // Close block menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (blockMenuRef.current && !blockMenuRef.current.contains(e.target as Node)) {
        setShowBlockMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const setBlock = (type: 'paragraph' | 'h1' | 'h2' | 'h3') => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      if (type === 'paragraph') {
        $setBlocksType(selection, () => $createParagraphNode());
      } else {
        $setBlocksType(selection, () => $createHeadingNode(type));
      }
    });
    setShowBlockMenu(false);
  };

  const btnBase = 'p-1.5 rounded hover:bg-gray-100 text-gray-700';
  const btnActive = 'p-1.5 rounded bg-gray-200 text-gray-900 font-semibold';

  const BLOCK_LABELS: Record<string, string> = {
    paragraph: 'Paragraph', h1: 'Heading 1', h2: 'Heading 2', h3: 'Heading 3',
    bullet: 'Bullet List', number: 'Numbered List',
  };

  return (
    <div className="border-b border-gray-200 px-2 py-1 flex items-center flex-wrap gap-0.5 bg-white text-xs">
      {/* Block type */}
      <div className="relative" ref={blockMenuRef}>
        <button
          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 text-gray-700 min-w-[110px]"
          onClick={() => setShowBlockMenu(!showBlockMenu)}
        >
          <span>{BLOCK_LABELS[blockType] || 'Paragraph'}</span>
          <ChevronDown className="h-3 w-3 ml-auto" />
        </button>
        {showBlockMenu && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 min-w-[140px]">
            {(['paragraph', 'h1', 'h2', 'h3'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setBlock(t)}
                className="w-full text-left px-3 py-1.5 hover:bg-gray-100 text-gray-700"
              >
                {BLOCK_LABELS[t]}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      <button className={isBold ? btnActive : btnBase} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')} title="Bold"><Bold className="h-3.5 w-3.5" /></button>
      <button className={isItalic ? btnActive : btnBase} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')} title="Italic"><Italic className="h-3.5 w-3.5" /></button>
      <button className={isUnderline ? btnActive : btnBase} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')} title="Underline"><Underline className="h-3.5 w-3.5" /></button>
      <button className={isStrike ? btnActive : btnBase} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')} title="Strikethrough"><Strikethrough className="h-3.5 w-3.5" /></button>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      <button className={blockType === 'number' ? btnActive : btnBase} onClick={() => editor.dispatchCommand(blockType === 'number' ? REMOVE_LIST_COMMAND : INSERT_ORDERED_LIST_COMMAND, undefined)} title="Numbered list"><ListOrdered className="h-3.5 w-3.5" /></button>
      <button className={blockType === 'bullet' ? btnActive : btnBase} onClick={() => editor.dispatchCommand(blockType === 'bullet' ? REMOVE_LIST_COMMAND : INSERT_UNORDERED_LIST_COMMAND, undefined)} title="Bullet list"><List className="h-3.5 w-3.5" /></button>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      <button className={btnBase} onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')} title="Align left"><AlignLeft className="h-3.5 w-3.5" /></button>
      <button className={btnBase} onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')} title="Align centre"><AlignCenter className="h-3.5 w-3.5" /></button>
      <button className={btnBase} onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')} title="Align right"><AlignRight className="h-3.5 w-3.5" /></button>
      <button className={btnBase} onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify')} title="Justify"><AlignJustify className="h-3.5 w-3.5" /></button>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      <button className={btnBase} onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)} title="Undo"><Undo2 className="h-3.5 w-3.5" /></button>
      <button className={btnBase} onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)} title="Redo"><Redo2 className="h-3.5 w-3.5" /></button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface PendingSuggestion {
  originalHtml: string;
  suggestedHtml: string;
}

interface GuestCanvasInterfaceProps {
  documentHtml: string | null;        // Loaded into editor after generation completes
  streamingHtml: string | null;       // Live preview during generation
  isGenerating: boolean;
  isMasked?: boolean;                 // Blur/cover canvas — no template, illusion mode
  pendingSuggestion: PendingSuggestion | null;
  onEditorHtmlChange: (html: string) => void;
  onExportClick: () => void;          // Triggers Paystack modal in parent
  onAcceptSuggestion: (html: string) => void;
  onRejectSuggestion: () => void;
}

export default function GuestCanvasInterface({
  documentHtml,
  streamingHtml,
  isGenerating,
  isMasked = false,
  pendingSuggestion,
  onEditorHtmlChange,
  onExportClick,
  onAcceptSuggestion,
  onRejectSuggestion,
}: GuestCanvasInterfaceProps) {
  const editorRef = useRef<LexicalEditor | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Block all copy/cut/print/save paths so the preview cannot be scraped.
  useEffect(() => {
    // Block clipboard events anywhere in the canvas
    const preventClipboard = (e: ClipboardEvent) => {
      if (canvasContainerRef.current?.contains(e.target as Node)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Block keyboard shortcuts: Ctrl/Cmd + A, C, X, P, S
    const preventKeys = (e: KeyboardEvent) => {
      if (!canvasContainerRef.current?.contains(e.target as Node)) return;
      const key = e.key.toLowerCase();
      const isModifier = e.ctrlKey || e.metaKey;
      if (isModifier && ['a', 'c', 'x', 'p', 's'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Block browser print (Ctrl+P from anywhere on the page triggers print)
    const preventPrint = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('copy', preventClipboard, true);
    document.addEventListener('cut', preventClipboard, true);
    document.addEventListener('keydown', preventKeys, true);
    document.addEventListener('keydown', preventPrint, true);

    return () => {
      document.removeEventListener('copy', preventClipboard, true);
      document.removeEventListener('cut', preventClipboard, true);
      document.removeEventListener('keydown', preventKeys, true);
      document.removeEventListener('keydown', preventPrint, true);
    };
  }, []);

  const initialConfig = useMemo(() => ({
    namespace: 'GuestLegalCanvas',
    theme: editorTheme,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, AutoLinkNode],
    onError: (error: Error) => console.error('Lexical error:', error),
  }), []);

  const handleEditorChange = useCallback((editorState: EditorState) => {
    editorState.read(() => {
      if (editorRef.current) {
        const html = $generateHtmlFromNodes(editorRef.current);
        onEditorHtmlChange(html);
      }
    });
  }, [onEditorHtmlChange]);

  // Accept a chat-suggested edit: load the new HTML into the editor
  const handleAccept = useCallback(() => {
    if (!pendingSuggestion || !editorRef.current) return;
    const { suggestedHtml } = pendingSuggestion;
    editorRef.current.update(() => {
      const root = $getRoot();
      root.clear();
      const parser = new DOMParser();
      const dom = parser.parseFromString(suggestedHtml, 'text/html');
      const nodes = $generateNodesFromDOM(editorRef.current!, dom);
      if (nodes.length > 0) root.append(...wrapTopLevelNodes(nodes));
    });
    onAcceptSuggestion(suggestedHtml);
  }, [pendingSuggestion, onAcceptSuggestion]);

  const showOverlay = isGenerating || !!streamingHtml;
  const showDiff = !!pendingSuggestion && !showOverlay;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Action bar */}
      <div className="border-b border-gray-200 p-2 flex items-center justify-between bg-gray-50 flex-wrap gap-2">
        <div className="flex items-center gap-2">
            <Link href="/">
          <Image src={ `/logo-lg.png`} alt="wansom ai" width={140} height={40} className="w-auto h-10 object-contain" />
        </Link>
          {isGenerating && (
            <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs border border-green-200">
              <div className="flex gap-0.5">
                {[0, 150, 300].map((d) => (
                  <div key={d} className="w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
              <span>Preparing document…</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Accept / Reject suggestion buttons */}
          {showDiff && (
            <>
              <Button size="sm" variant="outline" onClick={onRejectSuggestion} className="text-xs h-8">
                Reject changes
              </Button>
              <Button size="sm" onClick={handleAccept} className="text-xs h-8 bg-green-600 hover:bg-green-700 text-white">
                Accept changes
              </Button>
            </>
          )}

          <Button
            size="sm"
            onClick={onExportClick}
            disabled={isGenerating}
            className="flex items-center gap-1.5 h-8 bg-green-600 hover:bg-green-700 text-white"
          >
            <Download className="h-3.5 w-3.5" />
            Export Document
          </Button>
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 relative flex flex-col overflow-hidden" ref={canvasContainerRef}>
        <LexicalComposer initialConfig={initialConfig}>
          {/* Toolbar hidden during generation */}
          {!isGenerating && <GuestToolbarPlugin />}

          {/* Streaming / diff overlay */}
          {(showOverlay || showDiff) && (
            <div
              className="flex-1 overflow-y-auto lexical-container"
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              onContextMenu={(e) => e.preventDefault()}
            >
              <div className="legal-page-wrapper">
                <div className="legal-page">
                  {isGenerating && !streamingHtml && !showDiff ? (
                    <div className="legal-page-content lexical-editor">
                      <div className="skeleton-title" />
                      <div className="skeleton-subtitle" />
                      <div className="skeleton-body-block">
                        {[100, 90, 95, 85, 100, 88, 92, 80, 97, 84, 100, 75, 91, 86, 94].map((w, i) => (
                          <div key={i} className="skeleton-line" style={{ width: `${w}%` }} />
                        ))}
                      </div>
                      <div className="skeleton-body-block">
                        <div className="skeleton-heading" style={{ width: '45%' }} />
                        {[98, 87, 93, 79, 100, 83, 96, 88].map((w, i) => (
                          <div key={i} className="skeleton-line" style={{ width: `${w}%` }} />
                        ))}
                      </div>
                      <div className="skeleton-body-block">
                        <div className="skeleton-heading" style={{ width: '38%' }} />
                        {[95, 82, 100, 77, 91, 86].map((w, i) => (
                          <div key={i} className="skeleton-line" style={{ width: `${w}%` }} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div
                      className="legal-page-content lexical-editor"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                      dangerouslySetInnerHTML={{
                        __html: showDiff
                          ? buildDiffHtml(pendingSuggestion!.originalHtml, pendingSuggestion!.suggestedHtml)
                          : streamingHtml || '',
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Real editable canvas — hidden (not unmounted) while overlay is visible */}
          <div
            className={`flex-1 overflow-y-auto lexical-container relative${showOverlay || showDiff ? ' hidden' : ''}`}
            onCopy={(e) => { e.preventDefault(); }}
            onCut={(e) => { e.preventDefault(); }}
            onContextMenu={(e) => { e.preventDefault(); }}
          >
            {/* Mask overlay for no-template illusion mode */}
            {isMasked && !isGenerating && (
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 10,
                  pointerEvents: 'none',
                  backdropFilter: 'blur(6px)',
                  WebkitBackdropFilter: 'blur(6px)',
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.55) 40%, rgba(255,255,255,0.92) 70%, rgba(255,255,255,1) 100%)',
                }}
              />
            )}
            <div className="legal-page-wrapper">
              <div className="legal-page">
                <div className="legal-page-content relative">
                  <RichTextPlugin
                    contentEditable={<ContentEditable className="lexical-editor outline-none" />}
                    ErrorBoundary={LexicalErrorBoundary}
                  />
                  <PageLayoutPlugin />

                  {/* Watermark — SVG tile repeated as a background image.
                      Reliable across all browsers; no complex DOM positioning needed. */}
                  {documentHtml && !isGenerating && (
                    <div
                      aria-hidden="true"
                      className="watermark-overlay"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <OnChangePlugin onChange={handleEditorChange} />
          <EditorRefPlugin editorRef={editorRef} />
          <LoadHtmlPlugin htmlContent={documentHtml} />
        </LexicalComposer>
      </div>

      {/* Legal Document Styles — identical to authenticated CanvasInterface */}
      <style jsx global>{`
        .lexical-container {
          background-color: #e5e7eb;
          scrollbar-width: thin;
          scrollbar-color: #c4c4c4 transparent;
        }
        .lexical-container::-webkit-scrollbar { width: 6px; }
        .lexical-container::-webkit-scrollbar-track { background: transparent; }
        .lexical-container::-webkit-scrollbar-thumb { background-color: #c4c4c4; border-radius: 3px; }

        .legal-page-wrapper {
          display: flex;
          justify-content: center;
          padding: 24px 16px;
          min-height: 100%;
        }

        .legal-page {
          width: 794px;
          max-width: 100%;
          background: #ffffff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08);
          border-radius: 2px;
        }

        .legal-page-content { position: relative; }

        .watermark-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          pointer-events: none;
          z-index: 10;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='160'%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' transform='rotate(-30 110 80)' font-family='Arial%2C sans-serif' font-size='13' font-weight='600' fill='rgba(0%2C0%2C0%2C0.13)' letter-spacing='3'%3EWANSOM AI%3C/text%3E%3C/svg%3E");
          background-repeat: repeat;
        }

        .lexical-editor {
          font-family: "Times New Roman", Times, Georgia, serif;
          font-size: 12pt;
          line-height: 1.5;
          color: #000000;
          padding: 96px 96px 96px 144px;
          min-height: 1123px;
        }

        .lexical-paragraph { margin: 0; padding: 2px 0; }

        .lexical-h1 {
          font-family: "Times New Roman", Times, Georgia, serif;
          font-size: 16pt; font-weight: 700;
          text-align: center; text-transform: uppercase;
          margin: 24pt 0 12pt 0; line-height: 1.5;
        }
        .lexical-h2 {
          font-family: "Times New Roman", Times, Georgia, serif;
          font-size: 14pt; font-weight: 700;
          margin: 18pt 0 6pt 0; line-height: 1.5;
        }
        .lexical-h3 {
          font-family: "Times New Roman", Times, Georgia, serif;
          font-size: 12pt; font-weight: 700;
          text-decoration: underline;
          margin: 12pt 0 6pt 0; line-height: 1.5;
        }

        .lexical-ol { list-style-type: decimal; padding-left: 36pt; margin: 6pt 0; }
        .lexical-ul { list-style-type: disc; padding-left: 36pt; margin: 6pt 0; }
        .lexical-li { margin: 2pt 0; line-height: 1.5; }
        .lexical-nested-li { list-style-type: none; }

        .lexical-link { color: #0000ee; text-decoration: underline; }
        .lexical-bold { font-weight: 700; }
        .lexical-italic { font-style: italic; }
        .lexical-underline { text-decoration: underline; }
        .lexical-strikethrough { text-decoration: line-through; }
        .lexical-code {
          background-color: #f3f4f6; color: #374151;
          padding: 1px 4px; border-radius: 2px;
          font-family: "Courier New", Courier, monospace; font-size: 11pt;
        }
        .lexical-quote {
          border-left: 3px solid #000; padding-left: 24pt;
          margin: 12pt 0 12pt 36pt; color: #000;
          font-style: italic; line-height: 1.5;
        }

        .page-break-indicator {
          position: absolute; left: 0; right: 0; height: 32px;
          z-index: 5; pointer-events: none; transform: translateY(-16px);
        }
        .page-break-line {
          position: absolute; top: 50%; left: 24px; right: 24px;
          height: 0; border-top: 1px dashed #9ca3af;
        }
        .page-number-label {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          background: #e5e7eb; color: #6b7280;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-size: 10px; padding: 2px 10px; border-radius: 8px;
          white-space: nowrap; user-select: none;
        }
        .page-footer-current {
          text-align: center; padding: 8px 0 16px;
          color: #9ca3af;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-size: 10px; user-select: none;
        }

        @keyframes shimmer {
          0% { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }
        .skeleton-title,
        .skeleton-subtitle,
        .skeleton-heading,
        .skeleton-line {
          border-radius: 4px;
          background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
          background-size: 600px 100%;
          animation: shimmer 1.4s ease-in-out infinite;
        }
        .skeleton-title { width: 55%; height: 22px; margin: 0 auto 14px; display: block; }
        .skeleton-subtitle { width: 38%; height: 16px; margin: 0 auto 8px; display: block; }
        .skeleton-body-block { margin-top: 28px; }
        .skeleton-heading { height: 18px; margin-bottom: 14px; }
        .skeleton-line { height: 13px; margin-bottom: 9px; }

        @media print {
          body * { display: none !important; }
          body::after {
            display: block !important;
            content: "This document is protected. Purchase and download the file at wansom.ai to get a clean copy.";
            font-family: Arial, sans-serif;
            font-size: 18px;
            text-align: center;
            margin-top: 40vh;
            color: #333;
          }
        }

        @media (max-width: 840px) {
          .legal-page-wrapper { padding: 12px 4px; }
          .legal-page { width: 100%; box-shadow: none; border-radius: 0; }
          .lexical-editor { padding: 16px; font-size: 11pt; min-height: 600px; }
        }
      `}</style>
    </div>
  );
}
