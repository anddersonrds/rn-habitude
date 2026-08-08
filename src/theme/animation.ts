import { Animation } from "@expo/ui/swift-ui/modifiers";

/**
 * How a native list settles when a row is added, removed or reordered. Today
 * and the habits list both animate the same change, so they animate it at the
 * same speed.
 */
export const listChange = Animation.easeInOut({ duration: 0.22 });
