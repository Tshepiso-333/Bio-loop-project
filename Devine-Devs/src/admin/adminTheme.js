// Admin design tokens — same forest-green system as Auth/Onboarding/Restaurant,
// so the Admin module stops looking like a different app. Base palette, fonts,
// spacing, and shadow style all come from the shared onboarding tokens; the
// only admin-specific additions are the extra status accents (blue/amber/red)
// the operations screens need for pickup/withdrawal/alert states.

import { ONB_COLORS, ONB_FONTS } from '../onboarding/onboardingTokens';

export const ADMIN_COLORS = {
  // Brand
  primary: ONB_COLORS.primary,       // '#15643E' forest green
  primaryMid: ONB_COLORS.primaryMid, // '#2E8B5A' mid green (charts, secondary accents)
  accent: ONB_COLORS.accent,         // '#79C39A' light green
  accentSoft: ONB_COLORS.accentSoft, // '#9FD3B3'
  primaryShadow: 'rgba(21,100,62,0.32)',

  // Text
  ink: '#122A1F',        // headings / primary text
  body: '#6B7F75',       // body copy + labels
  muted: '#A9B5AD',      // captions, disabled, placeholder icons

  // Surfaces
  page: '#F6F8F7',       // screen background (calm green-tinted neutral)
  card: '#FFFFFF',
  surfaceSoft: '#F5F8F6',  // inset fills (matches auth inputBg)
  paleGreen: '#E7F1EB',    // icon circles, chips
  selectedBg: '#F2F8F4',   // selected / active fill
  border: '#E4EDE7',       // dividers + card borders
  divider: '#E4EDE7',

  // Semantic status accents — admin owns cross-role state (pickup lifecycle,
  // withdrawal approvals, alert severity) so it needs more than green/red.
  positive: '#15643E',   // active / approved / completed
  negative: '#DC2626',   // inactive / rejected / critical / cancelled
  amber: '#F59E0B',      // pending / scheduled / standard-urgency
  blue: '#2563EB',       // informational / in-progress / default

  alertBg: '#FFF1F1', alertBorder: '#FECACA', alertText: '#DC2626',
  warnBg: '#FFF7ED', warnBorder: '#FED7AA', warnText: '#C2410C',
  infoBg: '#EFF6FF', infoBorder: '#BFDBFE', infoText: '#1D4ED8',

  white: '#FFFFFF',
};

export const ADMIN_FONTS = {
  extraBold: ONB_FONTS.extraBold, // 'PlusJakartaSans_800ExtraBold' — big numbers, screen titles
  bold: ONB_FONTS.bold,           // 'PlusJakartaSans_700Bold' — card titles, buttons
  semiBold: ONB_FONTS.semiBold,   // 'PlusJakartaSans_600SemiBold' — labels
  medium: ONB_FONTS.medium,       // 'PlusJakartaSans_500Medium' — body
  regular: ONB_FONTS.regular,     // 'PlusJakartaSans_400Regular'
};

// Reusable soft shadows (match the auth/onboarding/restaurant feel)
export const ADMIN_SHADOWS = {
  card: {
    shadowColor: '#122A1F', shadowOpacity: 0.06, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 3,
  },
  button: {
    shadowColor: ADMIN_COLORS.primary, shadowOpacity: 0.32, shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 }, elevation: 8,
  },
};

// Standard radii + spacing so cards/buttons are consistent everywhere
export const ADMIN_RADII = { card: 18, chip: 12, pill: 30, input: 18 };
export const ADMIN_SPACING = { screenPadding: 20, cardPadding: 18, gap: 12 };
