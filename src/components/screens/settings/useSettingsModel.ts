import { haptic } from "@/lib/haptics";
import {
  ensureNotificationPermission,
  getNotificationPermission,
  sendTestNotification,
} from "@/lib/notifications";
import {
  deleteAllData,
  loadSampleData,
  resetOnboarding,
  useAppState,
} from "@/lib/store";
import * as Application from "expo-application";
import Constants from "expo-constants";
import type * as Notifications from "expo-notifications";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, AppState, Linking } from "react-native";

/**
 * `expoConfig` is embedded at bundle time and derives from `package.json`, so
 * it follows a JavaScript reload. `nativeApplicationVersion` reads the
 * installed binary's `Info.plist`, which only changes on a native rebuild, and
 * is the secondary source for that reason. The em dash is the last resort: a
 * placeholder is honest, a hardcoded version is a number that never shipped.
 */
const version =
  Constants.expoConfig?.version ?? Application.nativeApplicationVersion ?? "—";

/**
 * View model for the settings screen: the permission state, the counts, and
 * every flow behind a confirmation, so the SwiftUI view stays a thin render
 * layer.
 */
export function useSettingsModel() {
  const { habits, completions } = useAppState();
  const [permission, setPermission] =
    useState<Notifications.NotificationPermissionsStatus | null>(null);

  const refreshPermission = useCallback(() => {
    void getNotificationPermission().then(setPermission);
  }, []);

  /* Refresh when the tab gains focus and when returning from iOS Settings. */
  useFocusEffect(refreshPermission);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (status) => {
      if (status === "active") refreshPermission();
    });
    return () => subscription.remove();
  }, [refreshPermission]);

  const permissionLabel = !permission
    ? "…"
    : permission.granted
      ? "Allowed"
      : permission.canAskAgain
        ? "Not requested"
        : "Denied";

  const permissionColor = !permission
    ? "secondary"
    : permission.granted
      ? "green"
      : permission.canAskAgain
        ? "secondary"
        : "red";

  const openSystemSettings = () => void Linking.openURL("app-settings:");

  const requestPermission = async () => {
    const granted = await ensureNotificationPermission();
    if (granted) haptic.success();
    refreshPermission();
  };

  const sendTest = async () => {
    const granted = await ensureNotificationPermission();
    refreshPermission();
    if (!granted) {
      Alert.alert(
        "Notifications are off",
        "Allow notifications in iOS Settings to receive reminders.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: openSystemSettings },
        ],
      );
      return;
    }
    await sendTestNotification();
    haptic.impact();
    Alert.alert(
      "Test notification sent",
      "It arrives in a few seconds. Leave the app open or lock the screen to see the banner.",
    );
  };

  const loadSample = () => {
    const run = () => {
      loadSampleData();
      haptic.success();
    };
    /* Nothing to lose, so nothing to confirm. */
    if (habits.length === 0) {
      run();
      return;
    }
    Alert.alert(
      "Load sample data?",
      "This adds five example habits with twelve weeks of history. Your own habits are kept.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Load", onPress: run },
      ],
    );
  };

  const deleteEverything = () => {
    haptic.warning();
    Alert.alert(
      "Delete all data?",
      "This permanently deletes every habit and its history.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: () => void deleteAllData(),
        },
      ],
    );
  };

  const viewOnboarding = () => {
    haptic.impact();
    resetOnboarding();
  };

  return {
    permissionLabel,
    permissionColor,
    /* Asking is only offered while iOS would still show the prompt. */
    canRequestPermission:
      permission != null && !permission.granted && permission.canAskAgain,
    canOpenSettings:
      permission != null && !permission.granted && !permission.canAskAgain,
    habitCount: habits.length,
    totalCheckIns: Object.values(completions).reduce(
      (total, days) => total + Object.keys(days).length,
      0,
    ),
    hasHabits: habits.length > 0,
    version,
    requestPermission,
    openSystemSettings,
    sendTest,
    loadSample,
    deleteEverything,
    viewOnboarding,
  };
}
