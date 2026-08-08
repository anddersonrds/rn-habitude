import type { TFunction } from "i18next";
import { Alert, Linking } from "react-native";

/**
 * The confirmation shown before a habit is deleted, from Today, from the habits
 * list and from the form. Takes `t` rather than reaching for the active
 * language, so this module stays pure and the caller decides which language it
 * is asking in.
 */
export function confirmDeleteHabit(
  name: string,
  t: TFunction<"common">,
  onConfirm: () => void,
): void {
  Alert.alert(t("deleteHabitTitle", { name }), t("deleteHabitBody"), [
    { text: t("cancel"), style: "cancel" },
    { text: t("delete"), style: "destructive", onPress: onConfirm },
  ]);
}

/**
 * The copy the two callers bring with them. Settings and the form ask for the
 * permission for different reasons and say so, in every locale, so the strings
 * arrive resolved instead of the alert picking a namespace for them.
 */
export type NotificationsOffCopy = {
  title: string;
  body: string;
  /** What dismissing reads as: "Cancel" in settings, "Not Now" in the form. */
  dismiss: string;
  openSettings: string;
};

/** The "notifications are off" alert, and the one way out of it. */
export function alertNotificationsOff(copy: NotificationsOffCopy): void {
  Alert.alert(copy.title, copy.body, [
    { text: copy.dismiss, style: "cancel" },
    {
      text: copy.openSettings,
      onPress: () => void Linking.openURL("app-settings:"),
    },
  ]);
}
