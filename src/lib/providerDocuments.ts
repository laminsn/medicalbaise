export type ReceiptInvoiceDocument = {
  invoiceNumber?: string | null;
  clientDisplayId?: string | null;
  serviceDescription?: string | null;
  invoiceType?: string | null;
  paymentStatus?: string | null;
  totalAmount?: number | string | null;
  currency?: string | null;
  issuedAt?: string | null;
  dueAt?: string | null;
  paidAt?: string | null;
  transactionId?: string | null;
  transactionStatus?: string | null;
  transactionType?: string | null;
  paymentMethod?: string | null;
  processedAt?: string | null;
  providerName?: string | null;
  clientName?: string | null;
};

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const formatMoney = (amount: ReceiptInvoiceDocument['totalAmount'], currency?: string | null) => {
  const numericAmount = Number(amount || 0);
  const currencyCode = (currency || 'BRL').toUpperCase();

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
    }).format(numericAmount);
  } catch {
    return `${currencyCode} ${numericAmount.toFixed(2)}`;
  }
};

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const sanitizeFileSegment = (value?: string | null) =>
  String(value || 'record')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'record';

const row = (label: string, value?: string | number | null) => `
  <tr>
    <th>${escapeHtml(label)}</th>
    <td>${escapeHtml(value || 'Not recorded')}</td>
  </tr>
`;

export function downloadReceiptInvoiceDocument(record: ReceiptInvoiceDocument) {
  const recordId = record.invoiceNumber || record.transactionId || `baise-${Date.now()}`;
  const serviceDescription = record.serviceDescription || 'Service transaction';
  const amount = formatMoney(record.totalAmount, record.currency);
  const title = record.paymentStatus === 'paid' ? 'Receipt' : 'Invoice';

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Baise ${escapeHtml(title)} ${escapeHtml(recordId)}</title>
  <style>
    :root {
      color-scheme: light;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #111827;
      background: #f8fafc;
    }
    body {
      margin: 0;
      padding: 32px;
      background: #f8fafc;
    }
    main {
      max-width: 760px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 32px;
      box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
    }
    header {
      display: flex;
      gap: 20px;
      justify-content: space-between;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    h1 {
      margin: 0;
      font-size: 28px;
      line-height: 1.15;
    }
    .muted {
      color: #6b7280;
      font-size: 13px;
    }
    .amount {
      text-align: right;
      font-size: 28px;
      font-weight: 800;
      white-space: nowrap;
    }
    .status {
      display: inline-flex;
      align-items: center;
      margin-top: 8px;
      border: 1px solid #bfdbfe;
      border-radius: 999px;
      padding: 4px 10px;
      color: #1d4ed8;
      background: #eff6ff;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
    }
    th,
    td {
      border-bottom: 1px solid #eef2f7;
      padding: 12px 0;
      text-align: left;
      vertical-align: top;
      font-size: 14px;
    }
    th {
      width: 34%;
      color: #4b5563;
      font-weight: 700;
    }
    .service {
      margin: 0 0 16px;
      color: #374151;
      line-height: 1.6;
    }
    footer {
      margin-top: 28px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 12px;
      text-align: center;
    }
    @media print {
      body { padding: 0; background: #ffffff; }
      main { box-shadow: none; border: 0; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <p class="muted">Baise provider transaction record</p>
        <h1>${escapeHtml(title)} ${escapeHtml(record.invoiceNumber || '')}</h1>
        <span class="status">${escapeHtml(record.paymentStatus || record.transactionStatus || 'recorded')}</span>
      </div>
      <div class="amount">${escapeHtml(amount)}</div>
    </header>

    <p class="service">${escapeHtml(serviceDescription)}</p>

    <table aria-label="Receipt and invoice details">
      <tbody>
        ${row('Invoice number', record.invoiceNumber)}
        ${row('Client ID', record.clientDisplayId)}
        ${row('Client', record.clientName)}
        ${row('Provider', record.providerName)}
        ${row('Invoice type', record.invoiceType)}
        ${row('Payment status', record.paymentStatus)}
        ${row('Issued', formatDateTime(record.issuedAt))}
        ${row('Due', formatDateTime(record.dueAt))}
        ${row('Paid', formatDateTime(record.paidAt))}
        ${row('Transaction ID', record.transactionId)}
        ${row('Transaction status', record.transactionStatus)}
        ${row('Transaction type', record.transactionType)}
        ${row('Payment method', record.paymentMethod)}
        ${row('Processed', formatDateTime(record.processedAt))}
      </tbody>
    </table>

    <footer>
      Generated from Baise transaction history. Baise branding is included for record continuity.
    </footer>
  </main>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `baise-${sanitizeFileSegment(title)}-${sanitizeFileSegment(recordId)}.html`;
  link.click();
  URL.revokeObjectURL(url);
}
