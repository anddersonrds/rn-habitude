import type { Props } from "./types";

/**
 * A Compose tree exists only on Android, so off it there is nothing to draw and
 * this stand-in is what keeps the Compose import out of the other bundles.
 * Everywhere outside a `<Host>`, on every platform, the symbol is `AppSymbol`.
 */
export function ComposeSymbol(_props: Props) {
  return null;
}
