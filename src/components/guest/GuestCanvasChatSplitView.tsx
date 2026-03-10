'use client';
// Orchestrates the full guest drafting experience:
// auto-generates the document on mount, manages state, handles the Paystack export gate.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SplitView } from '@/components/layout/SplitView';
import GuestCanvasInterface from './GuestCanvasInterface';
import GuestChatPanel from './GuestChatPanel';
import { JURISDICTIONS } from '@/lib/jurisdictions';
import { X, Download, Loader2 } from 'lucide-react';

interface PendingSuggestion {
  originalHtml: string;
  suggestedHtml: string;
}

interface GuestCanvasChatSplitViewProps {
  documentType: string;
  initialJurisdictionId: string;
  documentTitle?: string;       // freeform title from Sanity (overrides documentType enum)
  documentDescription?: string; // HTML description from Sanity CMS
}

// Pricing per jurisdiction (amount in smallest currency unit for Paystack)
const EXPORT_PRICING: Record<string, { amount: number; currency: string; label: string }> = {
  ng: { amount: 250000, currency: 'NGN', label: '₦2,500' },
  ke: { amount: 35000,  currency: 'KES', label: 'KES 350' },
  za: { amount: 4500,   currency: 'ZAR', label: 'R45' },
  gh: { amount: 7500,   currency: 'GHS', label: 'GHS 75' },
};
const DEFAULT_PRICING = { amount: 500, currency: 'USD', label: '$5' };

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

  const handlePaystackPayment = async () => {
    if (!exportEmail.trim()) {
      setExportError('Please enter your email address.');
      return;
    }

    setExportError('');
    setIsExporting(true);

    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) {
      // Dev fallback: skip payment and export directly
      await downloadDocument(null);
      return;
    }

    // Load Paystack inline JS dynamically
    const loadPaystack = () =>
      new Promise<void>((resolve) => {
        if ((window as any).PaystackPop) { resolve(); return; }
        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.onload = () => resolve();
        document.body.appendChild(script);
      });

    try {
      await loadPaystack();

      const reference = `WANSOM-DRAFT-${Date.now()}`;
      const handler = (window as any).PaystackPop.setup({
        key: publicKey,
        email: exportEmail,
        amount: pricing.amount,
        currency: pricing.currency,
        ref: reference,
        metadata: { documentType, jurisdictionId },
        callback: async (response: { reference: string }) => {
          await downloadDocument(response.reference);
        },
        onClose: () => {
          setIsExporting(false);
        },
      });

      handler.openIframe();
    } catch {
      setExportError('Payment could not be initialised. Please try again.');
      setIsExporting(false);
    }
  };

  const downloadDocument = async (paystackReference: string | null) => {
    const htmlToExport = currentEditorHtml || documentHtml || '';
    if (!htmlToExport) {
      setExportError('No document content to export.');
      setIsExporting(false);
      return;
    }

    try {
      const response = await fetch('/api/public/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paystackReference,
          documentHtml: htmlToExport,
          documentTitle: documentType.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Export failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${documentType}-wansom.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setShowExportModal(false);
      setIsExporting(false);
    } catch (err: any) {
      setExportError(err.message || 'Export failed. Please try again.');
      setIsExporting(false);
    }
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
                <p className="text-sm text-gray-500 mt-0.5">
                  {jurisdiction?.name || 'Nigeria'} — {documentType.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </p>
              </div>
              <button
                onClick={() => { setShowExportModal(false); setIsExporting(false); setExportError(''); }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-start gap-3">
                <Download className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-900">One-time download</p>
                  <p className="text-sm text-green-700 mt-0.5">
                    Get a clean, watermark-free Word document (.docx) formatted for {jurisdiction?.name || 'Nigeria'} law.
                  </p>
                  <p className="text-xl font-bold text-green-700 mt-2">{pricing.label}</p>
                </div>
              </div>

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
                onClick={handlePaystackPayment}
                disabled={isExporting || !exportEmail.trim()}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                {isExporting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
                ) : (
                  <><Download className="h-4 w-4" /> Pay {pricing.label} &amp; Download</>
                )}
              </button>

              <p className="text-xs text-gray-400 text-center">
                Secured by Paystack · No subscription required
              </p>
            </div>

            {/* Upsell */}
            <div className="border-t border-gray-100 px-6 py-4 bg-gray-50 rounded-b-2xl">
              <p className="text-xs text-gray-600 text-center">
                Need multiple documents?{' '}
                <a href="/register" className="text-green-600 font-medium hover:underline">
                  Create a free account
                </a>{' '}
                and get your first month of unlimited drafts.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
