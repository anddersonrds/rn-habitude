import type { TextStyle } from "react-native";

/** Roboto, the family Material 3 specifies and the one `ui-rounded` never was. */
export const appFontFamily = "sans-serif";

/**
 * The same ramp keys filled from the Material 3 type scale, so a screen asks for
 * `headline` on both platforms and gets what the platform calls that.
 * Tracking is positive throughout: the negative values on the iOS side are
 * calibrated for SF, and Roboto under them reads cramped.
 */
export const typography = {
  /* headlineLarge */
  largeTitle: { fontSize: 32, fontWeight: "400", letterSpacing: 0 },
  /* headlineMedium */
  title: { fontSize: 28, fontWeight: "400", letterSpacing: 0 },
  /* headlineSmall */
  title2: { fontSize: 24, fontWeight: "400", letterSpacing: 0 },
  /* titleLarge */
  title3: { fontSize: 22, fontWeight: "400", letterSpacing: 0 },
  /* titleMedium */
  headline: { fontSize: 16, fontWeight: "500", letterSpacing: 0.15 },
  /* bodyLarge */
  body: { fontSize: 16, letterSpacing: 0.5 },
  /* bodyMedium */
  subheadline: { fontSize: 14, letterSpacing: 0.25 },
  /* bodySmall */
  footnote: { fontSize: 12, letterSpacing: 0.4 },
  /* labelSmall, which is what fits the weekday column of the heat graph */
  caption: { fontSize: 11, fontWeight: "500", letterSpacing: 0.5 },
} satisfies Record<string, TextStyle>;
