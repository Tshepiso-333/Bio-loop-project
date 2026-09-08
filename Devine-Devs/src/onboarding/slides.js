// Onboarding slide content — copied verbatim from the Claude Design bundle.
//
// To add / remove / reorder a slide: edit this array. Everything else
// (progress segment count, paging, and the final "Get started" button) is
// derived from this list, so no other file needs to change.

import {
  WelcomeIllustration,
  MonitorIllustration,
  RoutesIllustration,
  PayoutIllustration,
} from './illustrations';

export const SLIDES = [
  {
    key: 'welcome',
    title: 'Turn waste oil into clean energy',
    body: 'Connect your restaurant to a smarter collection network and keep used oil out of the drain.',
    Illustration: WelcomeIllustration,
  },
  {
    key: 'monitor',
    title: 'Real-time IoT monitoring',
    body: 'Smart sensors track oil volume and quality, so a pickup is requested automatically at the right moment.',
    Illustration: MonitorIllustration,
  },
  {
    key: 'routes',
    title: 'Optimized pickup routes',
    body: 'Live traffic-aware routing groups nearby stops to cut fuel, time and missed collections.',
    Illustration: RoutesIllustration,
  },
  {
    key: 'payout',
    title: 'Fair, automatic payouts',
    body: 'Get paid transparently for every litre, priced on verified volume and quality grade.',
    Illustration: PayoutIllustration,
  },
];
