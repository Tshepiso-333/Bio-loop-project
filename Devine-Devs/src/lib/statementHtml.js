// Print-ready HTML for statements and receipts.
//
// expo-print turns this into a PDF on the device, so it must stand on its own:
// no app fonts (the PDF renderer has no access to them — web-safe stacks
// only), no external assets, no JavaScript. Colours follow the app's forest
// green so a downloaded statement looks like the product it came from.
//
// Anything user- or database-supplied goes through esc() before it reaches
// the markup.

const GREEN = '#15643E';
const GREEN_DARK = '#0F4D30';
const INK = '#122A1F';
const MUTED = '#6B7F75';
const BORDER = '#E4EDE7';
const TINT = '#F5F8F6';

const ROLE_TITLES = {
  restaurant: 'Payout statement',
  collector: 'Earnings statement',
  manufacturer: 'Payment statement',
  admin: 'Platform statement',
};

/** Escapes text for HTML. Everything interpolated below passes through here. */
function esc(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Formats money without Intl. toLocaleString is avoided deliberately:
 * 'en-ZA' renders 88.55 as "88,55", and Hermes on device ships a reduced
 * Intl, so the same statement could format differently on a phone than
 * anywhere else. This produces R1,234,567.50 everywhere, matching how
 * amounts already read elsewhere in the app.
 */
function money(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 'R0.00';
  const [whole, cents] = Math.abs(v).toFixed(2).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${v < 0 ? '-' : ''}R${grouped}.${cents}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 11 Oct 2026. Built by hand for the same reason money() is. */
function shortDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function baseStyles() {
  return `
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: ${INK};
      margin: 0;
      padding: 32px 30px 40px;
      font-size: 12px;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
    }
    .head {
      display: flex; justify-content: space-between; align-items: flex-start;
      border-bottom: 3px solid ${GREEN}; padding-bottom: 16px; margin-bottom: 22px;
    }
    .brand { font-size: 23px; font-weight: 700; color: ${GREEN}; letter-spacing: .5px; }
    .brand small { display: block; font-size: 10.5px; font-weight: 400; color: ${MUTED};
      letter-spacing: .3px; margin-top: 3px; }
    .doc { text-align: right; }
    .doc h1 { margin: 0; font-size: 15px; font-weight: 600; color: ${INK}; }
    .doc p { margin: 3px 0 0; font-size: 10.5px; color: ${MUTED}; }
    .meta { display: flex; gap: 26px; margin-bottom: 20px; flex-wrap: wrap; }
    .meta div { font-size: 10.5px; color: ${MUTED}; }
    .meta b { display: block; color: ${INK}; font-size: 12px; font-weight: 600; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
    th {
      text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: .7px;
      color: ${MUTED}; font-weight: 600; padding: 0 8px 7px; border-bottom: 1px solid ${BORDER};
    }
    td { padding: 9px 8px; border-bottom: 1px solid ${BORDER}; font-size: 11.5px; vertical-align: top; }
    tr:nth-child(even) td { background: ${TINT}; }
    .num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .ref { color: ${MUTED}; font-family: "SF Mono", Menlo, Consolas, monospace; font-size: 10.5px; }
    .neg { color: #B4232A; }
    .tag { font-size: 9px; text-transform: uppercase; letter-spacing: .5px; color: #B06A00; }
    .totals { margin-left: auto; width: 62%; border-top: 2px solid ${GREEN}; padding-top: 10px; }
    .totals div { display: flex; justify-content: space-between; padding: 4px 8px; font-size: 11.5px; }
    .totals .strong { font-weight: 700; font-size: 13.5px; color: ${GREEN_DARK};
      border-top: 1px solid ${BORDER}; margin-top: 4px; padding-top: 8px; }
    .empty { padding: 34px; text-align: center; color: ${MUTED}; background: ${TINT};
      border: 1px solid ${BORDER}; border-radius: 8px; }
    .foot { margin-top: 26px; padding-top: 12px; border-top: 1px solid ${BORDER};
      font-size: 9.5px; color: ${MUTED}; line-height: 1.6; }
  `;
}

function header(docTitle, subtitle) {
  return `
    <div class="head">
      <div class="brand">BioLoop<small>Used cooking oil collection</small></div>
      <div class="doc">
        <h1>${esc(docTitle)}</h1>
        <p>${esc(subtitle)}</p>
      </div>
    </div>`;
}

function footer(extra) {
  return `
    <div class="foot">
      ${extra ? `${esc(extra)}<br/>` : ''}
      Generated by BioLoop on ${esc(shortDate(new Date().toISOString()))}. Figures are taken
      directly from the transaction records that produced them, so this statement always matches
      the balances shown in the app.
    </div>`;
}

/**
 * @param statement the object returned by statementService.getStatement
 * @param accountName whose statement it is, for the header
 */
export function statementHtml(statement, accountName) {
  const { role, rows = [], columns = [], totals = [], from, to, periodDays } = statement ?? {};
  const title = ROLE_TITLES[role] ?? 'Statement';

  const head = columns.map((c) => `<th class="${/amount|paid|received/i.test(c) ? 'num' : ''}">${esc(c)}</th>`).join('');

  const body = rows.length
    ? rows
        .map((r) => {
          const amountClass = r.amount < 0 ? 'num neg' : 'num';
          const tag = r.pending
            ? ' <span class="tag">pending</span>'
            : r.settled === false
              ? ' <span class="tag">unpaid</span>'
              : '';
          return `<tr>
            <td>${esc(shortDate(r.date))}</td>
            <td class="ref">${esc(r.reference)}</td>
            <td>${esc(r.description)}${tag}</td>
            <td class="num">${r.liters != null ? `${esc(r.liters)} L` : ''}</td>
            <td class="${amountClass}">${esc(money(r.amount))}</td>
          </tr>`;
        })
        .join('')
    : '';

  const totalsBlock = totals.length
    ? `<div class="totals">${totals
        .map(
          (t) =>
            `<div class="${t.strong ? 'strong' : ''}"><span>${esc(t.label)}</span><span${
              t.value < 0 ? ' class="neg"' : ''
            }>${esc(money(t.value))}</span></div>`
        )
        .join('')}</div>`
    : '';

  return `<!doctype html>
<html><head><meta charset="utf-8"/><style>${baseStyles()}</style></head>
<body>
  ${header(title, `${esc(shortDate(from))} — ${esc(shortDate(to))}`)}
  <div class="meta">
    <div>Account<b>${esc(accountName || '—')}</b></div>
    <div>Period<b>Last ${esc(periodDays)} days</b></div>
    <div>Entries<b>${rows.length}</b></div>
  </div>
  ${
    rows.length
      ? `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>${totalsBlock}`
      : `<div class="empty">No transactions in this period.</div>`
  }
  ${footer('')}
</body></html>`;
}

/** A one-pickup receipt, from a platform_ledger row. */
export function receiptHtml(ledger, accountName) {
  const ref = String(ledger?.pickup_id ?? '').slice(0, 8).toUpperCase();
  const line = (label, value, strong) =>
    `<div class="${strong ? 'strong' : ''}"><span>${esc(label)}</span><span>${esc(money(value))}</span></div>`;

  return `<!doctype html>
<html><head><meta charset="utf-8"/><style>${baseStyles()}</style></head>
<body>
  ${header('Receipt', `No. ${esc(ref)} · ${esc(shortDate(ledger?.occurred_at))}`)}
  <div class="meta">
    <div>Paid by<b>${esc(ledger?.manufacturer_name ?? accountName ?? '—')}</b></div>
    <div>Collected from<b>${esc(ledger?.restaurant_name ?? '—')}</b></div>
    <div>Driver<b>${esc(ledger?.driver_name ?? '—')}</b></div>
  </div>
  <table>
    <thead><tr><th>Description</th><th class="num">Litres</th><th class="num">Grade</th><th class="num">Amount</th></tr></thead>
    <tbody><tr>
      <td>Used cooking oil collection</td>
      <td class="num">${esc(ledger?.liters ?? '')} L</td>
      <td class="num">${esc(ledger?.quality_grade ?? '—')}</td>
      <td class="num">${esc(money(ledger?.received))}</td>
    </tr></tbody>
  </table>
  <div class="totals">
    ${line('Paid to restaurant', ledger?.to_restaurant)}
    ${line('Paid to driver', ledger?.to_driver)}
    ${line('Platform fee', ledger?.platform_kept)}
    ${line('Total paid', ledger?.received, true)}
  </div>
  ${footer(
    ledger?.m_payment_id ? `Payment reference ${ledger.m_payment_id}` : ''
  )}
</body></html>`;
}
