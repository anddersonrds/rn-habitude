import type { TextStyle } from "react-native";

/** Roboto. `ui-rounded` is an alias Android cannot resolve. */
export const appFontFamily = "sans-serif";

/** The same keys, from the Material 3 scale. The iOS tracking is SF's, not Roboto's. */
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
