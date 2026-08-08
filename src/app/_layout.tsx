/* First: the language is resolved at import, before any screen is evaluated. */
import "@/i18n/i18next";
import { useLanguageSwitch } from "@/i18n/switching";
import { haptic } from "@/lib/haptics";
import { useNotificationActions } from "@/lib/notification-actions";
import { useAppState } from "@/lib/store";
import { routes } from "@/lib/utils/routes";
import { colors, getNavigationTheme } from "@/theme";
import { router, Stack } from "expo-router";
import { ThemeProvider } from "expo-router/react-navigation";
import { StatusBar } from "expo-status-bar";
import { PressablesConfig } from "pressto";
import { useEffect, useRef, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import { EaseView } from "react-native-ease";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { useReducedMotion } from "react-native-reanimated";

// A cold-start deep link (tapping the home screen widget) needs the tab
// navigator mounted beneath it. Expo Router uses this anchor to build that
// history entry.
export const unstable_settings = {
  initialRouteName: "(tabs)",
};

const LANGUAGE_TRANSITION = { type: "timing" as const, duration: 170 };

function LanguageFade({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  const { visible, onTransitionEnd } = useLanguageSwitch();

  if (reduceMotion) return children;

  return (
    <EaseView
      style={{ flex: 1 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={LANGUAGE_TRANSITION}
      onTransitionEnd={onTransitionEnd}
    >
      {children}
    </EaseView>
  );
}

function AppStack() {
  const { habits, onboarded } = useAppState();
  const wasOnboarded = useRef(onboarded);

  useEffect(() => {
    const justFinishedOnboarding = !wasOnboarded.current && onboarded;
    wasOnboarded.current = onboarded;

    // Wait until the protected route switch has mounted the tabs, then present
    // the first habit form on top so it has a real route to return to.
    if (justFinishedOnboarding && habits.length === 0) {
      router.push(routes.habitForm());
    }
  }, [habits.length, onboarded]);

  return (
    <Stack>
      <Stack.Protected guard={!onboarded}>
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={onboarded}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Screen
        name="habit/[id]"
        options={{
          title: "",
          headerTransparent: true,
          headerBackButtonDisplayMode: "minimal",
        }}
      />
      <Stack.Screen
        name="habit-history"
        options={{
          title: "",
          headerLargeTitleEnabled: true,
          headerBackButtonDisplayMode: "minimal",
        }}
      />
      <Stack.Screen
        name="habit-form"
        options={{
          headerShown: true,
          presentation: "formSheet",
          // Opens fully expanded: the whole form (icon grid, color, frequency,
          // reminder) is reachable immediately instead of behind a manual drag.
          sheetAllowedDetents: [1],
          sheetCornerRadius: 28,
          contentStyle: { backgroundColor: colors.groupedBackground },
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  useNotificationActions();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider preload={false}>
        <ThemeProvider value={getNavigationTheme(colorScheme === "dark")}>
          <PressablesConfig
            globalHandlers={{ onPress: () => haptic.selection() }}
            config={{ minScale: 0.97 }}
          >
            <LanguageFade>
              <AppStack />
            </LanguageFade>
            <StatusBar style="auto" />
          </PressablesConfig>
        </ThemeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
