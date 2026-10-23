// The maths behind the Environmental Partner certificate.
//
// One star per completed year a partner has been with BioLoop. Kept as pure
// functions with no imports so the rule lives in exactly one place: the card
// on screen, the PDF, and anything that comes later all read from here and
// cannot drift apart.
//
// "A year" is deliberately calendar-based rather than 365 days. Someone who
// joined on 29 February should earn their star on the anniversary everyone
// else would name, not three-quarters of a day late, and a partner should
// never see their anniversary slide by a day each leap year.

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** The tier names shown on the certificate, indexed by star count. */
const TIERS = [
  'Founding Partner',   // 0 stars — joined, first year under way
  'Bronze Partner',     // 1
  'Silver Partner',     // 2
  'Gold Partner',       // 3
  'Platinum Partner',   // 4
];

/** Beyond the named tiers, stars keep accruing under one title. */
const TIER_BEYOND = 'Legacy Partner';

/** 11 October 2026 — spelled out, since a certificate is not a table. */
export function longDate(value) {
  const d = toDate(value);
  if (!d) return '';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function toDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * The anniversary in a given year, clamped to the month's real length so
 * 29 February maps to 28 February in common years rather than silently
 * rolling into 1 March the way `new Date(y, 1, 29)` does.
 */
function anniversaryIn(year, joined) {
  const month = joined.getMonth();
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const day = Math.min(joined.getDate(), lastDayOfMonth);
  return new Date(year, month, day);
}

/**
 * Whole years between `joined` and `now`, counted by anniversary.
 * Never negative: a member_since in the future (a typo, a clock skew) reads
 * as a brand-new partner rather than as a negative star count.
 */
export function completedYears(joined, now = new Date()) {
  const start = toDate(joined);
  if (!start || now < start) return 0;

  let years = now.getFullYear() - start.getFullYear();
  if (now < anniversaryIn(now.getFullYear(), start)) years -= 1;
  return Math.max(0, years);
}

/** Whole days since joining, for the "N days with BioLoop" line. */
export function daysSince(joined, now = new Date()) {
  const start = toDate(joined);
  if (!start || now < start) return 0;
  return Math.floor((now - start) / 86400000);
}

/**
 * Everything the card and the PDF need, derived once.
 *
 * `progress` is how far through the current year the partner is, 0..1, by
 * day count between the two surrounding anniversaries — so the bar fills
 * evenly and reaches exactly 1 the day the next star lands.
 */
export function certificateStanding(joined, now = new Date()) {
  const start = toDate(joined);
  if (!start) {
    return {
      valid: false, stars: 0, tier: TIERS[0], days: 0,
      progress: 0, daysToNextStar: null, nextStarOn: null, joined: null,
    };
  }

  const stars = completedYears(start, now);
  const lastAnniversary = stars === 0 ? start : anniversaryIn(start.getFullYear() + stars, start);
  const nextAnniversary = anniversaryIn(start.getFullYear() + stars + 1, start);

  const span = nextAnniversary - lastAnniversary;
  const done = now - lastAnniversary;
  const progress = span > 0 ? Math.min(1, Math.max(0, done / span)) : 0;

  return {
    valid: true,
    stars,
    tier: stars < TIERS.length ? TIERS[stars] : TIER_BEYOND,
    days: daysSince(start, now),
    progress,
    daysToNextStar: Math.max(0, Math.ceil((nextAnniversary - now) / 86400000)),
    nextStarOn: nextAnniversary,
    joined: start,
  };
}

/** "2 years, 4 months" — the human way to say how long someone has stayed. */
export function membershipLength(joined, now = new Date()) {
  const start = toDate(joined);
  if (!start || now < start) return 'Just joined';

  const years = completedYears(start, now);
  const afterYears = anniversaryIn(start.getFullYear() + years, start);

  let months = (now.getFullYear() - afterYears.getFullYear()) * 12
    + (now.getMonth() - afterYears.getMonth());
  if (now.getDate() < afterYears.getDate()) months -= 1;
  months = Math.max(0, months);

  const parts = [];
  if (years > 0) parts.push(`${years} year${years === 1 ? '' : 's'}`);
  if (months > 0) parts.push(`${months} month${months === 1 ? '' : 's'}`);
  if (parts.length === 0) return `${daysSince(start, now)} days`;
  return parts.join(', ');
}
