import type { ColorValue } from "react-native";

/** The semantic colors a screen asks for, filled by whichever platform it is on. */
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
