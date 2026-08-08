/* First: the language is resolved at import, before any screen is evaluated. */
import "@/i18n/i18next";
import { useLanguageSwitch } from "@/i18n/switching";
import { haptic } from "@/lib/haptics";
import { useNotificationActions } from "@/lib/notification-actions";
import { useAppState } from "@/lib/data/store";
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

/* A cold-start deep link needs the tab navigator mounted beneath it, and this
is the anchor Expo Router builds that history entry from. */
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
  const habitCount = useAppState((state) => state.habits.length);
  const onboarded = useAppState((state) => state.onboarded);
  const wasOnboarded = useRef(onboarded);

  useEffect(() => {
    const justFinishedOnboarding = !wasOnboarded.current && onboarded;
    wasOnboarded.current = onboarded;

    /* Waits for the protected switch to mount the tabs, so the form has a
    route to return to. */
    if (justFinishedOnboarding && habitCount === 0) {
      router.push(routes.habitForm());
    }
  }, [habitCount, onboarded]);

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
          /* Fully expanded: the whole form is reachable without a drag. */
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
