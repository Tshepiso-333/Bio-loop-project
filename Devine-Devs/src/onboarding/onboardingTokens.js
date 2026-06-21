// Design tokens for the onboarding flow.
// Extracted verbatim from the Claude Design bundle "Onboarding Flow.dc.html".
// Single source of truth — colors, typography, and spacing all reference this.

export const ONB_COLORS = {
  // Brand / primary
  primary: '#15643E', // deep green: buttons, active progress, headings accents
  primaryMid: '#2E8B5A', // mid green used inside illustrations
  accent: '#79C39A', // light green: recycle ring, signal waves, routes
  accentSoft: '#9FD3B3', // leaf / coin highlight
  mint: '#cfeadb', // pale mint fill inside illustrations
  illustrationBg: '#E8F1EB', // pale green circle behind each illustration

  // Text
  title: '#13201a', // slide headings
  body: '#737d78', // slide body copy
  skip: '#a4aca7', // "Skip" label
  subtitle: '#8a949b', // small caption under the logo

  // Surfaces
  progressTrack: '#e2e7e4', // inactive progress segments
  white: '#ffffff',

  // Page background — radial gradient stops (top -> bottom)
  bgGradient: ['#f3f5f7', '#e4e8ec', '#dde2e7'],
};

export const ONB_FONTS = {
  extraBold: 'PlusJakartaSans_800ExtraBold', // titles
  bold: 'PlusJakartaSans_700Bold', // buttons, logo
  semiBold: 'PlusJakartaSans_600SemiBold', // skip
  medium: 'PlusJakartaSans_500Medium', // body copy
  regular: 'PlusJakartaSans_400Regular',
};

// Base type scale from the bundle (px). Scaled responsively at render time.
export const ONB_TYPE = {
  title: { size: 24, lineHeight: 24 * 1.22, weight: ONB_FONTS.extraBold, letterSpacing: -0.24 },
  body: { size: 14, lineHeight: 14 * 1.55, weight: ONB_FONTS.medium },
  button: { size: 15, weight: ONB_FONTS.bold },
  skip: { size: 14, weight: ONB_FONTS.semiBold },
};

export const ONB_SPACING = {
  screenPadding: 24, // horizontal page padding
  footerInset: 26, // distance of footer from the bottom (matches bundle)
  illustration: 280, // base illustration box height in the bundle
  contentMaxWidth: 480, // cap content width on tablets (derived breakpoint)
  buttonRadius: 30,
  buttonPaddingV: 14,
  buttonPaddingH: 22,
};

// Button drop shadow (rgba(21,100,62,0.6) in the bundle).
export const ONB_BUTTON_SHADOW = {
  shadowColor: '#15643E',
  shadowOpacity: 0.45,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 10 },
  elevation: 8,
};
