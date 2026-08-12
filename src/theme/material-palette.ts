import type { ColorSchemeName, ColorValue } from "react-native";
import type { SystemPalette } from "./types";

/**
 * Off Android there is no Material palette, and this stand-in is what keeps
 * `@expo/ui/jetpack-compose` out of the other bundles. `colors.ts` falls back to
 * the system's own colors on `null`.
 */
export function materialPalette(
  _scheme: ColorSchemeName,
  _seed: ColorValue,
): SystemPalette | null {
  return null;
}
