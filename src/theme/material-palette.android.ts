import { getMaterialColors } from "@expo/ui/jetpack-compose";
import type { ColorSchemeName, ColorValue } from "react-native";
import type { SystemPalette } from "./types";

/**
 * The eleven semantic colors as Material 3 roles, from a palette generated with
 * `seed` rather than from the wallpaper.
 *
 * Material 3 is the role system; Material You is one way of filling it, and
 * `Color.android.dynamic.*` is that one. The seed here is the app accent, which
 * is deliberately the same hex as the cyan habit color, so chrome derived from a
 * photo would leave a cyan habit matching nothing.
 *
 * The roles resolve to concrete values, so unlike the iOS references this has to
 * be re-read when the appearance changes. `useSystemColors()` is that path.
 */
export function materialPalette(
  scheme: ColorSchemeName,
  seed: ColorValue,
): SystemPalette {
  const material = getMaterialColors({
    scheme: scheme === "dark" ? "dark" : "light",
    seedColor: seed,
  });

  return {
    background: material.surface,
    groupedBackground: material.surface,
    secondaryBackground: material.surfaceContainer,
    text: material.onSurface,
    secondaryText: material.onSurfaceVariant,
    tertiaryText: material.outline,
    mutedText: material.outline,
    fill: material.surfaceContainerHigh,
    subtleFill: material.surfaceContainerLow,
    separator: material.outlineVariant,
    destructive: material.error,
  };
}
