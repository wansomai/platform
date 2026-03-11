'use client';
// Orchestrates the full guest drafting experience:
// auto-generates the document on mount, manages state, handles the Paystack export gate.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SplitView } from '@/components/layout/SplitView';
import GuestCanvasInterface from './GuestCanvasInterface';
import GuestChatPanel from './GuestChatPanel';
import { JURISDICTIONS } from '@/lib/jurisdictions';
import { X, Loader2 } from 'lucide-react';

interface PendingSuggestion {
  originalHtml: string;
  suggestedHtml: string;
}

interface GuestCanvasChatSplitViewProps {
  documentType: string;
  initialJurisdictionId: string;
  documentTitle?: string;
  documentDescription?: string;
}

// Pricing per jurisdiction (amount in smallest currency unit for Paystack)
const EXPORT_PRICING: Record<string, { amount: number; currency: string; label: string }> = {
  
  // 🌍 CORE AFRICAN MARKETS
  // Target: ~$5-6 USD equivalent (PPP-adjusted, high price sensitivity)
  
  ng: { amount: 699900,  currency: 'NGN', label: '₦6,999' },  // $5.01 — up from $1.79
  ke: { amount: 79900,   currency: 'KES', label: 'KES 799' }, // $6.19 — up from $4.26
  za: { amount: 9900,    currency: 'ZAR', label: 'R99'     }, // $6.07 — up from $2.76
  gh: { amount: 6500,    currency: 'GHS', label: 'GHS 65'  }, // $6.03 — slight drop for consistency
  
  // 🇬🇧 UK — Diaspora #1 Target (high purchase power)
  gb: { amount: 799,     currency: 'GBP', label: '£7.99'   }, // ~$10.10
  
  // 🇺🇸 USA — Diaspora #2 Target
  us: { amount: 999,     currency: 'USD', label: '$9.99'   },
  
  // 🇨🇦 Canada — Diaspora #3 Target  
  ca: { amount: 1299,    currency: 'CAD', label: 'CA$12.99' }, // ~$9.10
  
  // 🇦🇺 Australia — South African diaspora hub
  au: { amount: 1499,    currency: 'AUD', label: 'A$14.99'  }, // ~$9.50
  
  // 🇦🇪 UAE — High-income African professionals
  ae: { amount: 3699,    currency: 'AED', label: 'AED 36.99' }, // ~$10.07
  
};

