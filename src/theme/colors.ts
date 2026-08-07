import { Color } from "expo-router";
import {
  DarkTheme,
  DefaultTheme,
  type Theme,
} from "expo-router/react-navigation";
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

/**
 * Returns the higher-contrast foreground for a six-digit hex color.
 *
 * Habit accents are user-selectable, so a fixed white foreground becomes
 * unreadable on yellow, mint, or green. Comparing relative luminance keeps
 * labels and icons legible across the whole palette.
 */
export function foregroundOnColor(background: string): "#000000" | "#FFFFFF" {
  const match = background.match(/^#([\dA-F]{2})([\dA-F]{2})([\dA-F]{2})$/i);
  if (!match) return "#FFFFFF";

  const channels = match.slice(1).map((channel) => {
    const value = Number.parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const luminance =
    channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  const blackContrast = (luminance + 0.05) / 0.05;
  const whiteContrast = 1.05 / (luminance + 0.05);

  return blackContrast >= whiteContrast ? "#000000" : "#FFFFFF";
}

export function getNavigationTheme(dark: boolean): Theme {
  const base = dark ? DarkTheme : DefaultTheme;

  return {
    ...base,
    colors: {
      ...base.colors,
      primary: accent,
      background: colors.background as string,
      card: colors.secondaryBackground as string,
      text: colors.text as string,
      border: colors.separator as string,
      notification: accent,
    },
  };
}
