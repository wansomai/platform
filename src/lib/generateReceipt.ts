interface ReceiptData {
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
  logoUrl?: string;
}

function formatAmount(amount: number, currency: string): string {
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

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function receiptNumber(paymentId: string): string {
  // Use last 8 chars of the ID, uppercased
  return `REC-${paymentId.slice(-8).toUpperCase()}`;
}

export function generateReceiptHTML(data: ReceiptData): string {
  const {
    paymentId,
    amount,
    currency,
    status,
    paidAt,
    createdAt,
    planName,
    planPrice,
    billingCycle,
    organizationName,
    logoUrl,
  } = data;

  const dateStr = formatDate(paidAt || createdAt);
  const amountStr = formatAmount(amount, currency);
  const recNum = receiptNumber(paymentId);
  const plan = planName ? `${planName} Plan` : 'Pro Plan';
  const cycle = billingCycle
    ? billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1)
    : '';
  const isPaid = status === 'success';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Receipt ${recNum} — Wansom AI</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #f4f4f5;
      color: #18181b;
      min-height: 100vh;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 40px 16px;
    }

    .page {
      background: #ffffff;
      width: 100%;
      max-width: 600px;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      overflow: hidden;
    }

    /* ── Header ── */
    .header {
      background: linear-gradient(135deg, #1c1917 0%, #292524 100%);
      padding: 32px 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .brand-icon {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 800;
      color: #fff;
      letter-spacing: -1px;
    }

    .brand-name {
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.3px;
    }

    .brand-tagline {
      font-size: 11px;
      color: #a8a29e;
      margin-top: 1px;
    }

    .receipt-label {
      text-align: right;
    }

    .receipt-label .title {
      font-size: 13px;
      font-weight: 600;
      color: #d6d3d1;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .receipt-label .number {
      font-size: 15px;
      font-weight: 700;
      color: #ffffff;
      margin-top: 2px;
      font-family: 'Courier New', monospace;
    }

    /* ── Status banner ── */
    .status-banner {
      padding: 12px 40px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 600;
    }

    .status-banner.paid {
      background: #f0fdf4;
      color: #15803d;
      border-bottom: 1px solid #bbf7d0;
    }

    .status-banner.failed {
      background: #fef2f2;
      color: #b91c1c;
      border-bottom: 1px solid #fecaca;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .paid .status-dot { background: #22c55e; }
    .failed .status-dot { background: #ef4444; }

    /* ── Body ── */
    .body {
      padding: 36px 40px;
    }

    .section-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #71717a;
      margin-bottom: 12px;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 32px;
    }

    .meta-item label {
      font-size: 11px;
      color: #71717a;
      font-weight: 500;
      display: block;
      margin-bottom: 3px;
    }

    .meta-item .value {
      font-size: 14px;
      font-weight: 600;
      color: #18181b;
    }

    /* ── Line items ── */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }

    .items-table thead tr {
      border-bottom: 2px solid #e4e4e7;
    }

    .items-table thead th {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #71717a;
      padding: 0 0 10px;
      text-align: left;
    }

    .items-table thead th:last-child {
      text-align: right;
    }

    .items-table tbody tr {
      border-bottom: 1px solid #f4f4f5;
    }

    .items-table tbody td {
      padding: 14px 0;
      font-size: 14px;
      color: #18181b;
      vertical-align: top;
    }

    .items-table tbody td:last-child {
      text-align: right;
      font-weight: 600;
    }

    .item-name {
      font-weight: 600;
      color: #18181b;
    }

    .item-desc {
      font-size: 12px;
      color: #71717a;
      margin-top: 2px;
    }

    /* ── Total ── */
    .total-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: #fafafa;
      border-radius: 8px;
      border: 1px solid #e4e4e7;
      margin-bottom: 32px;
    }

    .total-label {
      font-size: 14px;
      font-weight: 600;
      color: #3f3f46;
    }

    .total-amount {
      font-size: 22px;
      font-weight: 800;
      color: #18181b;
      letter-spacing: -0.5px;
    }

    /* ── Footer ── */
    .footer {
      border-top: 1px solid #f4f4f5;
      padding: 24px 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .footer-left {
      font-size: 12px;
      color: #a1a1aa;
      line-height: 1.6;
    }

    .footer-left strong {
      color: #71717a;
    }

    .footer-right {
      font-size: 11px;
      color: #a1a1aa;
      text-align: right;
    }

    /* ── Print styles ── */
    @media print {
      body { background: #fff; padding: 0; }
      .page { box-shadow: none; border-radius: 0; max-width: 100%; }
      .no-print { display: none !important; }
    }

  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="brand">
        ${logoUrl
          ? `<img src="${logoUrl}" alt="Wansom AI" style="height:36px;width:auto;object-fit:contain;" />`
          : `<div class="brand-icon">W</div><div><div class="brand-name">Wansom AI</div><div class="brand-tagline">Legal Intelligence Platform</div></div>`
        }
      </div>
      <div class="receipt-label">
        <div class="title">Receipt</div>
        <div class="number">${recNum}</div>
      </div>
    </div>

    <!-- Status banner -->
    <div class="status-banner ${isPaid ? 'paid' : 'failed'}">
      <div class="status-dot"></div>
      ${isPaid ? 'Payment Successful' : `Payment ${status.charAt(0).toUpperCase() + status.slice(1)}`}
    </div>

    <!-- Body -->
    <div class="body">
      <!-- Meta -->
      <div class="meta-grid">
        <div class="meta-item">
          <label>Billed To</label>
          <div class="value">${organizationName}</div>
        </div>
        <div class="meta-item">
          <label>Date</label>
          <div class="value">${dateStr}</div>
        </div>
        <div class="meta-item">
          <label>Receipt Number</label>
          <div class="value" style="font-family: 'Courier New', monospace; font-size: 13px;">${recNum}</div>
        </div>
        <div class="meta-item">
          <label>Payment Method</label>
          <div class="value">Paystack</div>
        </div>
      </div>

      <!-- Line items -->
      <p class="section-title">Summary</p>
      <table class="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div class="item-name">${plan}</div>
              <div class="item-desc">${cycle ? `${cycle} subscription` : 'Subscription'}${planPrice ? ` · ${planPrice}` : ''}</div>
            </td>
            <td>1</td>
            <td>${amountStr}</td>
          </tr>
        </tbody>
      </table>

      <!-- Total -->
      <div class="total-row">
        <span class="total-label">Total Paid</span>
        <span class="total-amount">${amountStr}</span>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-left">
        <strong>Wansom AI</strong><br />
        Legal Intelligence Platform<br />
        support@wansom.ai
      </div>
      <div class="footer-right">
        This is your official receipt.<br />
        Thank you for your subscription.
      </div>
    </div>
  </div>
</body>
</html>`;
}

