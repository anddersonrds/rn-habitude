import {
  DEVICE,
  LOCALES,
  getLanguagePreference,
  setLanguage,
} from "@/i18n/i18next";
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
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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
  /* Subscribes the screen to the language, and gives the alerts their copy at
  the moment they are raised rather than at import. */
  const { t } = useTranslation(["settings", "common", "language"]);
  const { habits, completions } = useAppState();
  const [permission, setPermission] =
    useState<Notifications.NotificationPermissionsStatus | null>(null);
  const [language, setActiveLanguage] = useState(getLanguagePreference);

  /* Sorted by label at runtime, so the order cannot drift from the names. */
  const languages = useMemo(
    () => [
      { tag: DEVICE, label: t("language:systemDefault") },
      ...LOCALES.map(({ tag, label }) => ({ tag, label })).sort((one, other) =>
        one.label.localeCompare(other.label),
      ),
    ],
    [t],
  );

  const chooseLanguage = (tag: string) => {
    setLanguage(tag);
    setActiveLanguage(tag);
  };

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
    ? t("permissionPending")
    : permission.granted
      ? t("permissionAllowed")
      : permission.canAskAgain
        ? t("permissionNotRequested")
        : t("permissionDenied");

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
      Alert.alert(t("notificationsOffTitle"), t("notificationsOffBody"), [
        { text: t("common:cancel"), style: "cancel" },
        { text: t("openSettings"), onPress: openSystemSettings },
      ]);
      return;
    }
    await sendTestNotification();
    haptic.impact();
    Alert.alert(t("testSentTitle"), t("testSentBody"));
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
    Alert.alert(t("loadSampleTitle"), t("loadSampleBody"), [
      { text: t("common:cancel"), style: "cancel" },
      { text: t("load"), onPress: run },
    ]);
  };

  const deleteEverything = () => {
    haptic.warning();
    Alert.alert(t("deleteAllTitle"), t("deleteAllBody"), [
      { text: t("common:cancel"), style: "cancel" },
      {
        text: t("deleteEverything"),
        style: "destructive",
        onPress: () => void deleteAllData(),
      },
    ]);
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
    languages,
    language,
    chooseLanguage,
    requestPermission,
    openSystemSettings,
    sendTest,
    loadSample,
    deleteEverything,
    viewOnboarding,
  };
}
