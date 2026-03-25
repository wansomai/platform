'use client';

import { useState, useRef } from 'react';
import { apiService } from '@/lib/api';

interface BatchResult {
  email: string;
  status: 'sent' | 'failed';
  error?: string;
}

interface BatchResponse {
  success: boolean;
  offset: number;
  limit: number;
  total: number;
  batchSize: number;
  sent: number;
  failed: number;
  results: BatchResult[];
}

const PLACEHOLDER_HTML = `<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h2>Hi {{firstName}},</h2>
  <p>We have exciting updates to share with you...</p>
  <p>Best regards,<br/>The Wansom Team</p>
</body>
</html>`;

export default function EmailBroadcastPage() {
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [delayMs, setDelayMs] = useState(200);
  const [batchSize, setBatchSize] = useState(50);
  const [showPreview, setShowPreview] = useState(false);

  const [testEmails, setTestEmails] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ sent: string[]; failed: string[] } | null>(null);

  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalSent, setTotalSent] = useState(0);
  const [totalFailed, setTotalFailed] = useState(0);
  const [log, setLog] = useState<BatchResult[]>([]);
  const [error, setError] = useState('');

  const abortRef = useRef(false);

  const appendLog = (results: BatchResult[]) =>
    setLog((prev) => [...prev, ...results]);

  const handleSendTest = async () => {
    if (!subject.trim()) { setError('Subject is required before sending a test.'); return; }
    if (!htmlContent.trim()) { setError('Email HTML is required before sending a test.'); return; }
    const emails = testEmails.split(',').map((e) => e.trim()).filter(Boolean);
    if (emails.length === 0) { setError('Enter at least one test email address.'); return; }
    setError('');
    setTestSending(true);
    setTestResult(null);
    try {
      const response = await apiService.post<{ results: BatchResult[] }>('/api/admin/email-broadcast', {
        subject,
        htmlContent,
        testEmails: emails,
      });
      const sent = response.results.filter((r) => r.status === 'sent').map((r) => r.email);
      const failed = response.results.filter((r) => r.status === 'failed').map((r) => r.email);
      setTestResult({ sent, failed });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test send failed');
    } finally {
      setTestSending(false);
    }
  };

  const handleStart = async () => {
    if (!subject.trim()) { setError('Subject is required.'); return; }
    if (!htmlContent.trim()) { setError('Email HTML content is required.'); return; }
    setError('');
    setRunning(true);
    setDone(false);
    setTotalSent(0);
    setTotalFailed(0);
    setLog([]);
    abortRef.current = false;

    let offset = 0;
    let total = 0;
    let cumulativeSent = 0;
    let cumulativeFailed = 0;

    try {
      do {
        if (abortRef.current) break;

        const response: BatchResponse = await apiService.post('/api/admin/email-broadcast', {
          subject,
          htmlContent,
          offset,
          limit: batchSize,
          delayMs,
        });

        total = response.total;
        cumulativeSent += response.sent;
        cumulativeFailed += response.failed;

        setTotalUsers(total);
        setTotalSent(cumulativeSent);
        setTotalFailed(cumulativeFailed);
        appendLog(response.results);

        offset += response.batchSize;
        if (offset >= total || response.batchSize === 0) break;
      } while (true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setRunning(false);
      setDone(true);
    }
  };

  const progress = totalUsers > 0
    ? Math.round(((totalSent + totalFailed) / totalUsers) * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Email Broadcast</h1>
        <p className="text-gray-600 mt-1">
          Send a product update to all registered users via your SMTP service.
        </p>
      </div>

      {/* Config */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Compose</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. New features in Wansom AI"
            disabled={running}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Email HTML <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3 text-xs">
              <span className="text-gray-400">
                Variables: <code className="bg-gray-100 px-1 rounded">{'{{firstName}}'}</code>{' '}
                <code className="bg-gray-100 px-1 rounded">{'{{fullName}}'}</code>{' '}
                <code className="bg-gray-100 px-1 rounded">{'{{email}}'}</code>
              </span>
              <button
                type="button"
                onClick={() => setShowPreview((v) => !v)}
                className="text-primary-600 hover:underline font-medium"
              >
                {showPreview ? 'Edit' : 'Preview'}
              </button>
            </div>
          </div>

          {showPreview ? (
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-3 py-1.5 text-xs text-gray-500">
                Preview (variables shown as-is)
              </div>
              <iframe
                srcDoc={htmlContent || PLACEHOLDER_HTML}
                className="w-full h-80"
                sandbox="allow-same-origin"
                title="Email preview"
              />
            </div>
          ) : (
            <textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              placeholder={PLACEHOLDER_HTML}
              disabled={running}
              rows={14}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 resize-y"
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Delay between emails (ms)
            </label>
            <input
              type="number"
              value={delayMs}
              onChange={(e) => setDelayMs(Number(e.target.value))}
              min={0}
              max={5000}
              disabled={running}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 mt-1">200ms recommended</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Emails per batch
            </label>
            <input
              type="number"
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              min={1}
              max={100}
              disabled={running}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 mt-1">Keep at 50 for Vercel&apos;s 60s limit</p>
          </div>
        </div>

        {/* Test send */}
        <div className="border border-dashed border-gray-300 rounded-md p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">Send test email</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={testEmails}
              onChange={(e) => setTestEmails(e.target.value)}
              placeholder="you@example.com, colleague@example.com"
              disabled={testSending || running}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleSendTest}
              disabled={testSending || running || !testEmails.trim()}
              className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              {testSending ? 'Sending...' : 'Send Test'}
            </button>
          </div>
          <p className="text-xs text-gray-400">Comma-separate multiple addresses. Subject will be prefixed with [TEST].</p>
          {testResult && (
            <div className="text-xs space-y-1">
              {testResult.sent.length > 0 && (
                <p className="text-green-600">Delivered to: {testResult.sent.join(', ')}</p>
              )}
              {testResult.failed.length > 0 && (
                <p className="text-red-500">Failed: {testResult.failed.join(', ')}</p>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          {!running ? (
            <button
              onClick={handleStart}
              disabled={!subject.trim() || !htmlContent.trim()}
              className="px-6 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {done ? 'Send Again' : 'Start Broadcast'}
            </button>
          ) : (
            <button
              onClick={() => { abortRef.current = true; }}
              className="px-6 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
            >
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      {(running || done) && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              {running ? 'Sending...' : done && !abortRef.current ? 'Complete' : 'Stopped'}
            </h2>
            <span className="text-sm text-gray-500">
              {totalSent + totalFailed} / {totalUsers} users
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex gap-6 text-sm">
            <span className="text-green-600 font-medium">{totalSent} sent</span>
            <span className="text-red-500 font-medium">{totalFailed} failed</span>
            <span className="text-gray-500">{progress}% complete</span>
          </div>

          {log.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Send log</h3>
              <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-md bg-gray-50 divide-y divide-gray-100 text-xs font-mono">
                {log.map((entry, i) => (
                  <div
                    key={i}
                    className={`px-3 py-1.5 flex items-center justify-between gap-4 ${
                      entry.status === 'failed' ? 'bg-red-50 text-red-700' : 'text-gray-700'
                    }`}
                  >
                    <span className="truncate">{entry.email}</span>
                    <span className={entry.status === 'sent' ? 'text-green-600' : 'text-red-500'}>
                      {entry.status === 'sent' ? '✓' : `✗ ${entry.error || 'failed'}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
