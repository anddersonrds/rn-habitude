import {
  DarkTheme,
  DefaultTheme,
  type Theme,
} from "expo-router/react-navigation";
import { accent } from "./accent";
import { colors } from "./colors";

/**
 * Adapts the tokens to the shape React Navigation asks a `ThemeProvider` for.
 *
 * Every colour in that shape is replaced here, so `dark` is left with the one
 * thing it still decides: `theme.dark`, which is what the navigator reads for
 * anything it draws without being told, the modal scrim among them.
 *
 * `Theme` types its colours as strings and the navigator takes a `PlatformColor`
 * descriptor anyway - it passes them into styles rather than reading them - so
 * the casts are what let the Android palette reach the header, the tab bar and
 * the card at all.
 */
export function getNavigationTheme(dark: boolean): Theme {
  const base = dark ? DarkTheme : DefaultTheme;

  return {
    ...base,
    colors: {
      primary: accent,
      background: colors.background as string,
      card: colors.secondaryBackground as string,
      text: colors.text as string,
      border: colors.separator as string,
      notification: accent,
    },
  };
}
