// src/components/chat/CanvasInterface.tsx
'use client';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
  Save,
  Download,
  FileText,
  RefreshCw,
  X,
  CheckCircle,
  FileDown,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Image as ImageIcon,
  Indent,
  Outdent,
  RemoveFormatting,
  Paintbrush,
  Type,
  ChevronDown
} from 'lucide-react';
import DiffMatchPatch from 'diff-match-patch';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/store/ui.store';
import { useCanvasDocument, useCanvasSaving, useCanvasStore } from '@/store/canvas.store';
import { useChatStore } from '@/store/chat.store';

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

// Lexical imports
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
  $isRangeSelection,
  $getSelection,
  $getRoot,
  $createParagraphNode,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  LexicalEditor,
  EditorState,
  $isElementNode,
  $isDecoratorNode,
  LexicalNode,
} from 'lexical';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
} from '@lexical/list';
import { $isHeadingNode, $createHeadingNode } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $getNearestNodeOfType } from '@lexical/utils';

// Lexical theme
const editorTheme = {
  paragraph: 'lexical-paragraph',
  heading: {
    h1: 'lexical-h1',
    h2: 'lexical-h2',
    h3: 'lexical-h3',
  },
  list: {
    ol: 'lexical-ol',
    ul: 'lexical-ul',
    listitem: 'lexical-li',
    nested: {
      listitem: 'lexical-nested-li',
    },
  },
  link: 'lexical-link',
  text: {
    bold: 'lexical-bold',
    italic: 'lexical-italic',
    underline: 'lexical-underline',
    strikethrough: 'lexical-strikethrough',
    code: 'lexical-code',
  },
  quote: 'lexical-quote',
};

// Wrap non-element/non-decorator nodes in paragraphs so they can be appended to root
function wrapTopLevelNodes(nodes: LexicalNode[]): LexicalNode[] {
  return nodes.map((node) => {
    if ($isElementNode(node) || $isDecoratorNode(node)) {
      return node;
    }
    const paragraph = $createParagraphNode();
    paragraph.append(node);
    return paragraph;
  });
}

// Plugin to expose editor ref
function EditorRefPlugin({ editorRef }: { editorRef: React.MutableRefObject<LexicalEditor | null> }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    editorRef.current = editor;
  }, [editor, editorRef]);
  return null;
}

// Plugin to load initial content
function LoadContentPlugin({
  canvasDocument,
  bypassLoadRef,
  isLoadingContentRef,
}: {
  canvasDocument: any;
  bypassLoadRef?: React.MutableRefObject<string | null>;
  isLoadingContentRef?: React.MutableRefObject<boolean>;
}) {
  const [editor] = useLexicalComposerContext();
  const loadedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!canvasDocument) {
      // Clear the editor when there is no canvas document (e.g. project has none,
      // or we just cleared state while switching projects).
      if (isLoadingContentRef) isLoadingContentRef.current = true;
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        root.append($createParagraphNode());
      }, { onUpdate: () => { if (isLoadingContentRef) isLoadingContentRef.current = false; } });
      loadedRef.current = null;
      return;
    }

    const docId = canvasDocument.id + '_' + canvasDocument.updatedAt;
    if (loadedRef.current === docId) return;

    // If this canvasDocument update was caused by our own save, skip the reload
    // to avoid resetting the cursor/selection while the user is still editing.
    // Safety check: only bypass if the editor actually has content — if the editor
    // is empty (fresh mount after a tab switch) we must load regardless.
    if (bypassLoadRef?.current === docId) {
      const rootIsEmpty = editor.getEditorState().read(() => $getRoot().isEmpty());
      if (!rootIsEmpty) {
        loadedRef.current = docId; // mark as loaded so future checks still work
        return;
      }
      // Editor is empty despite the bypass — fall through and load content.
    }

    const content = canvasDocument.content;

    // If content is Lexical JSON format (has root property), use setEditorState
    // (must be called outside editor.update())
    if (content && content.root) {
      try {
        if (isLoadingContentRef) isLoadingContentRef.current = true;
        const editorState = editor.parseEditorState(JSON.stringify(content));
        editor.setEditorState(editorState);
        loadedRef.current = docId;
        // Clear after a tick — Lexical fires OnChangePlugin listeners synchronously
        // during setEditorState, so we must keep isLoadingContentRef=true until after
        // those listeners run to prevent a phantom hasPendingChanges flag.
        setTimeout(() => { if (isLoadingContentRef) isLoadingContentRef.current = false; }, 0);
        return;
      } catch {
        if (isLoadingContentRef) isLoadingContentRef.current = false;
        // Fall through to HTML loading
      }
    }

    // Fall back to loading from htmlContent (w "Open in Editor")
    if (canvasDocument.htmlContent) {
      if (isLoadingContentRef) isLoadingContentRef.current = true;
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        const parser = new DOMParser();
        const dom = parser.parseFromString(canvasDocument.htmlContent, 'text/html');
        const nodes = $generateNodesFromDOM(editor, dom);
        if (nodes.length > 0) {
          root.append(...wrapTopLevelNodes(nodes));
        }
      }, { onUpdate: () => { if (isLoadingContentRef) isLoadingContentRef.current = false; } });
      loadedRef.current = docId;
    }
  }, [canvasDocument, editor]);

  return null;
}

// A4 page dimensions at 96 DPI
const A4_WIDTH_PX = 794; // 210mm
const A4_HEIGHT_PX = 1123; // 297mm
const PAGE_MARGIN_TOP = 96; // 1 inch
const PAGE_MARGIN_BOTTOM = 96; // 1 inch
const PAGE_CONTENT_HEIGHT = A4_HEIGHT_PX - PAGE_MARGIN_TOP - PAGE_MARGIN_BOTTOM; // ~931px

// Page break overlay plugin — renders visual page separators and page numbers
function PageLayoutPlugin() {
  const [editor] = useLexicalComposerContext();
  const [pageBreaks, setPageBreaks] = useState<number[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    const calculatePages = () => {
      const scrollHeight = rootElement.scrollHeight;
      const pages = Math.max(1, Math.ceil(scrollHeight / PAGE_CONTENT_HEIGHT));
      setTotalPages(pages);

      const breaks: number[] = [];
      for (let i = 1; i < pages; i++) {
        breaks.push(i * PAGE_CONTENT_HEIGHT);
      }
      setPageBreaks(breaks);
    };

    calculatePages();

    const observer = new ResizeObserver(calculatePages);
    observer.observe(rootElement);

    const removeListener = editor.registerUpdateListener(() => {
      requestAnimationFrame(calculatePages);
    });

    return () => {
      observer.disconnect();
      removeListener();
    };
  }, [editor]);

  return (
    <>
      {/* Page break lines */}
      {pageBreaks.map((top, index) => (
        <div
          key={index}
          className="page-break-indicator"
          style={{ top: `${top}px` }}
        >
          <div className="page-break-line" />
          <div className="page-number-label">
            Page {index + 1} of {totalPages}
          </div>
        </div>
      ))}
      {/* Current page footer */}
      <div className="page-footer-current">
        Page {totalPages} of {totalPages}
      </div>
    </>
  );
}

