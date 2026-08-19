import {
  DarkTheme,
  DefaultTheme,
  type Theme,
} from "expo-router/react-navigation";
import { accent } from "./accent";
import { colors } from "./colors";

/**
 * Adapts the tokens to the shape React Navigation asks a `ThemeProvider` for.
 * Every colour in that shape is replaced, so `dark` decides only `theme.dark`.
 *
 * The casts are what let a `PlatformColor` descriptor through: `Theme` types its
 * colours as strings, and the navigator passes them into styles rather than
 * reading them.
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
