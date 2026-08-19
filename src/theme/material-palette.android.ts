import { PlatformColor } from "react-native";
import type { SystemPalette } from "./types";

/**
 * Names a Material 3 role for the platform to resolve off the theme
 * `plugins/withMaterialTheme.js` writes. Nothing here asks for the appearance:
 * the resource qualifier answers that.
 */
function role(attribute: string) {
  return PlatformColor(`?attr/${attribute}`);
}

export function materialPalette(): SystemPalette {
  return {
    background: role("colorSurface"),
    groupedBackground: role("colorSurface"),
    secondaryBackground: role("colorSurfaceContainer"),
    text: role("colorOnSurface"),
    secondaryText: role("colorOnSurfaceVariant"),
    tertiaryText: role("colorOutline"),
    mutedText: role("colorOutline"),
    fill: role("colorSurfaceContainerHigh"),
    subtleFill: role("colorSurfaceContainerLow"),
    separator: role("colorOutlineVariant"),
    destructive: role("colorError"),
  };
}
