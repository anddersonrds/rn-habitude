import { tints } from "@/theme";

/**
 * Returns the higher-contrast foreground for a six-digit hex color.
 *
 * Habit accents are user-selectable, so a fixed white foreground becomes
 * unreadable on yellow, mint, or green. Comparing relative luminance keeps
 * labels and icons legible across the whole palette.
 */
export function foregroundOnColor(background: string): "#000000" | "#FFFFFF" {
  const match = background.match(/^#([\dA-F]{2})([\dA-F]{2})([\dA-F]{2})$/i);
  if (!match) return tints.white;

  const channels = match.slice(1).map((channel) => {
    const value = Number.parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const luminance =
    channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  const blackContrast = (luminance + 0.05) / 0.05;
  const whiteContrast = 1.05 / (luminance + 0.05);

  return blackContrast >= whiteContrast ? tints.black : tints.white;
}
