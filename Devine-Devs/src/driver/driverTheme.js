// Driver design tokens — forest-green system matching Auth + Onboarding + Restaurant.
// Single source of truth for the Driver module. Brand green is pulled from the
// onboarding tokens so #15643E never appears as a magic value.

import { ONB_COLORS, ONB_FONTS } from '../onboarding/onboardingTokens';

export const DRV_COLORS = {
  // Brand
  primary: ONB_COLORS.primary,       // '#15643E' forest green
  primaryMid: ONB_COLORS.primaryMid, // '#2E8B5A' mid green (in-progress, accents)
  accent: ONB_COLORS.accent,         // '#79C39A' light green (rings, progress)
  accentSoft: ONB_COLORS.accentSoft, // '#9FD3B3'
  primaryShadow: 'rgba(21,100,62,0.32)',

  // Text
  ink: '#122A1F',        // headings / primary text
  body: '#6B7F75',       // body copy + labels
  muted: '#A9B5AD',      // captions, disabled, placeholder icons

  // Surfaces
  page: '#F6F8F7',       // screen background
  card: '#FFFFFF',
  surfaceSoft: '#F5F8F6',   // inset fills
  paleGreen: '#E7F1EB',     // icon circles, chips
  selectedBg: '#F2F8F4',    // selected / active fill
  border: '#E4EDE7',
  divider: '#E4EDE7',

  // Semantic (kept — do not forest-green these)
  alertBg: '#FFF1F1', alertBorder: '#FECACA', alertText: '#DC2626',
  warnBg: '#FFF7ED', warnBorder: '#FED7AA', warnText: '#C2410C',
  positive: '#15643E', negative: '#DC2626', amber: '#F59E0B',

  white: '#FFFFFF',
};

// Pickup status → visual treatment. One place, used by DriverStatusBadge,
// the collections card accent, and the map pins.
export const DRV_STATUS = {
  pending:     { label: 'Pending',     fg: '#C2410C',              bg: '#FFF7ED' },
  in_progress: { label: 'In progress', fg: DRV_COLORS.primaryMid,  bg: DRV_COLORS.paleGreen },
  completed:   { label: 'Completed',   fg: DRV_COLORS.primary,     bg: DRV_COLORS.selectedBg },
};

export const DRV_FONTS = {
  extraBold: ONB_FONTS.extraBold, // big numbers, screen titles
  bold: ONB_FONTS.bold,           // card titles, buttons
  semiBold: ONB_FONTS.semiBold,   // labels
  medium: ONB_FONTS.medium,       // body
  regular: ONB_FONTS.regular,
};

export const DRV_SHADOWS = {
  card: {
    shadowColor: '#122A1F', shadowOpacity: 0.06, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 3,
  },
  button: {
    shadowColor: DRV_COLORS.primary, shadowOpacity: 0.32, shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 }, elevation: 8,
  },
  floating: {
    shadowColor: '#122A1F', shadowOpacity: 0.12, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
};

export const DRV_RADII = { card: 18, chip: 12, pill: 30, input: 18 };
export const DRV_SPACING = { screenPadding: 20, cardPadding: 18, gap: 12 };