// Toolbar Plugin
function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [blockType, setBlockType] = useState('paragraph');
  const [isLink, setIsLink] = useState(false);
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const headingMenuRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const bgColorPickerRef = useRef<HTMLDivElement>(null);

  const colors = ['#000000', '#e60000', '#ff9900', '#ffff00', '#008a00', '#0066cc', '#9933ff', '#ffffff', '#facccc', '#ffebcc', '#ffffcc', '#cce8cc', '#cce0f5', '#ebd6ff', '#bbbbbb', '#f06666', '#ffc266', '#ffff66', '#66b966', '#66a3e0', '#c285ff', '#888888', '#a10000', '#b26b00', '#b2b200', '#006100', '#0047b2', '#6b24b2', '#444444'];

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headingMenuRef.current && !headingMenuRef.current.contains(e.target as Node)) {
        setShowHeadingMenu(false);
      }
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
      if (bgColorPickerRef.current && !bgColorPickerRef.current.contains(e.target as Node)) {
        setShowBgColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));

      const anchorNode = selection.anchor.getNode();
      const element = anchorNode.getKey() === 'root'
        ? anchorNode
        : anchorNode.getTopLevelElementOrThrow();

      if ($isHeadingNode(element)) {
        setBlockType(element.getTag());
      } else if ($isListNode(element)) {
        const parentList = $getNearestNodeOfType(anchorNode, ListNode);
        setBlockType(parentList ? parentList.getListType() : 'paragraph');
      } else {
        setBlockType('paragraph');
      }

      // Check for link
      const node = selection.anchor.getNode();
      const parent = node.getParent();
      setIsLink($isLinkNode(parent) || $isLinkNode(node));
    }
  }, []);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  const formatHeading = (headingTag: 'h1' | 'h2' | 'h3' | 'paragraph') => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        if (headingTag === 'paragraph') {
          $setBlocksType(selection, () => $createParagraphNode());
        } else {
          $setBlocksType(selection, () => $createHeadingNode(headingTag));
        }
      }
    });
    setShowHeadingMenu(false);
  };

  const insertLink = () => {
    if (isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    } else {
      const url = prompt('Enter URL:');
      if (url) {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
      }
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          // Insert image as HTML
          const parser = new DOMParser();
          const dom = parser.parseFromString(`<img src="${url}" alt="image" style="max-width:100%"/>`, 'text/html');
          const nodes = $generateNodesFromDOM(editor, dom);
          selection.insertNodes(nodes);
        }
      });
    }
  };

  const clearFormatting = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.getNodes().forEach((node) => {
          if ($isElementNode(node)) {
            // Reset block type to paragraph
          }
        });
        // Clear text formats
        (['bold', 'italic', 'underline', 'strikethrough', 'code'] as const).forEach((format) => {
          if (selection.hasFormat(format)) {
            selection.toggleFormat(format);
          }
        });
      }
    });
  };

  const applyColor = (color: string, type: 'color' | 'background') => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const style = type === 'color' ? `color: ${color}` : `background-color: ${color}`;
        selection.getNodes().forEach((node) => {
          // Lexical handles inline styles through format; for color we use CSS classes
          // This is a simplified approach - for production, you'd use a custom node
        });
      }
    });
    if (type === 'color') setShowColorPicker(false);
    else setShowBgColorPicker(false);
  };

  const headingLabel = blockType === 'h1' ? 'Heading 1' : blockType === 'h2' ? 'Heading 2' : blockType === 'h3' ? 'Heading 3' : 'Normal';

  const btnClass = (active: boolean) =>
    `p-1.5 rounded transition-colors ${active ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-700'}`;

  return (
    <div className="border-b border-gray-200 bg-white px-2 py-1.5 flex items-center gap-0.5 flex-wrap overflow-visible relative z-10">
      {/* Heading selector */}
      <div className="relative" ref={headingMenuRef}>
        <button
          onClick={() => setShowHeadingMenu(!showHeadingMenu)}
          className="flex items-center gap-1 px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50 min-w-[90px]"
        >
          <Type className="h-3.5 w-3.5" />
          <span>{headingLabel}</span>
          <ChevronDown className="h-3 w-3 ml-auto" />
        </button>
        {showHeadingMenu && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 min-w-[120px]">
            <button onClick={() => formatHeading('paragraph')} className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100">Normal</button>
            <button onClick={() => formatHeading('h1')} className="block w-full text-left px-3 py-1.5 text-lg font-bold hover:bg-gray-100">Heading 1</button>
            <button onClick={() => formatHeading('h2')} className="block w-full text-left px-3 py-1.5 text-base font-semibold hover:bg-gray-100">Heading 2</button>
            <button onClick={() => formatHeading('h3')} className="block w-full text-left px-3 py-1.5 text-sm font-semibold hover:bg-gray-100">Heading 3</button>
          </div>
        )}
      </div>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      {/* Text formatting */}
      <button className={btnClass(isBold)} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')} title="Bold">
        <Bold className="h-3.5 w-3.5" />
      </button>
      <button className={btnClass(isItalic)} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')} title="Italic">
        <Italic className="h-3.5 w-3.5" />
      </button>
      <button className={btnClass(isUnderline)} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')} title="Underline">
        <Underline className="h-3.5 w-3.5" />
      </button>
      <button className={btnClass(isStrikethrough)} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')} title="Strikethrough">
        <Strikethrough className="h-3.5 w-3.5" />
      </button>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      {/* Color pickers */}
      <div className="relative" ref={colorPickerRef}>
        <button className="p-1.5 rounded hover:bg-gray-100 text-gray-700" onClick={() => setShowColorPicker(!showColorPicker)} title="Text Color">
          <Type className="h-3.5 w-3.5" />
          <div className="h-0.5 w-3.5 bg-red-500 mt-px" />
        </button>
        {showColorPicker && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 p-2 grid grid-cols-7 gap-1 w-[180px]">
            {colors.map((color) => (
              <button key={color} onClick={() => applyColor(color, 'color')} className="w-5 h-5 rounded border border-gray-200" style={{ backgroundColor: color }} />
            ))}
          </div>
        )}
      </div>
      <div className="relative" ref={bgColorPickerRef}>
        <button className="p-1.5 rounded hover:bg-gray-100 text-gray-700" onClick={() => setShowBgColorPicker(!showBgColorPicker)} title="Background Color">
          <Paintbrush className="h-3.5 w-3.5" />
        </button>
        {showBgColorPicker && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 p-2 grid grid-cols-7 gap-1 w-[180px]">
            {colors.map((color) => (
              <button key={color} onClick={() => applyColor(color, 'background')} className="w-5 h-5 rounded border border-gray-200" style={{ backgroundColor: color }} />
            ))}
          </div>
        )}
      </div>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      {/* Lists */}
      <button
        className={btnClass(blockType === 'number')}
        onClick={() => editor.dispatchCommand(blockType === 'number' ? REMOVE_LIST_COMMAND : INSERT_ORDERED_LIST_COMMAND, undefined)}
        title="Ordered List"
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </button>
      <button
        className={btnClass(blockType === 'bullet')}
        onClick={() => editor.dispatchCommand(blockType === 'bullet' ? REMOVE_LIST_COMMAND : INSERT_UNORDERED_LIST_COMMAND, undefined)}
        title="Bullet List"
      >
        <List className="h-3.5 w-3.5" />
      </button>

      {/* Indent/Outdent */}
      <button className="p-1.5 rounded hover:bg-gray-100 text-gray-700" onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'indent' as any)} title="Indent">
        <Indent className="h-3.5 w-3.5" />
      </button>
      <button className="p-1.5 rounded hover:bg-gray-100 text-gray-700" onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'outdent' as any)} title="Outdent">
        <Outdent className="h-3.5 w-3.5" />
      </button>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      {/* Alignment */}
      <button className="p-1.5 rounded hover:bg-gray-100 text-gray-700" onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')} title="Align Left">
        <AlignLeft className="h-3.5 w-3.5" />
      </button>
      <button className="p-1.5 rounded hover:bg-gray-100 text-gray-700" onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')} title="Align Center">
        <AlignCenter className="h-3.5 w-3.5" />
      </button>
      <button className="p-1.5 rounded hover:bg-gray-100 text-gray-700" onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')} title="Align Right">
        <AlignRight className="h-3.5 w-3.5" />
      </button>
      <button className="p-1.5 rounded hover:bg-gray-100 text-gray-700" onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify')} title="Justify">
        <AlignJustify className="h-3.5 w-3.5" />
      </button>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      {/* Link & Image */}
      <button className={btnClass(isLink)} onClick={insertLink} title="Link">
        <LinkIcon className="h-3.5 w-3.5" />
      </button>
      <button className="p-1.5 rounded hover:bg-gray-100 text-gray-700" onClick={insertImage} title="Image">
        <ImageIcon className="h-3.5 w-3.5" />
      </button>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      {/* Clear formatting */}
      <button className="p-1.5 rounded hover:bg-gray-100 text-gray-700" onClick={clearFormatting} title="Clear Formatting">
        <RemoveFormatting className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