// Default for all other countries (raised from $5 → $7.99)
const DEFAULT_PRICING = { amount: 799, currency: 'USD', label: '$7.99' };
export default function GuestCanvasChatSplitView({
  documentType,
  initialJurisdictionId,
  documentTitle,
  documentDescription,
}: GuestCanvasChatSplitViewProps) {
  const [documentHtml, setDocumentHtml] = useState<string | null>(null);
  const [streamingHtml, setStreamingHtml] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentEditorHtml, setCurrentEditorHtml] = useState<string>('');
  const [jurisdictionId, setJurisdictionId] = useState(initialJurisdictionId);
  const [pendingSuggestion, setPendingSuggestion] = useState<PendingSuggestion | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportEmail, setExportEmail] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const hasGenerated = useRef(false);

  // Auto-generate on mount
  useEffect(() => {
    if (hasGenerated.current) return;
    hasGenerated.current = true;
    generateDocument(jurisdictionId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateDocument = async (jId: string) => {
    setIsGenerating(true);
    setDocumentHtml(null);
    setStreamingHtml(null);
    setPendingSuggestion(null);

    try {
      const response = await fetch('/api/public/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType, documentTitle, jurisdictionId: jId }),
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const chunk = JSON.parse(line);
            if (chunk.type === 'text') {
              accumulated += chunk.content;
              setStreamingHtml(accumulated);
            } else if (chunk.type === 'complete') {
              setStreamingHtml(null);
              setDocumentHtml(accumulated);
            }
          } catch {
            // Ignore malformed chunks
          }
        }
      }
    } catch {
      setStreamingHtml(null);
      setDocumentHtml('<p>Failed to generate document. Please refresh the page and try again.</p>');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleJurisdictionChange = (newId: string) => {
    setJurisdictionId(newId);
    hasGenerated.current = false;
    generateDocument(newId);
  };

  const handleCanvasStreamingUpdate = useCallback((html: string | null) => {
    setStreamingHtml(html);
  }, []);

  const handleDocumentUpdate = useCallback((suggestedHtml: string, originalHtml: string) => {
    setPendingSuggestion({ originalHtml: originalHtml || currentEditorHtml, suggestedHtml });
  }, [currentEditorHtml]);

  const handleAcceptSuggestion = useCallback((html: string) => {
    setDocumentHtml(html);
    setPendingSuggestion(null);
  }, []);

  const handleRejectSuggestion = useCallback(() => {
    setPendingSuggestion(null);
  }, []);

  // ── Export / Paystack flow ──────────────────────────────────────────────────

  const pricing = EXPORT_PRICING[jurisdictionId] || DEFAULT_PRICING;
  const jurisdiction = JURISDICTIONS.find((j) => j.id === jurisdictionId);

  const generateAndDownload = async () => {
    const htmlToExport = currentEditorHtml || documentHtml || '';
    if (!htmlToExport) throw new Error('No document content to export.');

    const title = documentTitle || documentType.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const cleanBody = htmlToExport
      .replace(/class="lexical-[^"]*"/g, '')
      .replace(/class="[^"]*lexical[^"]*"/g, '');

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
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
</head>
<body>${cleanBody}</body>
</html>`;

    const htmlDocxModule = await import('html-docx-js/dist/html-docx');
    const htmlDocx = (htmlDocxModule as any).default || htmlDocxModule;
    const blob = htmlDocx.asBlob(fullHtml);

    const filename = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-wansom.docx';
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePayClick = async () => {
    if (!exportEmail.trim()) {
      setExportError('Please enter your email address.');
      return;
    }
    setExportError('');

    // Load Paystack inline script once
    await new Promise<void>((resolve) => {
      if ((window as any).PaystackPop) { resolve(); return; }
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.onload = () => resolve();
      document.body.appendChild(script);
    });

    const channels = jurisdictionId === 'ke' ? ['mobile_money', 'card'] : ['card'];

    (window as any).PaystackPop.setup({
      key: 'pk_live_fcef983434b15b8b03d03189ebff007c36adfe48',
      email: exportEmail,
      amount: pricing.amount,
      currency: pricing.currency,
      channels,
      ref: `WANSOM-DOC-${Date.now()}`,
      metadata: {
        custom_fields: [
          { display_name: 'Document', variable_name: 'document_type', value: documentTitle || documentType },
          { display_name: 'Jurisdiction', variable_name: 'jurisdiction', value: jurisdictionId },
        ],
      },
      callback: function() {
        setIsExporting(true);
        generateAndDownload()
          .then(() => setShowExportModal(false))
          .catch((err: any) => setExportError(err.message || 'Failed to generate document. Please try again.'))
          .finally(() => setIsExporting(false));
      },
      onClose: () => {},
    }).openIframe();
  };

  return (
    <>
      <SplitView
        left={
          <GuestCanvasInterface
            documentHtml={documentHtml}
            streamingHtml={streamingHtml}
            isGenerating={isGenerating}
            pendingSuggestion={pendingSuggestion}
            onEditorHtmlChange={setCurrentEditorHtml}
            onExportClick={() => setShowExportModal(true)}
            onAcceptSuggestion={handleAcceptSuggestion}
            onRejectSuggestion={handleRejectSuggestion}
          />
        }
        right={
          <GuestChatPanel
            documentHtml={currentEditorHtml || documentHtml}
            jurisdictionId={jurisdictionId}
            documentType={documentType}
            documentTitle={documentTitle}
            documentDescription={documentDescription}
            pendingSuggestion={pendingSuggestion}
            onJurisdictionChange={handleJurisdictionChange}
            onDocumentUpdate={handleDocumentUpdate}
            onAcceptSuggestion={handleAcceptSuggestion}
            onRejectSuggestion={handleRejectSuggestion}
            onCanvasStreamingUpdate={handleCanvasStreamingUpdate}
          />
        }
        defaultLeftWidth={65}
        minLeftWidth={40}
        maxLeftWidth={80}
        className="h-full"
      />

      {/* Export / Payment modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Export Document</h2>
              </div>
              <button
                onClick={() => { setShowExportModal(false); setIsExporting(false); setExportError(''); }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className='px-5 exportmodal-bg pt-20 pb-5 mx-5 rounded-lg bg-cover'>
              <h2 className='text-lg font-medium text-black'>
                {documentTitle || documentType.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </h2>
              <p className="text-md text-black mt-1">
                Get a clean, watermark-free Word document (.docx) formatted for {jurisdiction?.name || 'Nigeria'} law.
              </p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email address <span className="text-gray-400 font-normal">(receipt sent here)</span>
                </label>
                <input
                  type="email"
                  value={exportEmail}
                  onChange={(e) => setExportEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400 focus:ring-1 focus:ring-green-200"
                />
              </div>

              {exportError && (
                <p className="text-sm text-red-600">{exportError}</p>
              )}

              <button
                onClick={handlePayClick}
                disabled={isExporting}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                {isExporting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Generating document…</>
                ) : (
                  `Pay ${pricing.label} & Download`
                )}
              </button>

              <p className="text-xs text-gray-400 text-center">
                Secured by Paystack · No subscription required
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
