import type { ColorValue } from "react-native";

/**
 * The eleven semantic colors a screen is allowed to ask for. Each platform
 * fills them from its own system palette, so a consumer never branches.
 */
export type SystemPalette = Record<
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
>;