const LegalCanvas: React.FC = () => {
  const params = useParams();
  const projectId = params.id as string;

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'pending' | 'saving' | 'saved'>('idle');
  const [canvasStreamingStatus, setCanvasStreamingStatus] = useState<{
    show: boolean;
    status: string;
    message?: string;
    actionType?: string;
  }>({ show: false, status: '' });
  const [streamingPreviewHtml, setStreamingPreviewHtml] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<LexicalEditor | null>(null);

  // Stable refs so event listeners always call the latest handler versions
  const acceptHandlerRef = useRef<() => void>(() => {});
  const rejectHandlerRef = useRef<() => void>(() => {});

  // Tracks whether there are changes not yet flushed to the DB.
  // Using a ref (not state) so the unmount cleanup can read the latest value
  // without a stale closure, and without adding it to effect dependency arrays.
  const hasPendingChangesRef = useRef(false);

  // Always-current reference to autoSave so interval/unmount callbacks stay fresh.
  const autoSaveRef = useRef<() => Promise<void>>(async () => {});

  // Stores the latest HTML content from the editor so it can be saved when switching
  // to a different document (before activeCanvasId changes causes the editor to remount).
  const lastHtmlRef = useRef<string>('');

  // bypassLoadRef: after a local save we store the resulting docId here so that
  // LoadContentPlugin can skip the redundant reload triggered by the store update.
  const bypassLoadRef = useRef<string | null>(null);

  // isLoadingContentRef: true while LoadContentPlugin is programmatically writing
  // content into the editor (initial load, doc switch, etc.).  handleEditorChange
  // checks this flag and skips marking changes as pending while it is set, which
  // prevents the auto-save race condition where an empty initial editor state
  // triggers a save that overwrites the newly-loaded document content.
  const isLoadingContentRef = useRef(false);



  // Use store hooks for canvas data management
  const { addToast } = useUIStore();
  const { canvasDocument, canvasDocuments, activeCanvasId, isLoading, error, fetchCanvasDocuments, refreshCanvasDocument } = useCanvasDocument();
  const { isSaving, saveCanvasDocument, deleteCanvasDocument, createCanvasDocument } = useCanvasSaving();
  const saveDocumentById = useCanvasStore(state => state.saveDocumentById);
  const setCanvasDocument = useCanvasStore(state => state.setCanvasDocument);
  const setActiveCanvasId = useCanvasStore(state => state.setActiveCanvasId);
  const resetForProject = useCanvasStore(state => state.resetForProject);
  const setCurrentEditorHtml = useCanvasStore(state => state.setCurrentEditorHtml);
  const renameCanvasDocument = useCanvasStore(state => state.renameCanvasDocument);
  const { currentConversation } = useChatStore();

  // Rename-in-place state for the active document tab
  const [renamingDocId, setRenamingDocId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const pendingSuggestion = useCanvasStore(state => state.pendingSuggestion);
  const setPendingSuggestion = useCanvasStore(state => state.setPendingSuggestion);
  const clearPendingSuggestion = useCanvasStore(state => state.clearPendingSuggestion);

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      addToast({ message: error, type: 'error' });
    }
  }, [error, addToast]);

  // Warn the user before closing the tab/window when there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (autoSaveStatus === 'pending' || autoSaveStatus === 'saving') {
        e.preventDefault();
        // Modern browsers ignore the custom message but still show a generic dialog
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [autoSaveStatus]);

  // Safety-net: save every 30 s if there are pending changes.
  // Covers cases where the user never moves focus out of the editor (e.g. writes
  // continuously for minutes without clicking the chat input).
  useEffect(() => {
    const interval = setInterval(() => {
      if (hasPendingChangesRef.current) {
        autoSaveRef.current();
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, []); // stable — reads from refs only

  // Save on component unmount (SPA navigation away from canvas view).
  // fire-and-forget: we can't await in a cleanup, but the request will still
  // complete in the background as long as the browser tab stays open.
  useEffect(() => {
    return () => {
      if (hasPendingChangesRef.current) {
        autoSaveRef.current();
      }
    };
  }, []); // stable — reads from refs only


  // Monitor chat messages for canvas streaming status
  useEffect(() => {
    if (!currentConversation?.messages) return;

    const streamingMessage = currentConversation.messages
      .filter(msg => msg.isStreaming && msg.role === 'assistant')
      .pop();

    if (streamingMessage?.processingStatus) {
      const isCanvasStatus = [
        'analyzing_request',
        'processing_context',
        'generating_document',
        'editing_document',
        'saving_document',
        'completed',
        'error'
      ].includes(streamingMessage.processingStatus);

      if (isCanvasStatus) {
        setCanvasStreamingStatus({
          show: streamingMessage.processingStatus !== 'completed',
          status: streamingMessage.processingStatus,
          message: streamingMessage.canvasMessage,
          actionType: streamingMessage.actionType
        });

        if (streamingMessage.processingStatus === 'completed') {
          setTimeout(() => {
            setCanvasStreamingStatus(prev => ({ ...prev, show: false }));
          }, 2000);
        }
      }
    } else {
      setCanvasStreamingStatus(prev => ({ ...prev, show: false }));
    }
  }, [currentConversation?.messages]);

  // Lexical editor config — memoized to prevent editor reset on re-renders
  const initialConfig = useMemo(() => ({
    namespace: 'LegalCanvas',
    theme: editorTheme,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, AutoLinkNode],
    onError: (error: Error) => {
      console.error('Lexical error:', error);
    },
  }), []);

  // Silently persist the current editor state (used by auto-save, blur, and unmount)
  const autoSave = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) return;
    // No active document — skip. saveCanvasDocument would return null anyway, but
    // guard here too so we don't even read the editor state needlessly.
    if (!useCanvasStore.getState().activeCanvasId) return;

    setAutoSaveStatus('saving');
    try {
      let htmlContent = '';
      let plainText = '';
      editor.getEditorState().read(() => {
        htmlContent = $generateHtmlFromNodes(editor);
        plainText = $getRoot().getTextContent();
      });
      const content = editor.getEditorState().toJSON();

      const savedDoc = await saveCanvasDocument(projectId, content, htmlContent, plainText);
      if (savedDoc) {
        // Tell LoadContentPlugin to skip the reload triggered by this store update
        bypassLoadRef.current = savedDoc.id + '_' + savedDoc.updatedAt;
        hasPendingChangesRef.current = false;
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      }
      // If savedDoc is null (no activeCanvasId), leave status as 'pending' — nothing was saved.
    } catch {
      // Auto-save failed — revert to 'pending' so the user sees unsaved-changes
      // indicator and can trigger a manual save if needed
      setAutoSaveStatus('pending');
    }
  }, [saveCanvasDocument, projectId]);

  // Keep autoSaveRef current so interval/unmount callbacks never use a stale closure
  useEffect(() => { autoSaveRef.current = autoSave; }, [autoSave]);

  // Handle manual save
  const handleSave = async () => {
    const editor = editorRef.current;
    if (!editor) return;

    try {
      let htmlContent = '';
      let plainText = '';
      let content: any = null;

      editor.getEditorState().read(() => {
        htmlContent = $generateHtmlFromNodes(editor);
        plainText = $getRoot().getTextContent();
      });
      content = editor.getEditorState().toJSON();

      const result = await saveCanvasDocument(projectId, content, htmlContent, plainText);

      if (result) {
        bypassLoadRef.current = result.id + '_' + result.updatedAt;
        hasPendingChangesRef.current = false;
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
        addToast({ message: 'Document saved successfully', type: 'success' });
      } else {
        addToast({ message: 'Failed to save document', type: 'error' });
      }
    } catch (error) {
      addToast({ message: 'Failed to save document', type: 'error' });
    }
  };

  // Handle content changes — sync live HTML to canvas store for AI editing
  // and mark the document as having unsaved changes.
  // Auto-save fires on blur (when the user moves focus out of the editor area),
  // on a 30-second safety interval, and on component unmount.
  const handleEditorChange = useCallback((editorState: EditorState) => {
    editorState.read(() => {
      if (editorRef.current) {
        const html = $generateHtmlFromNodes(editorRef.current);
        setCurrentEditorHtml(html);
        // Track latest HTML in a ref so we can save it when switching documents.
        // Only update when NOT loading content to avoid storing transitional empty state.
        if (!isLoadingContentRef.current) {
          lastHtmlRef.current = html;
        }
      }
    });
    // Skip marking changes as pending while the plugin is programmatically loading
    // content (initial mount, document switch).  Without this guard, Lexical's
    // OnChangePlugin fires immediately after editor.update()/setEditorState() with
    // empty or transitional content, causing auto-save to overwrite the real document
    // content before it has been fetched from the DB.
    if (!isLoadingContentRef.current) {
      hasPendingChangesRef.current = true;
      setAutoSaveStatus('pending');
    }
  }, [setCurrentEditorHtml]);


  // Handle Word document export
  const handleExportWord = async () => {
    try {
      // Get current HTML from editor
      let htmlContent = canvasDocument?.htmlContent || '';
      const editor = editorRef.current;
      if (editor) {
        editor.getEditorState().read(() => {
          htmlContent = $generateHtmlFromNodes(editor);
        });
      }

      if (!htmlContent) {
        addToast({ message: 'No document content to export', type: 'error' });
        return;
      }

      const htmlDocx = await import('html-docx-js/dist/html-docx');

      let cleanHtml = htmlContent
        .replace(/^/, `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Legal Document</title>
<style>
  @page { size: A4; margin: 1in 1in 1in 1.5in; }
  body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.5; color: #000; margin: 0; }
  h1 { font-size: 16pt; font-weight: bold; text-align: center; text-transform: uppercase; margin: 24pt 0 12pt; }
  h2 { font-size: 14pt; font-weight: bold; margin: 18pt 0 6pt; }
  h3 { font-size: 12pt; font-weight: bold; text-decoration: underline; margin: 12pt 0 6pt; }
  p { margin: 0; padding: 2px 0; }
  ol { padding-left: 36pt; }
  ul { padding-left: 36pt; }
  blockquote { border-left: 3px solid #000; padding-left: 24pt; margin: 12pt 0 12pt 36pt; font-style: italic; }
</style>
</head><body>`)
        .replace(/$/, '</body></html>')
        .replace(/class="lexical-[^"]*"/g, '');

      const docx = htmlDocx.asBlob(cleanHtml);

      const element = document.createElement('a');
      element.href = URL.createObjectURL(docx);
      element.download = `legal_document_${new Date().getTime()}.docx`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      addToast({ message: 'Word document exported successfully', type: 'success' });
    } catch (error) {
      addToast({ message: 'Failed to export Word document', type: 'error' });
    }
  };

  // Accept suggestion: load suggested HTML into Lexical and save to DB
  // Reads pendingSuggestion from store directly to avoid stale closure issues
  const handleAcceptSuggestion = async () => {
    try {
      const suggestion = useCanvasStore.getState().pendingSuggestion;
      if (!suggestion) {
        addToast({ message: 'No pending suggestion found', type: 'error' });
        return;
      }
      if (!editorRef.current) {
        addToast({ message: 'Editor not ready — please try again', type: 'error' });
        return;
      }

      const editor = editorRef.current;
      const { suggestedHtml, canvasDocumentId } = suggestion;

      // Load the accepted HTML into the live Lexical editor (visual update)
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        const parser = new DOMParser();
        const dom = parser.parseFromString(suggestedHtml, 'text/html');
        const nodes = $generateNodesFromDOM(editor, dom);
        if (nodes.length > 0) root.append(...wrapTopLevelNodes(nodes));
      });

      // Use suggestedHtml directly for saving — avoids reading Lexical state immediately
      // after an update (which can capture the pre-update state before reconciliation).
      // Pass {} (empty object) for the Lexical JSON content so the DB content field is
      // cleared (no .root). If we passed null the API would skip updating content entirely,
      // leaving the old Lexical JSON in the DB. LoadContentPlugin would then find .root
      // and reload the editor with the pre-edit content, reverting the accepted change.
      const plainText = new DOMParser()
        .parseFromString(suggestedHtml, 'text/html')
        .body.textContent || '';

      // Prefer saving by explicit canvasDocumentId (avoids relying on activeCanvasId
      // being correctly set — it may be null if no canvas_document_created event fired).
      const saveDocumentById = useCanvasStore.getState().saveDocumentById;
      const result = canvasDocumentId
        ? await saveDocumentById(projectId, canvasDocumentId, {}, suggestedHtml, plainText)
        : await saveCanvasDocument(projectId, {}, suggestedHtml, plainText);
      if (result) {
        // Prevent LoadContentPlugin from reloading from the just-saved doc (it would
        // load htmlContent which is correct, but causes a flicker and cursor reset).
        bypassLoadRef.current = result.id + '_' + result.updatedAt;
        clearPendingSuggestion();
        setCurrentEditorHtml(suggestedHtml);
        addToast({ message: 'Changes accepted and saved', type: 'success' });
      } else {
        addToast({ message: 'Failed to save accepted changes', type: 'error' });
      }
    } catch (err) {
      console.error('[CanvasInterface] handleAcceptSuggestion error:', err);
      addToast({ message: 'Failed to accept changes — see console for details', type: 'error' });
    }
  };

  // Reject suggestion: discard diff, restore original Lexical state
  const handleRejectSuggestion = () => {
    setStreamingPreviewHtml(null);
    clearPendingSuggestion();
    addToast({ message: 'Suggestion rejected — original preserved', type: 'info' });
  };

  // Keep handler refs pointing to the latest function instances on every render.
  // This lets the event listeners (registered once in useEffect) always invoke
  // the current version without stale-closure problems.
  acceptHandlerRef.current = handleAcceptSuggestion;
  rejectHandlerRef.current = handleRejectSuggestion;

  // Fetch canvas documents on mount — atomically clear ALL stale state first so
  // the editor never shows content from a different project while fetch is in flight.
  useEffect(() => {
    resetForProject();
    setCurrentEditorHtml('');
    setStreamingPreviewHtml(null);
    bypassLoadRef.current = null;
    hasPendingChangesRef.current = false;
    isLoadingContentRef.current = true;
    if (projectId) {
      fetchCanvasDocuments(projectId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // When the active document changes, the LexicalComposer remounts (key changes).
  // React runs child effects (OnChangePlugin) before parent effects, so the initial
  // empty-state OnChangePlugin fire happens BEFORE this effect runs, potentially setting
  // hasPendingChangesRef = true. This effect immediately corrects that by:
  // 1. Setting isLoadingContentRef = true (blocks future OnChangePlugin fires during load)
  // 2. Resetting hasPendingChangesRef = false (discards the spurious empty-state flag)
  // This prevents auto-save from overwriting the newly active document with empty content.
  const prevActiveCanvasIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (activeCanvasId !== prevActiveCanvasIdRef.current) {
      const prevId = prevActiveCanvasIdRef.current;
      prevActiveCanvasIdRef.current = activeCanvasId;

      // Before discarding pending state: fire-and-forget save of the PREVIOUS document.
      // This preserves edits that haven't been flushed to the DB yet when the user
      // triggers a new document generation (which switches activeCanvasId away).
      if (hasPendingChangesRef.current && prevId && lastHtmlRef.current) {
        const htmlToSave = lastHtmlRef.current;
        const plainText = htmlToSave.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        saveDocumentById(projectId, prevId, null, htmlToSave, plainText);
      }

      // Clear the bypass so the new document's content is always loaded fresh.
      // Without this, bypassLoadRef from a previous save to this same doc would
      // prevent LoadContentPlugin from loading the content on switch-back.
      bypassLoadRef.current = null;
      isLoadingContentRef.current = true;
      hasPendingChangesRef.current = false; // discard any empty-state trigger from remount
      setAutoSaveStatus('idle'); // clear stale 'pending' so blur doesn't trigger save on new empty editor
    }
  }, [activeCanvasId, projectId, saveDocumentById]);

  // Listen for canvas updates from chat (when AI updates the document)
  useEffect(() => {
    const handleCanvasUpdate = async (event: any) => {
      if (projectId && event.detail?.projectId === projectId) {
        // Clear the streaming preview — the real content is now in the DB.
        // For 'generating': a new doc was created, fetchCanvasDocuments will activate it.
        // For 'editing': the suggestion overlay (pendingSuggestion) handles accept/reject.
        setStreamingPreviewHtml(null);
        // Refresh the document list without forcing a specific active doc — the
        // current activeCanvasId (set by switchToStreamingDocument or the user clicking
        // a different tab) is preserved by fetchCanvasDocuments automatically.
        await fetchCanvasDocuments(projectId);
      }
    };

    const handleCanvasContentUpdate = (event: any) => {
      if (projectId && event.detail?.projectId === projectId) {
        // Only show streaming preview for document generation, NOT for editing.
        // For editing, the suggestion diff overlay (canvas_suggestion) handles the UX
        // once editing completes. Showing a full rewrite preview during editing is
        // confusing — it looks like a new document is being created.
        if (event.detail.actionType !== 'editing') {
          setStreamingPreviewHtml(event.detail.partialContent);
        }
      }
    };

    const handleCanvasSuggestion = (event: any) => {
      if (projectId && event.detail?.projectId === projectId) {
        setStreamingPreviewHtml(null);
        // If the suggestion carries a canvasDocumentId and the store doesn't have
        // an active canvas yet, activate it so subsequent saves (autoSave, Accept)
        // will target the correct document.
        const { canvasDocumentId } = event.detail;
        if (canvasDocumentId) {
          const storeState = useCanvasStore.getState();
          if (!storeState.activeCanvasId) {
            storeState.setActiveCanvasId(canvasDocumentId);
          }
        }
        setPendingSuggestion({
          suggestedHtml: event.detail.suggestedHtml,
          originalHtml: event.detail.originalHtml,
          changeDescription: event.detail.changeDescription,
          canvasDocumentId
        });
        // Update currentEditorHtml to the suggested version so that subsequent
        // edit messages use the suggestion as their base, not the stale DB version.
        // Without this, chained edits would all apply to the original content.
        setCurrentEditorHtml(event.detail.suggestedHtml);
      }
    };

    const handleFocusUpdate = () => {
      if (projectId) {
        refreshCanvasDocument(projectId);
      }
    };

    // Chat-inline Accept / Reject button events — use refs so we always call the
    // latest handler even though this useEffect only runs once per projectId.
    const handleAcceptFromChat = () => { acceptHandlerRef.current(); };
    const handleRejectFromChat = () => { rejectHandlerRef.current(); };

    window.addEventListener('canvasUpdate', handleCanvasUpdate);
    window.addEventListener('canvasContentUpdate', handleCanvasContentUpdate);
    window.addEventListener('canvasSuggestion', handleCanvasSuggestion);
    window.addEventListener('canvasAcceptSuggestion', handleAcceptFromChat);
    window.addEventListener('canvasRejectSuggestion', handleRejectFromChat);
    window.addEventListener('focus', handleFocusUpdate);

    return () => {
      window.removeEventListener('canvasUpdate', handleCanvasUpdate);
      window.removeEventListener('canvasContentUpdate', handleCanvasContentUpdate);
      window.removeEventListener('canvasSuggestion', handleCanvasSuggestion);
      window.removeEventListener('canvasAcceptSuggestion', handleAcceptFromChat);
      window.removeEventListener('canvasRejectSuggestion', handleRejectFromChat);
      window.removeEventListener('focus', handleFocusUpdate);
    };
  }, [projectId, refreshCanvasDocument, fetchCanvasDocuments, setPendingSuggestion]);

  // Handle template insertion
  const handleInsertTemplate = async (file: File) => {
    setIsLoadingTemplate(true);

    // Mammoth only supports .docx — reject .doc (old binary format)
    if (file.name.toLowerCase().endsWith('.doc') && !file.name.toLowerCase().endsWith('.docx')) {
      addToast({
        message: 'Only .docx files are supported. Please convert your .doc file to .docx format first.',
        type: 'error'
      });
      setIsLoadingTemplate(false);
      return;
    }

    try {
      const mammothModule = await import('mammoth/mammoth.browser');
      const mammoth = mammothModule.default || mammothModule;
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });

      if (result.value) {
        let cleanHtml = result.value
          .replace(/class="[^"]*"/g, '')
          .replace(/style="[^"]*"/g, '')
          .replace(/<p><\/p>/g, '<br>')
          .replace(/<span[^>]*><\/span>/g, '')
          .replace(/\s+/g, ' ')
          .trim();

        const editor = editorRef.current;
        if (editor) {
          editor.update(() => {
            const root = $getRoot();
            root.clear();
            const parser = new DOMParser();
            const dom = parser.parseFromString(cleanHtml, 'text/html');
            const nodes = $generateNodesFromDOM(editor, dom);
            if (nodes.length > 0) {
              root.append(...wrapTopLevelNodes(nodes));
            }
          }, { discrete: true });

          let htmlContent = '';
          let plainText = '';
          editor.getEditorState().read(() => {
            htmlContent = $generateHtmlFromNodes(editor);
            plainText = $getRoot().getTextContent();
          });
          const content = editor.getEditorState().toJSON();

          const saveResult = await saveCanvasDocument(projectId, content, htmlContent, plainText);
          if (!saveResult) {
            addToast({ message: 'Failed to save template to canvas', type: 'error' });
            return;
          }
        }

        setShowTemplateModal(false);
      } else {
        throw new Error('Failed to extract content from the document');
      }

    } catch (error) {
      addToast({
        message: 'Failed to process template document',
        type: 'error'
      });
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  // Helper function to get concise status messages
  const getStatusMessage = (status: string, message?: string) => {
    if (message) return message;

    switch (status) {
      case 'analyzing_request':
        return 'Analyzing request...';
      case 'processing_context':
        return 'Reviewing documents...';
      case 'generating_document':
        return 'Generating document...';
      case 'editing_document':
        return 'Updating document...';
      case 'saving_document':
        return 'Saving changes...';
      case 'completed':
        return 'Complete!';
      default:
        return 'Processing...';
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Top Action Bar */}
      <div className="border-b border-gray-200 p-2 md:p-3 flex items-center justify-between bg-gray-50 flex-wrap gap-1 md:gap-2">
        <div className="flex items-center space-x-1 md:space-x-2">
          <span className="text-sm text-gray-600"></span>

          {/* Canvas streaming status indicator */}
          {canvasStreamingStatus.show && (
            <div className="flex items-center space-x-1 md:space-x-2 bg-green-50 text-primary px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs border border-blue-200">
              <div className="flex space-x-0.5 md:space-x-1">
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="hidden sm:inline">{getStatusMessage(canvasStreamingStatus.status, canvasStreamingStatus.message)}</span>
            </div>
          )}

          {showUpdateNotification && (
            <div className="flex items-center space-x-1 bg-green-100 text-green-700 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs animate-pulse">
              <CheckCircle className="h-2.5 w-2.5 md:h-3 md:w-3" />
              <span className="inline">Document updated</span>
            </div>
          )}

          {/* Auto-save status indicator */}
          {autoSaveStatus === 'pending' && (
            <div className="flex items-center space-x-1 text-amber-600 px-1.5 py-0.5 rounded text-[10px] md:text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="hidden sm:inline">Unsaved changes</span>
            </div>
          )}
          {autoSaveStatus === 'saving' && (
            <div className="flex items-center space-x-1 text-blue-600 px-1.5 py-0.5 rounded text-[10px] md:text-xs">
              <RefreshCw className="h-2.5 w-2.5 animate-spin" />
              <span className="hidden sm:inline">Auto-saving...</span>
            </div>
          )}
          {autoSaveStatus === 'saved' && (
            <div className="flex items-center space-x-1 text-green-600 px-1.5 py-0.5 rounded text-[10px] md:text-xs">
              <CheckCircle className="h-2.5 w-2.5" />
              <span className="hidden sm:inline">Saved</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1 md:space-x-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const success = await deleteCanvasDocument(projectId);
              if (success) {
                if (editorRef.current) {
                  editorRef.current.update(() => {
                    $getRoot().clear();
                  });
                }
                addToast({ message: 'Document cleared successfully', type: 'success' });
              } else {
                addToast({ message: 'Failed to clear document', type: 'error' });
              }
            }}
            className="flex items-center space-x-1 p-1.5 md:p-2 h-8 md:h-9"
          >
            <X className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Clear</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-1 p-1.5 md:p-2 h-8 md:h-9"
          >
            <Save className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportWord}
            disabled={!canvasDocument?.htmlContent}
            className="flex items-center space-x-1 p-1.5 md:p-2 h-8 md:h-9"
          >
            <FileDown className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>

           <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTemplateModal(true)}
            className="flex items-center space-x-1 p-1.5 md:p-2 h-8 md:h-9"
          >
            <Download className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Import</span>
          </Button>
        </div>
      </div>

      {/* Document Tabs — switch between multiple canvas documents in this project */}
      {canvasDocuments.length > 0 && (
        <div className="flex items-center gap-0 border-b border-gray-200 bg-gray-50 overflow-x-auto">
          {canvasDocuments.map((doc) => (
            <div
              key={doc.id}
              className={`group flex items-center gap-1 px-3 py-1.5 text-xs border-r border-gray-200 cursor-pointer shrink-0 max-w-[160px] ${
                doc.id === activeCanvasId
                  ? 'bg-white text-gray-900 font-medium border-b-2 border-b-blue-500 -mb-px'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
              onClick={() => {
                if (doc.id !== activeCanvasId) {
                  setActiveCanvasId(doc.id);
                }
              }}
            >
              {renamingDocId === doc.id ? (
                <input
                  autoFocus
                  className="w-24 text-xs border border-blue-400 rounded px-1 outline-none"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={async () => {
                    if (renameValue.trim()) {
                      await renameCanvasDocument(doc.id, renameValue.trim());
                    }
                    setRenamingDocId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                    if (e.key === 'Escape') { setRenamingDocId(null); }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  className="truncate max-w-[110px]"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setRenamingDocId(doc.id);
                    setRenameValue(doc.title);
                  }}
                  title={doc.title}
                >
                  {doc.title}
                </span>
              )}
              {doc.id === activeCanvasId && canvasDocuments.length > 1 && (
                <button
                  className="opacity-0 group-hover:opacity-100 ml-1 text-gray-400 hover:text-red-500 transition-opacity"
                  title="Delete this document"
                  onClick={async (e) => {
                    e.stopPropagation();
                    const ok = await deleteCanvasDocument(projectId);
                    if (ok) addToast({ message: 'Document deleted', type: 'success' });
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          <button
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-400 hover:text-gray-700 hover:bg-gray-100 shrink-0"
            title="New document"
            onClick={async () => {
              const doc = await createCanvasDocument(projectId, 'Untitled Document');
              if (doc) addToast({ message: 'New document created', type: 'success' });
            }}
          >
            <span className="text-base leading-none">+</span>
          </button>
        </div>
      )}

      {/* Main Editor */}
      {/* onBlur fires when focus leaves this container entirely (e.g. user clicks into
          the chat input). It does NOT fire for clicks on toolbar buttons because those
          stay inside the container. This gives us zero-timer auto-save. */}
      <div
        className="flex-1 relative flex flex-col overflow-hidden"
        ref={canvasRef}
        onBlur={(e) => {
          if (hasPendingChangesRef.current && !e.currentTarget.contains(e.relatedTarget as Node)) {
            autoSave();
          }
        }}
      >
        <LexicalComposer key={activeCanvasId ?? projectId} initialConfig={initialConfig}>
          <ToolbarPlugin />

          {/* Diff/preview overlay — shown during streaming or suggestion review */}
          {(pendingSuggestion || streamingPreviewHtml) && (
            <div className="flex-1 overflow-y-auto lexical-container">
              <div className="legal-page-wrapper">
                <div className="legal-page">
                  <div
                    className="legal-page-content lexical-editor"
                    style={{ pointerEvents: 'none', userSelect: 'text' }}
                    dangerouslySetInnerHTML={{
                      __html: pendingSuggestion
                        ? buildDiffHtml(pendingSuggestion.originalHtml, pendingSuggestion.suggestedHtml)
                        : streamingPreviewHtml!
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Real editor — hidden (not unmounted) while overlay is visible so editorRef stays valid */}
          <div className={`flex-1 overflow-y-auto lexical-container${(pendingSuggestion || streamingPreviewHtml) ? ' hidden' : ''}`}>
            <div className="legal-page-wrapper">
              <div className="legal-page">
                <div className="legal-page-content relative">
                  <RichTextPlugin
                    contentEditable={<ContentEditable className="lexical-editor outline-none" />}
                    ErrorBoundary={LexicalErrorBoundary}
                  />
                  <PageLayoutPlugin />
                </div>
              </div>
            </div>
          </div>

          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <OnChangePlugin onChange={handleEditorChange} />
          <EditorRefPlugin editorRef={editorRef} />
          <LoadContentPlugin canvasDocument={canvasDocument} bypassLoadRef={bypassLoadRef} isLoadingContentRef={isLoadingContentRef} />
        </LexicalComposer>
      </div>

      {/* Template Upload Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Insert Document Template</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowTemplateModal(false)}
                disabled={isLoadingTemplate}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Upload a Word document (.docx) to use as a template for your legal document.
              </p>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleInsertTemplate(file);
                    }
                  }}
                  disabled={isLoadingTemplate}
                  className="hidden"
                  id="template-upload"
                />
                <label
                  htmlFor="template-upload"
                  className={`cursor-pointer flex flex-col items-center ${
                    isLoadingTemplate ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <FileText className="h-12 w-12 text-gray-400 mb-2" />
                  <span className="text-sm font-medium">
                    {isLoadingTemplate ? 'Processing template...' : 'Click to upload template'}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    Supports .docx files only
                  </span>
                </label>
              </div>

              {isLoadingTemplate && (
                <div className="flex items-center justify-center py-2">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-gray-600">Converting template...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Legal Document Styles — A4 format with page numbering & line numbering */}
      <style jsx global>{`
        /* ── Scroll container ── */
        .lexical-container {
          background-color: #e5e7eb;
          scrollbar-width: thin;
          scrollbar-color: #c4c4c4 transparent;
        }
        .lexical-container::-webkit-scrollbar {
          width: 6px;
        }
        .lexical-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .lexical-container::-webkit-scrollbar-thumb {
          background-color: #c4c4c4;
          border-radius: 3px;
        }

        /* ── A4 page wrapper ── */
        .legal-page-wrapper {
          display: flex;
          justify-content: center;
          padding: 24px 16px;
          min-height: 100%;
        }

        .legal-page {
          width: 794px;          /* A4 width at 96 DPI (210mm) */
          max-width: 100%;
          background: #ffffff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08);
          border-radius: 2px;
        }

        .legal-page-content {
          position: relative;
        }

        /* ── Editor — legal document defaults ── */
        .lexical-editor {
          font-family: "Times New Roman", Times, Georgia, serif;
          font-size: 12pt;
          line-height: 1.5;
          color: #000000;
          /* A4 legal margins: 1.5in left (binding), 1in right, 1in top, 1in bottom */
          padding: 96px 96px 96px 144px;
          min-height: 1123px;   /* A4 height at 96 DPI (297mm) */
        }

        .lexical-paragraph {
          margin: 0;
          padding: 2px 0;
        }

        /* ── Headings ── */
        .lexical-h1 {
          font-family: "Times New Roman", Times, Georgia, serif;
          font-size: 16pt;
          font-weight: 700;
          text-align: center;
          text-transform: uppercase;
          margin: 24pt 0 12pt 0;
          line-height: 1.5;
        }

        .lexical-h2 {
          font-family: "Times New Roman", Times, Georgia, serif;
          font-size: 14pt;
          font-weight: 700;
          margin: 18pt 0 6pt 0;
          line-height: 1.5;
        }

        .lexical-h3 {
          font-family: "Times New Roman", Times, Georgia, serif;
          font-size: 12pt;
          font-weight: 700;
          text-decoration: underline;
          margin: 12pt 0 6pt 0;
          line-height: 1.5;
        }

        /* ── Lists ── */
        .lexical-ol {
          list-style-type: decimal;
          padding-left: 36pt;
          margin: 6pt 0;
        }

        .lexical-ul {
          list-style-type: disc;
          padding-left: 36pt;
          margin: 6pt 0;
        }

        .lexical-li {
          margin: 2pt 0;
          line-height: 1.5;
        }

        .lexical-nested-li {
          list-style-type: none;
        }

        /* ── Inline formatting ── */
        .lexical-link {
          color: #0000ee;
          text-decoration: underline;
        }

        .lexical-bold {
          font-weight: 700;
        }

        .lexical-italic {
          font-style: italic;
        }

        .lexical-underline {
          text-decoration: underline;
        }

        .lexical-strikethrough {
          text-decoration: line-through;
        }

        .lexical-code {
          background-color: #f3f4f6;
          color: #374151;
          padding: 1px 4px;
          border-radius: 2px;
          font-family: "Courier New", Courier, monospace;
          font-size: 11pt;
        }

        .lexical-quote {
          border-left: 3px solid #000;
          padding-left: 24pt;
          margin: 12pt 0 12pt 36pt;
          color: #000;
          font-style: italic;
          line-height: 1.5;
        }

        /* ── Page break indicators ── */
        .page-break-indicator {
          position: absolute;
          left: 0;
          right: 0;
          height: 32px;
          z-index: 5;
          pointer-events: none;
          transform: translateY(-16px);
        }

        .page-break-line {
          position: absolute;
          top: 50%;
          left: 24px;
          right: 24px;
          height: 0;
          border-top: 1px dashed #9ca3af;
        }

        .page-number-label {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: #e5e7eb;
          color: #6b7280;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-size: 10px;
          padding: 2px 10px;
          border-radius: 8px;
          white-space: nowrap;
          user-select: none;
        }

        /* Last page footer */
        .page-footer-current {
          text-align: center;
          padding: 8px 0 16px;
          color: #9ca3af;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-size: 10px;
          user-select: none;
        }

        /* ── Print / PDF output ── */
        @media print {
          body * {
            visibility: hidden;
          }
          .legal-page,
          .legal-page * {
            visibility: visible;
          }
          .legal-page {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none;
            border-radius: 0;
          }

          .lexical-editor {
            padding: 0;
            min-height: auto;
          }

          .page-break-indicator,
          .page-footer-current {
            display: none;
          }

          @page {
            size: A4;
            margin: 1in 1in 1in 1.5in;

            @bottom-center {
              content: counter(page);
              font-family: "Times New Roman", Times, serif;
              font-size: 12pt;
            }
          }
        }

        /* ── Mobile Responsiveness ── */
        @media (max-width: 840px) {
          .legal-page-wrapper {
            padding: 12px 4px;
          }

          .legal-page {
            width: 100%;
            box-shadow: none;
            border-radius: 0;
          }

          .lexical-editor {
            padding: 16px;
            font-size: 11pt;
            min-height: 600px;
          }
        }
      `}</style>
    </div>
  );
};

export default LegalCanvas;
