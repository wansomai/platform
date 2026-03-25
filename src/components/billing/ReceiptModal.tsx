'use client';

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, AlertCircle, Download, X } from 'lucide-react';
import { generateReceiptHTML } from '@/lib/generateReceipt';

export interface ReceiptData {
  paymentId: string;
  amount: number;
  currency: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
  planName: string | null | undefined;
  planPrice: string | null | undefined;
  billingCycle: string | null | undefined;
  organizationName: string;
}

interface ReceiptModalProps {
  open: boolean;
  onClose: () => void;
  data: ReceiptData | null;
}

function fmt(amount: number, currency: string) {
  const major = amount / 100;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    }).format(major);
  } catch {
    return `${currency.toUpperCase()} ${major.toFixed(2)}`;
  }
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function receiptNumber(id: string) {
  return `REC-${id.slice(-8).toUpperCase()}`;
}

export default function ReceiptModal({ open, onClose, data }: ReceiptModalProps) {
  if (!data) return null;

  const isPaid = data.status === 'success';
  const recNum = receiptNumber(data.paymentId);
  const dateStr = fmtDate(data.paidAt || data.createdAt);
  const amountStr = fmt(data.amount, data.currency);
  const plan = data.planName ? `${data.planName} Plan` : 'Pro Plan';
  const cycle = data.billingCycle
    ? data.billingCycle.charAt(0).toUpperCase() + data.billingCycle.slice(1)
    : '';

  const handlePrint = () => {
    const html = generateReceiptHTML({
      ...data,
      logoUrl: `${window.location.origin}/logo-lg.png`,
    });
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0';
    iframe.src = url;
    document.body.appendChild(iframe);

    iframe.addEventListener('load', () => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      }, 500);
    }, { once: true });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <DialogTitle className="sr-only">Receipt {recNum}</DialogTitle>
        {/* Header */}
        <div className="bg-gradient-to-br from-stone-900 to-stone-800 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-lg.png" alt="Wansom AI" className="h-8 w-auto object-contain" />
          </div>
          <div className="text-right">
            <p className="text-stone-400 text-xs uppercase tracking-widest font-semibold">Receipt</p>
            <p className="text-white font-mono font-bold text-sm mt-0.5">{recNum}</p>
          </div>
        </div>

        {/* Status bar */}
        <div className={`flex items-center gap-2 px-6 py-2.5 text-sm font-semibold border-b ${
          isPaid
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
            : 'bg-red-50 text-red-700 border-red-100'
        }`}>
          {isPaid
            ? <CheckCircle2 className="h-4 w-4" />
            : <AlertCircle className="h-4 w-4" />
          }
          {isPaid ? 'Payment Successful' : `Payment ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}`}
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            {[
              { label: 'Billed To', value: data.organizationName },
              { label: 'Date', value: dateStr },
              { label: 'Receipt No.', value: recNum, mono: true },
              { label: 'Payment Method', value: 'Paystack' },
            ].map(({ label, value, mono }) => (
              <div key={label}>
                <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
                <p className={`text-sm font-semibold text-gray-900 ${mono ? 'font-mono' : ''}`}>{value}</p>
              </div>
            ))}
          </div>

          <Separator />

          {/* Line item */}
          <div>
            <div className="flex justify-between text-xs font-semibold uppercase tracking-wide text-gray-400 pb-2 border-b">
              <span>Description</span>
              <span>Amount</span>
            </div>
            <div className="flex justify-between items-start py-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">{plan}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {cycle ? `${cycle} subscription` : 'Subscription'}
                  {data.planPrice ? ` · ${data.planPrice}` : ''}
                </p>
              </div>
              <p className="text-sm font-bold text-gray-900">{amountStr}</p>
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
            <span className="text-sm font-semibold text-gray-600">Total Paid</span>
            <span className="text-xl font-extrabold text-gray-900 tracking-tight">{amountStr}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex items-center justify-between">
          <p className="text-xs text-gray-400 leading-relaxed">
            Questions? <span className="text-gray-500 font-medium">support@wansom.ai</span>
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-3.5 w-3.5 mr-1.5" />
              Close
            </Button>
            <Button size="sm" onClick={handlePrint} className="bg-stone-900 hover:bg-stone-800 text-white">
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Save as PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
