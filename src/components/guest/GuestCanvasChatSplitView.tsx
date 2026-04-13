'use client';
// Orchestrates the full guest drafting experience:
// auto-generates the document on mount, manages state, handles the Paystack export gate.
import React, { useState, useEffect, useCallback } from 'react';
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
  templateUrl?: string;
}

interface PaymentConfig {
  amount: number;
  currency: string;
  label: string;
  channels: string[];
  publicKey: string;
}

// Placeholder HTML shown (blurred/masked) when there is no template.
// Looks like a real document so the mask feels convincing.
const MASKED_PLACEHOLDER_HTML = `
<h1>LEGAL AGREEMENT</h1>
<p>This Agreement is entered into as of the date of acceptance between the parties identified herein and governs the terms and conditions set forth below.</p>
<h2>1. DEFINITIONS</h2>
<p>"Confidential Information" means any non-public information disclosed by one party to the other, either directly or indirectly, in writing, orally or by inspection of tangible objects.</p>
<p>"Effective Date" means the date upon which both parties have executed this Agreement or the date the recipient first receives any Confidential Information, whichever is earlier.</p>
<h2>2. OBLIGATIONS OF RECEIVING PARTY</h2>
<p>The Receiving Party agrees to: (a) hold the Confidential Information in strict confidence; (b) not to disclose the Confidential Information to any third parties; (c) use the Confidential Information solely for the purposes described herein.</p>
<h2>3. TERM AND TERMINATION</h2>
<p>This Agreement shall commence on the Effective Date and shall continue in full force and effect for a period of two (2) years, unless earlier terminated by either party upon thirty (30) days written notice to the other party.</p>
<h2>4. GOVERNING LAW</h2>
<p>This Agreement shall be governed by and construed in accordance with the laws of the applicable jurisdiction, without regard to its conflict of law provisions.</p>
<h2>5. ENTIRE AGREEMENT</h2>
<p>This Agreement constitutes the entire agreement between the parties with respect to the subject matter hereof and supersedes all prior and contemporaneous agreements and understandings.</p>
`;

export default function GuestCanvasChatSplitView({
  documentType,
  initialJurisdictionId,
  documentTitle,
  documentDescription,
  templateUrl,
}: GuestCanvasChatSplitViewProps) {
  const [documentHtml, setDocumentHtml] = useState<string | null>(null);
  const [streamingHtml, setStreamingHtml] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [isMasked, setIsMasked] = useState(false);
  const [currentEditorHtml, setCurrentEditorHtml] = useState<string>('');
  const [jurisdictionId, setJurisdictionId] = useState(initialJurisdictionId);
  const [pendingSuggestion, setPendingSuggestion] = useState<PendingSuggestion | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportEmail, setExportEmail] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  // On mount: fetch payment config + load canvas content in parallel, then open export modal
  useEffect(() => {
    const init = async () => {
      const minSkeleton = new Promise<void>((res) => setTimeout(res, 2500));

      // Fetch payment config in parallel — ready before modal opens
      const configPromise = fetch('/api/public/export-payment-config')
        .then((r) => r.json())
        .then((json) => { if (json.data) setPaymentConfig(json.data); })
        .catch(() => { /* Keep null — handlePayClick will surface error */ })
        .finally(() => setIsLoadingConfig(false));

      if (templateUrl) {
        try {
          const [result] = await Promise.all([
            fetch('/api/public/fetch-template', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ templateUrl, mode: 'html' }),
            }).then(async (r) => {
              const data = await r.json();
              if (!r.ok) {
                console.error('[fetch-template]', r.status, data);
                return null;
              }
              return data.html as string | null;
            }),
            minSkeleton,
            configPromise,
          ]);

          if (result && result.trim().length > 50) {
            setDocumentHtml(result);
          } else {
            // .doc file or empty conversion — show masked but templateUrl still used for download
            setDocumentHtml(MASKED_PLACEHOLDER_HTML);
            setIsMasked(true);
          }
        } catch (err) {
          console.error('[fetch-template] unexpected:', err);
          await Promise.all([minSkeleton, configPromise]);
          setDocumentHtml(MASKED_PLACEHOLDER_HTML);
          setIsMasked(true);
        }
      } else {
        // No template — show masked placeholder
        await Promise.all([minSkeleton, configPromise]);
        setDocumentHtml(MASKED_PLACEHOLDER_HTML);
        setIsMasked(true);
      }

      setIsGenerating(false);
      setShowExportModal(true);
    };

    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Called post-payment for non-template docs: generates with Gemini then exports
  const generateAndExport = async (jId: string) => {
    setIsExporting(true);
    setIsMasked(false);
    setIsGenerating(true);
    setDocumentHtml(null);
    setStreamingHtml(null);

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
            // Ignore
          }
        }
      }

      // Export generated document
      if (accumulated) {
        await exportHtmlAsDocx(accumulated);
      }
    } catch (err: any) {
      setExportError(err.message || 'Failed to generate document. Please try again.');
    } finally {
      setIsGenerating(false);
      setIsExporting(false);
    }
  };

  const handleJurisdictionChange = (newId: string) => {
    setJurisdictionId(newId);
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

  const jurisdiction = JURISDICTIONS.find((j) => j.id === jurisdictionId);

  const exportHtmlAsDocx = async (html: string) => {
    const title = documentTitle || documentType.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const cleanBody = html
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

  // Download template file via proxy (handles cross-origin download attribute)
  const downloadTemplateFile = async () => {
    if (!templateUrl) throw new Error('No template URL');
    const response = await fetch('/api/public/fetch-template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateUrl, mode: 'download' }),
    });
    if (!response.ok) throw new Error('Failed to fetch template file');
    const blob = await response.blob();
    const title = documentTitle || documentType.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const filename = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '.docx';
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

    if (!paymentConfig) {
      setExportError('Payment configuration is still loading. Please try again in a moment.');
      return;
    }

    // Load Paystack inline script once
    await new Promise<void>((resolve) => {
      if ((window as any).PaystackPop) { resolve(); return; }
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.onload = () => resolve();
      document.body.appendChild(script);
    });

    (window as any).PaystackPop.setup({
      key: paymentConfig.publicKey,
      email: exportEmail,
      amount: paymentConfig.amount,
      currency: paymentConfig.currency,
      channels: paymentConfig.channels,
      ref: `WANSOM-DOC-${Date.now()}`,
      metadata: {
        custom_fields: [
          { display_name: 'Document', variable_name: 'document_type', value: documentTitle || documentType },
          { display_name: 'Jurisdiction', variable_name: 'jurisdiction', value: jurisdictionId },
        ],
      },
      callback: async function() {
        setShowExportModal(false);
        if (templateUrl) {
          // Template exists — download original file directly
          setIsExporting(true);
          downloadTemplateFile()
            .catch((err: any) => setExportError(err.message || 'Failed to download template.'))
            .finally(() => setIsExporting(false));
        } else {
          // No template — generate with Gemini and export
          await generateAndExport(jurisdictionId);
        }
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
            isMasked={isMasked}
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
                disabled={isExporting || isLoadingConfig}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                {isExporting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Generating document…</>
                ) : isLoadingConfig ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Loading…</>
                ) : (
                  `Pay ${paymentConfig?.label ?? '…'} & Download`
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
