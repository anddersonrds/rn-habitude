/**
 * Shared layout metrics. Two screen families use them:
 * - Content screens (lists, detail, forms): `screenPadding` + `cardRadius`.
 * - Hero sheets (onboarding): `heroPadding` + pill CTAs.
 */
export const layout = {
  /** Horizontal edge padding on content screens, matching inset-grouped lists. */
  screenPadding: 16,
  /** Wider edge padding on centered hero sheets. */
  heroPadding: 24,
  /** Bottom padding so scroll content clears the home indicator. */
  bottomPadding: 48,
  /** Corner radius for grouped cards. */
  cardRadius: 14,
  /** Corner radius for pill-shaped CTA buttons. */
  ctaRadius: 30,
} as const;
