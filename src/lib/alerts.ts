import type { TFunction } from "i18next";
import { Alert, Linking } from "react-native";

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

/* Resolved rather than a `t`: settings and the form declare their own copy and
say different things about why they asked for the permission. */
export type NotificationsOffCopy = {
  title: string;
  body: string;
  dismiss: string;
  openSettings: string;
};

export function alertNotificationsOff(copy: NotificationsOffCopy): void {
  Alert.alert(copy.title, copy.body, [
    { text: copy.dismiss, style: "cancel" },
    {
      text: copy.openSettings,
      onPress: () => void Linking.openURL("app-settings:"),
    },
  ]);
}
