import { haptic } from "@/lib/haptics";
import { useNotificationActions } from "@/lib/notification-actions";
import { useAppState } from "@/lib/store";
import { getNavigationTheme } from "@/theme/colors";
import { Color, router, Stack } from "expo-router";
import { ThemeProvider } from "expo-router/react-navigation";
import { StatusBar } from "expo-status-bar";
import { PressablesConfig } from "pressto";
import { useEffect, useRef } from "react";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

// A cold-start deep link (tapping the home screen widget) needs the tab
// navigator mounted beneath it. Expo Router uses this anchor to build that
// history entry.
export const unstable_settings = {
  initialRouteName: "(tabs)",
};

function AppStack() {
  const { habits, onboarded } = useAppState();
  const wasOnboarded = useRef(onboarded);

  useEffect(() => {
    const justFinishedOnboarding = !wasOnboarded.current && onboarded;
    wasOnboarded.current = onboarded;

    // Wait until the protected route switch has mounted the tabs, then present
    // the first habit form on top so it has a real route to return to.
    if (justFinishedOnboarding && habits.length === 0) {
      router.push("/habit-form");
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
          contentStyle: { backgroundColor: Color.ios.systemGroupedBackground },
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
            <AppStack />
            <StatusBar style="auto" />
          </PressablesConfig>
        </ThemeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
