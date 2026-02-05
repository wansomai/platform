// src/components/chat/CanvasInterface.tsx
'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/store/ui.store';
import { useCanvasDocument, useCanvasSaving } from '@/store/canvas.store';
import { useChatStore } from '@/store/chat.store';

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
function LoadContentPlugin({ canvasDocument }: { canvasDocument: any }) {
  const [editor] = useLexicalComposerContext();
  const loadedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!canvasDocument) return;

    const docId = canvasDocument.id + '_' + canvasDocument.updatedAt;
    if (loadedRef.current === docId) return;

    const content = canvasDocument.content;

    // If content is Lexical JSON format (has root property), use setEditorState
    // (must be called outside editor.update())
    if (content && content.root) {
      try {
        const editorState = editor.parseEditorState(JSON.stringify(content));
        editor.setEditorState(editorState);
        loadedRef.current = docId;
        return;
      } catch {
        // Fall through to HTML loading
      }
    }

    // Fall back to loading from htmlContent (w "Open in Editor")
    if (canvasDocument.htmlContent) {
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        const parser = new DOMParser();
        const dom = parser.parseFromString(canvasDocument.htmlContent, 'text/html');
        const nodes = $generateNodesFromDOM(editor, dom);
        if (nodes.length > 0) {
          root.append(...wrapTopLevelNodes(nodes));
        }
      });
      loadedRef.current = docId;
    }
  }, [canvasDocument, editor]);

  return null;
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
  const [canvasStreamingStatus, setCanvasStreamingStatus] = useState<{
    show: boolean;
    status: string;
    message?: string;
    actionType?: string;
  }>({ show: false, status: '' });

  const canvasRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<LexicalEditor | null>(null);

  // Use store hooks for canvas data management
  const { addToast } = useUIStore();
  const { canvasDocument, isLoading, error, fetchCanvasDocument, refreshCanvasDocument } = useCanvasDocument();
  const { isSaving, saveCanvasDocument, deleteCanvasDocument } = useCanvasSaving();
  const { currentConversation } = useChatStore();

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      addToast({ message: error, type: 'error' });
    }
  }, [error, addToast]);

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

  // Lexical editor config
  const initialConfig = {
    namespace: 'LegalCanvas',
    theme: editorTheme,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, AutoLinkNode],
    onError: (error: Error) => {
      console.error('Lexical error:', error);
    },
  };

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
        addToast({ message: 'Document saved successfully', type: 'success' });
      } else {
        addToast({ message: 'Failed to save document', type: 'error' });
      }
    } catch (error) {
      addToast({ message: 'Failed to save document', type: 'error' });
    }
  };

  // Handle content changes (no auto-save)
  const handleEditorChange = (editorState: EditorState) => {
    // Content changed - could add debounced indicators here if needed
  };


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
        .replace(/^/, '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Legal Document</title></head><body>')
        .replace(/$/, '</body></html>')
        .replace(/class="lexical-[^"]*"/g, '')
        .replace('<body>', '<body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 40px;">');

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

  // Fetch canvas document on mount
  useEffect(() => {
    if (projectId) {
      fetchCanvasDocument(projectId);
    }
  }, [projectId, fetchCanvasDocument]);

  // Listen for canvas updates from chat (when AI updates the document)
  useEffect(() => {
    const handleCanvasUpdate = (event: any) => {
      if (projectId && event.detail?.projectId === projectId) {
        refreshCanvasDocument(projectId);
      }
    };

    const handleCanvasContentUpdate = (event: any) => {
      if (projectId && event.detail?.projectId === projectId && editorRef.current) {
        const editor = editorRef.current;
        // Update canvas content in real-time as AI generates it
        editor.update(() => {
          const root = $getRoot();
          root.clear();
          const parser = new DOMParser();
          const dom = parser.parseFromString(event.detail.partialContent, 'text/html');
          const nodes = $generateNodesFromDOM(editor, dom);
          if (nodes.length > 0) {
            root.append(...wrapTopLevelNodes(nodes));
          }

          // Add subtle highlighting to current section being worked on
          if (event.detail.currentSection) {
            // Section highlighting is handled via CSS animations on the content
          }
        });
      }
    };

    const handleFocusUpdate = () => {
      if (projectId) {
        refreshCanvasDocument(projectId);
      }
    };

    window.addEventListener('canvasUpdate', handleCanvasUpdate);
    window.addEventListener('canvasContentUpdate', handleCanvasContentUpdate);
    window.addEventListener('focus', handleFocusUpdate);

    return () => {
      window.removeEventListener('canvasUpdate', handleCanvasUpdate);
      window.removeEventListener('canvasContentUpdate', handleCanvasContentUpdate);
      window.removeEventListener('focus', handleFocusUpdate);
    };
  }, [projectId, refreshCanvasDocument]);

  // Handle template insertion
  const handleInsertTemplate = async (file: File) => {
    setIsLoadingTemplate(true);
    console.log('[Template] Starting insertion for file:', file.name, 'size:', file.size);

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
      console.log('[Template] Importing mammoth...');
      const mammothModule = await import('mammoth/mammoth.browser');
      console.log('[Template] mammothModule keys:', Object.keys(mammothModule));
      console.log('[Template] mammothModule.default type:', typeof mammothModule.default);
      console.log('[Template] mammothModule.convertToHtml type:', typeof mammothModule.convertToHtml);

      const mammoth = mammothModule.default || mammothModule;
      console.log('[Template] Resolved mammoth keys:', Object.keys(mammoth));
      console.log('[Template] mammoth.convertToHtml type:', typeof mammoth.convertToHtml);

      const arrayBuffer = await file.arrayBuffer();
      console.log('[Template] ArrayBuffer size:', arrayBuffer.byteLength);

      const result = await mammoth.convertToHtml({ arrayBuffer });
      console.log('[Template] Conversion done. HTML length:', result.value?.length ?? 0);
      if (result.messages?.length > 0) {
        console.log('[Template] Mammoth messages:', result.messages);
      }

      if (result.value) {
        let cleanHtml = result.value
          .replace(/class="[^"]*"/g, '')
          .replace(/style="[^"]*"/g, '')
          .replace(/<p><\/p>/g, '<br>')
          .replace(/<span[^>]*><\/span>/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        console.log('[Template] Cleaned HTML length:', cleanHtml.length);
        console.log('[Template] Cleaned HTML preview:', cleanHtml.substring(0, 300));

        const editor = editorRef.current;
        console.log('[Template] Editor ref available:', !!editor);

        if (editor) {
          // Use discrete: true to make the update synchronous
          editor.update(() => {
            const root = $getRoot();
            root.clear();
            const parser = new DOMParser();
            const dom = parser.parseFromString(cleanHtml, 'text/html');
            const nodes = $generateNodesFromDOM(editor, dom);
            console.log('[Template] Parsed nodes count:', nodes.length);
            const wrapped = wrapTopLevelNodes(nodes);
            console.log('[Template] Wrapped nodes count:', wrapped.length);
            if (wrapped.length > 0) {
              root.append(...wrapped);
            }
            console.log('[Template] Root children after insert:', root.getChildrenSize());
          }, { discrete: true });

          // State is now available after discrete update
          let htmlContent = '';
          let plainText = '';
          editor.getEditorState().read(() => {
            htmlContent = $generateHtmlFromNodes(editor);
            plainText = $getRoot().getTextContent();
          });
          const content = editor.getEditorState().toJSON();
          console.log('[Template] Generated HTML length:', htmlContent.length);
          console.log('[Template] Plain text length:', plainText.length);
          console.log('[Template] Content JSON root children:', (content as any)?.root?.children?.length);

          console.log('[Template] Saving to canvas...');
          const saveResult = await saveCanvasDocument(projectId, content, htmlContent, plainText);
          console.log('[Template] Save result:', !!saveResult);
          if (!saveResult) {
            addToast({ message: 'Failed to save template to canvas', type: 'error' });
            return;
          }
        } else {
          console.error('[Template] Editor ref is null — cannot insert template');
        }

        setShowTemplateModal(false);
        console.log('[Template] Insertion complete');
      } else {
        console.error('[Template] Mammoth returned empty value');
        throw new Error('Failed to extract content from the document');
      }

    } catch (error) {
      console.error('[Template] Error:', error);
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

      {/* Main Editor */}
      <div className="flex-1 relative flex flex-col overflow-hidden" ref={canvasRef}>
        <LexicalComposer initialConfig={initialConfig}>
          <ToolbarPlugin />
          <div className="flex-1 overflow-y-auto lexical-container">
            <RichTextPlugin
              contentEditable={<ContentEditable className="lexical-editor outline-none min-h-[750px] p-8" />}
              ErrorBoundary={LexicalErrorBoundary}
            />
          </div>
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <OnChangePlugin onChange={handleEditorChange} />
          <EditorRefPlugin editorRef={editorRef} />
          <LoadContentPlugin canvasDocument={canvasDocument} />
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

      {/* Lexical Editor Styles */}
      <style jsx global>{`
        .lexical-container {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .lexical-container::-webkit-scrollbar {
          display: none;
        }

        .lexical-editor {
          font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
          font-size: 16px;
          line-height: 1.8;
          color: #111827;
        }

        .lexical-paragraph {
          margin: 0.75rem 0;
        }

        .lexical-h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 1.5rem 0 1rem 0;
        }

        .lexical-h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 1.25rem 0 0.75rem 0;
        }

        .lexical-h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 1rem 0 0.5rem 0;
        }

        .lexical-ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }

        .lexical-ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }

        .lexical-li {
          margin: 0.25rem 0;
        }

        .lexical-nested-li {
          list-style-type: none;
        }

        .lexical-link {
          color: #2563eb;
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
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-family: ui-monospace, monospace;
          font-size: 0.875em;
        }

        .lexical-quote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1rem;
          margin: 1rem 0;
          color: #6b7280;
          font-style: italic;
        }

        /* Mobile Responsiveness */
        @media (max-width: 768px) {
          .lexical-editor {
            padding: 1rem !important;
            font-size: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default LegalCanvas;
