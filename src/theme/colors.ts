import { Color } from "expo-router";
import type { ColorValue } from "react-native";

/**
 * Semantic system colors. Using these instead of hard-coded values is what
 * makes dark mode free and keeps the app looking native.
 */
export const colors: Record<
  "background" | "secondaryBackground" | "text" | "secondaryText" | "separator",
  ColorValue
> = {
  background: Color.ios.systemBackground,
  secondaryBackground: Color.ios.secondarySystemGroupedBackground,
  text: Color.ios.label,
  secondaryText: Color.ios.secondaryLabel,
  separator: Color.ios.separator,
};

/**
 * The app tint. Apple's `systemCyan`, kept as a hex string so it can be
 * composed with alpha suffixes and passed to native tint props.
 *
 * It is deliberately the same hex as the cyan habit color, so a cyan habit
 * matches app chrome. `widgets/HabitudeWidget.tsx` holds a copy of this value
 * that has to be updated by hand; it cannot import the token.
 */
export const accent = "#32ADE6";

/**
 * The one green that means "complete". Apple's `systemGreen`, shared by the
 * Today undo swipe tint, the "all done" seal, and the progress bar once every
 * habit is checked in.
 */
export const success = "#34C759";
