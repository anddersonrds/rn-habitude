import { Color } from "expo-router";
import { useColorScheme, type ColorSchemeName } from "react-native";
import { accent } from "./accent";
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

function resolve(scheme: ColorSchemeName): SystemPalette {
  return materialPalette(scheme, accent) ?? iosPalette;
}

/**
 * The palette a `StyleSheet` is built from, resolved once at module scope. The
 * iOS values are references that follow the appearance on their own; a Material
 * palette is concrete values, and this one is the light appearance. Anything that
 * has to follow a change reads `useSystemColors()`.
 */
export const colors: SystemPalette = resolve("light");

/** The scheme goes through the resolver, so React Compiler sees the dependency. */
export function useSystemColors(): SystemPalette {
  return resolve(useColorScheme());
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
