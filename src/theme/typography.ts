import type { TextStyle } from "react-native";

/** SF Rounded, matching the SwiftUI screens that use `font({ design: "rounded" })`. */
export const appFontFamily = "ui-rounded";

/**
 * The type ramp, mirroring the iOS text styles the SwiftUI screens get for free.
 * `components/ui/text` consumes this and declares nothing of its own, so a size
 * changed here changes every screen.
 */
export const typography = {
  largeTitle: { fontSize: 34, fontWeight: "700", letterSpacing: 0.4 },
  title: { fontSize: 28, fontWeight: "700", letterSpacing: 0.36 },
  title2: { fontSize: 22, fontWeight: "700", letterSpacing: 0.35 },
  title3: { fontSize: 20, fontWeight: "600", letterSpacing: 0.38 },
  headline: { fontSize: 17, fontWeight: "600", letterSpacing: -0.41 },
  body: { fontSize: 17, letterSpacing: -0.41 },
  subheadline: { fontSize: 15, letterSpacing: -0.24 },
  footnote: { fontSize: 13, letterSpacing: -0.08 },
  caption: { fontSize: 12 },
} satisfies Record<string, TextStyle>;
