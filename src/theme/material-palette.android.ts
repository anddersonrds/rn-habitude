import { getMaterialColors } from "@expo/ui/jetpack-compose";
import type { ColorSchemeName, ColorValue } from "react-native";
import type { SystemPalette } from "./types";

/**
 * Material 3 is the role system; Material You is one way of filling it, from the
 * wallpaper, and `Color.android.dynamic.*` is that one. This fills the roles from
 * `seed`, the app accent, which is the same hex as the cyan habit color.
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
