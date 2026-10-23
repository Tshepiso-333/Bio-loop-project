// Print-ready HTML for the Environmental Partner certificate.
//
// Same rules as statementHtml.js: expo-print renders this on the device with
// no access to the app's fonts and no network, so everything is web-safe
// stacks, inline CSS and plain characters. The stars are text, not images,
// for exactly that reason.
//
// Anything user- or database-supplied goes through esc() before it reaches
// the markup.

const GREEN = '#15643E';
const GREEN_DARK = '#0F4D30';
const GOLD = '#B7892F';
const INK = '#122A1F';
const MUTED = '#6B7F75';
const BORDER = '#E4EDE7';

const ROLE_WORDS = {
  restaurant: 'has diverted used cooking oil from drains and landfill',
  collector: 'has collected and delivered used cooking oil for recycling',
  manufacturer: 'has processed used cooking oil into clean biodiesel',
  admin: 'has supported the BioLoop collection network',
};

function esc(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** 1,234 — grouped by hand, for the reasons statementHtml.money() explains. */
function number(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '0';
  return Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Filled stars up to `earned`, hollow for the year in progress. */
function starRow(earned) {
  const filled = Math.max(0, Math.min(earned, 12));
  if (filled === 0) {
    return `<div style="font-size:30px;color:${BORDER};letter-spacing:10px">&#9734;</div>`;
  }
  return `<div style="font-size:30px;color:${GOLD};letter-spacing:10px">${'&#9733;'.repeat(filled)}</div>`;
}

function statBlock(value, label) {
  return `
    <td style="text-align:center;padding:0 14px">
      <div style="font-size:21px;font-weight:bold;color:${GREEN}">${value}</div>
      <div style="font-size:9px;letter-spacing:1.4px;text-transform:uppercase;color:${MUTED};margin-top:4px">${esc(label)}</div>
    </td>`;
}

/**
 * @param standing  the object from partnerCertificate.certificateStanding()
 * @param info      { accountName, role, litres, collections, co2Kg,
 *                    joinedLabel, lengthLabel, issuedLabel, reference }
 */
export function certificateHtml(standing, info = {}) {
  const {
    accountName = 'BioLoop Partner',
    role = 'restaurant',
    litres = 0,
    collections = 0,
    co2Kg = null,
    joinedLabel = '',
    lengthLabel = '',
    issuedLabel = '',
    reference = '',
  } = info;

  const stats = [
    statBlock(number(litres), 'Litres diverted'),
    statBlock(number(collections), 'Collections'),
    co2Kg ? statBlock(`${number(co2Kg)} kg`, 'CO2 saved') : '',
    statBlock(number(standing.days), 'Days with us'),
  ].join('');

  return `<!doctype html>
<html><head><meta charset="utf-8" />
<style>
  @page { size: A4 landscape; margin: 0; }
  body { margin:0; font-family: Georgia, 'Times New Roman', serif; color:${INK};
         -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .sheet { box-sizing:border-box; width:100%; padding:11mm;
           background:#FFFFFF; }
  /* The frame takes the page's remaining height and centres its contents, so
     the certificate fills the sheet instead of crowding into the top third.
     min-height rather than height: a long business name or an extra stat
     should push the border down, never spill outside it. */
  .frame { box-sizing:border-box; min-height:174mm; border:2px solid ${GREEN};
           padding:9mm 12mm; display:flex; flex-direction:column;
           justify-content:center; }
  .rule { width:60px; height:3px; background:${GOLD}; margin:14px auto; }
</style></head>
<body><div class="sheet"><div class="frame">

  <div style="text-align:center">
    <div style="font-size:11px;letter-spacing:4px;text-transform:uppercase;color:${GREEN};font-family:Helvetica,Arial,sans-serif">
      BioLoop
    </div>
    <div style="font-size:27px;font-weight:bold;color:${GREEN_DARK};margin-top:10px">
      Certificate of Environmental Partnership
    </div>
    <div class="rule"></div>
  </div>

  <div style="text-align:center;margin-top:16px">
    <div style="font-size:11px;color:${MUTED};font-family:Helvetica,Arial,sans-serif">
      This certifies that
    </div>
    <div style="font-size:33px;font-weight:bold;color:${INK};margin:10px 0 6px">
      ${esc(accountName)}
    </div>
    ${starRow(standing.stars)}
    <div style="font-size:12px;letter-spacing:2.6px;text-transform:uppercase;color:${GOLD};font-family:Helvetica,Arial,sans-serif;margin-top:6px">
      ${esc(standing.tier)}
    </div>
  </div>

  <div style="text-align:center;margin-top:16px;font-size:13px;line-height:1.7;color:${INK}">
    ${esc(ROLE_WORDS[role] ?? ROLE_WORDS.restaurant)}<br />
    as a partner in the BioLoop collection network since
    <strong>${esc(joinedLabel)}</strong>${lengthLabel ? ` &mdash; ${esc(lengthLabel)}` : ''}.
  </div>

  <table style="width:100%;margin-top:20px;border-collapse:collapse"><tr>${stats}</tr></table>

  <table style="width:100%;margin-top:26px;border-top:1px solid ${BORDER};padding-top:10px">
    <tr>
      <td style="font-size:9.5px;color:${MUTED};font-family:Helvetica,Arial,sans-serif;padding-top:10px">
        Issued ${esc(issuedLabel)}${reference ? `<br />Reference ${esc(reference)}` : ''}
      </td>
      <td style="text-align:right;font-size:9.5px;color:${MUTED};font-family:Helvetica,Arial,sans-serif;padding-top:10px">
        One star is awarded for each completed year of partnership.<br />
        Figures are drawn from completed collections on record.
      </td>
    </tr>
  </table>

</div></div></body></html>`;
}
