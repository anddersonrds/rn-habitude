import { PlatformColor } from "react-native";
import type { SystemPalette } from "./types";

/**
 * A descriptor names a Material 3 role and the platform reads it off the app's
 * own theme, which carries a night variant and takes its roles from the
 * wallpaper on Android 12 and up. Nothing here asks for the appearance, because
 * the resource qualifier is what answers that question.
 *
 * The resolution happens when the prop reaches the view, not when the view
 * draws, so an appearance change is followed by the activity being recreated.
 * `plugins/withMaterialTheme.js` is what arranges both halves.
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
