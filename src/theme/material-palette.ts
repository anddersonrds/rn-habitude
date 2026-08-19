import type { SystemPalette } from "./types";

/**
 * Off Android there is no Material palette, and this stand-in is what keeps the
 * Android theme's resource names out of the other bundles. `colors.ts` falls
 * back to the system's own colors on `null`.
 */
export function materialPalette(): SystemPalette | null {
  return null;
}
