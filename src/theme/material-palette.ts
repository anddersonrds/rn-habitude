import type { ColorSchemeName, ColorValue } from "react-native";
import type { SystemPalette } from "./types";

/**
 * Material 3 is Android's palette, and the module that generates a seeded one
 * lives in `@expo/ui/jetpack-compose`, whose views exist on no other platform.
 * This stand-in is what keeps that import out of every other bundle: off Android
 * there is no Material palette, and `colors.ts` falls back to the system's own.
 */
export function materialPalette(
  _scheme: ColorSchemeName,
  _seed: ColorValue,
): SystemPalette | null {
  return null;
}
