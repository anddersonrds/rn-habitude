import { haptic } from "@/lib/haptics";
import { getNavigationTheme } from "@/theme/colors";
import { render } from "@testing-library/react-native";
import { ThemeProvider } from "expo-router/react-navigation";
import { PressablesConfig } from "pressto";
import type { ReactElement, ReactNode } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

type Options = {
  /** The theme is a real input to several components, so it is selectable. */
  colorScheme?: "light" | "dark";
};

/**
 * Mirrors the provider stack the root layout wraps the app in. A component
 * pulled out of that tree and rendered bare either throws or behaves
 * differently.
 *
 * `PressablesConfig` matters more than it looks: it fires a selection haptic on
 * every press, globally. A test asserting haptics has to know whether it is
 * asserting that one or the component's own.
 */
export function renderWithProviders(
  ui: ReactElement,
  { colorScheme = "light" }: Options = {},
) {
  function Providers({ children }: { children: ReactNode }) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider preload={false}>
          <ThemeProvider value={getNavigationTheme(colorScheme === "dark")}>
            <PressablesConfig
              globalHandlers={{ onPress: () => haptic.selection() }}
              config={{ minScale: 0.97 }}
            >
              {children}
            </PressablesConfig>
          </ThemeProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    );
  }

  return render(ui, { wrapper: Providers });
}
