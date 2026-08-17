import { Color } from "expo-router";
import { materialPalette } from "./material-palette";
import type { SystemPalette } from "./types";

/**
 * Semantic system colors. Using these instead of hard-coded values is what
 * makes dark mode free and keeps the app looking native.
 *
 * They ship inside `expo-router`, which is a routing package, so this is the
 * one file allowed to reach for them. Everything else asks `theme/`.
 */
const iosPalette: SystemPalette = {
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
 * The palette a `StyleSheet` is built from. Neither half carries a value: the
 * iOS entries are semantic references and the Android ones name a theme
 * attribute, so both are resolved by the system rather than by this module, and
 * neither is tied to the appearance that was current when it was imported.
 */
export const colors: SystemPalette = materialPalette() ?? iosPalette;

/**
 * Kept as the seam a screen asks the palette through, though it no longer has
 * an appearance to read: nothing here resolves in JavaScript any more.
 */
export function useSystemColors(): SystemPalette {
  return colors;
}

/**
 * The one green that means "complete". Apple's `systemGreen`, shared by the
 * Today undo swipe tint, the "all done" seal, and the progress bar once every
 * habit is checked in.
 */
export const success = "#34C759";

/**
 * Apple's system palette as hex. A SwiftUI modifier, an `@expo/ui` tint and a
 * shadow take a plain string, so the semantic `colors` above cannot cross into
 * them; these are the values that do.
 */
export const tints = {
  /** `systemGray`. */
  gray: "#8E8E93",
  /** `systemBlue`. */
  blue: "#007AFF",
  /** `systemYellow`. */
  yellow: "#FFCC00",
  black: "#000000",
  white: "#FFFFFF",
} as const;
