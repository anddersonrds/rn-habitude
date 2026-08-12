import type { Props } from "./types";

/**
 * A Compose tree exists only on Android, so off it there is nothing to draw, and
 * this stand-in keeps the Compose import out of the other bundles. Outside a
 * `<Host>` the symbol is `AppSymbol`, on every platform.
 */
export function ComposeSymbol(_props: Props) {
  return null;
}
