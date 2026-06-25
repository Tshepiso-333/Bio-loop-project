// Auth design tokens — forest-green restyle matching the onboarding flow and the
// approved "BioLoop Auth Flow" Claude Design. The brand green is pulled from the
// onboarding tokens (single source of truth) so #15643E never appears as a magic
// value; the remaining shades are the exact values from the approved design.

import { ONB_COLORS, ONB_FONTS } from '../onboarding/onboardingTokens';

export const AUTH_COLORS = {
  primary: ONB_COLORS.primary, // '#15643E' — forest green (from onboarding tokens)
  primaryShadow: 'rgba(21,100,62,0.32)',

  ink: '#122A1F', // headings / primary text
  body: '#6B7F75', // body copy + labels
  placeholder: '#A9B5AD',
  iconMuted: '#A9B5AD',

  inputBg: '#F5F8F6',
  inputBorder: '#E4EDE7',
  divider: '#E4EDE7',

  roleCircle: '#E7F1EB', // pale-green circle behind a role icon
  selectedBg: '#F2F8F4', // selected role card / badge fill
  chevron: '#C2CEC7',

  overlay: 'rgba(8,24,17,0.55)', // dimmed background behind the pop-up
  sheetHandle: '#D8E2DC',

  white: '#ffffff',

  // Inline error styling (kept consistent with the rest of the app).
  errorBg: '#FFF1F1',
  errorBorder: '#FECACA',
  errorText: '#DC2626',
};

export const AUTH_FONTS = {
  extraBold: ONB_FONTS.extraBold, // titles
  bold: ONB_FONTS.bold, // buttons / labels
  semiBold: ONB_FONTS.semiBold,
  medium: ONB_FONTS.medium, // body copy
  regular: ONB_FONTS.regular,
};

// Pill button drop shadow (rgba(21,100,62,.32) in the design).
export const AUTH_BUTTON_SHADOW = {
  shadowColor: AUTH_COLORS.primary,
  shadowOpacity: 0.32,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 14 },
  elevation: 8,
};
