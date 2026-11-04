// Devine-Devs/src/lib/format.js

// One way of writing money in the app: R1,234.50 and -R15,127.00.
// Same logic as money() in statementHtml.js, kept separate so that file stays untouched.
export function formatRand(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 'R0.00';
  const [whole, cents] = Math.abs(v).toFixed(2).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${v < 0 ? '-' : ''}R${grouped}.${cents}`;
}
