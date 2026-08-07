import { Color } from "expo-router";
import type { ColorValue } from "react-native";

/**
 * Semantic system colors. Using these instead of hard-coded values is what
 * makes dark mode free and keeps the app looking native.
 *
 * They ship inside `expo-router`, which is a routing package, so this is the
 * one file allowed to reach for them. Everything else asks `theme/`.
 */
export const colors: Record<
  | "background"
  | "groupedBackground"
  | "secondaryBackground"
  | "text"
  | "secondaryText"
  | "tertiaryText"
  | "mutedText"
  | "fill"
  | "subtleFill"
  | "separator"
  | "destructive",
  ColorValue
> = {
  background: Color.ios.systemBackground,
  groupedBackground: Color.ios.systemGroupedBackground,
  secondaryBackground: Color.ios.secondarySystemGroupedBackground,
  text: Color.ios.label,
  secondaryText: Color.ios.secondaryLabel,
  tertiaryText: Color.ios.tertiaryLabel,
  mutedText: Color.ios.systemGray,
  fill: Color.ios.tertiarySystemFill,
  subtleFill: Color.ios.quaternarySystemFill,
  separator: Color.ios.separator,
  destructive: Color.ios.systemRed,
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
