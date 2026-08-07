import {
  DarkTheme,
  DefaultTheme,
  type Theme,
} from "expo-router/react-navigation";
import { accent, colors } from "./colors";

/** Adapts the tokens to the shape React Navigation asks a `ThemeProvider` for. */
export function getNavigationTheme(dark: boolean): Theme {
  const base = dark ? DarkTheme : DefaultTheme;

  return {
    ...base,
    colors: {
      ...base.colors,
      primary: accent,
      background: colors.background as string,
      card: colors.secondaryBackground as string,
      text: colors.text as string,
      border: colors.separator as string,
      notification: accent,
    },
  };
}
