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
import { accent, colors } from "@/theme/colors";
import {
  Button,
  Form,
  Host,
  Image,
  Label,
  LabeledContent,
  Section,
  Text,
} from "@expo/ui/swift-ui";
import { font, foregroundStyle } from "@expo/ui/swift-ui/modifiers";
import * as Application from "expo-application";
import type * as Notifications from "expo-notifications";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState, type ComponentProps } from "react";
import { Alert, AppState, Linking } from "react-native";

type SettingsIcon = NonNullable<ComponentProps<typeof Image>["systemName"]>;

function SettingsLabel({
  label,
  systemImage,
}: {
  label: string;
  systemImage: SettingsIcon;
}) {
  return (
    <Label icon={<Image systemName={systemImage} color={accent} size={18} />}>
      <Text
        modifiers={[
          font({ design: "rounded" }),
          foregroundStyle({ type: "color", color: colors.text }),
        ]}
      >
        {label}
      </Text>
    </Label>
  );
}

function SettingsButton({
  label,
  systemImage,
  onPress,
}: {
  label: string;
  systemImage: SettingsIcon;
  onPress: () => void;
}) {
  return (
    <Button onPress={onPress}>
      <SettingsLabel label={label} systemImage={systemImage} />
    </Button>
  );
}

export default function SettingsScreen() {
  const { habits, completions } = useAppState();
  const [permission, setPermission] =
    useState<Notifications.NotificationPermissionsStatus | null>(null);

  const refreshPermission = useCallback(() => {
    void getNotificationPermission().then(setPermission);
  }, []);

  // Refresh when the tab gains focus and when returning from iOS Settings.
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

  const requestPermission = async () => {
    const granted = await ensureNotificationPermission();
    if (granted) haptic.success();
    refreshPermission();
  };

  const handleTestNotification = async () => {
    const granted = await ensureNotificationPermission();
    refreshPermission();
    if (!granted) {
      Alert.alert(
        "Notifications are off",
        "Allow notifications in iOS Settings to receive reminders.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Settings",
            onPress: () => void Linking.openURL("app-settings:"),
          },
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

  const handleLoadSample = () => {
    const run = () => {
      loadSampleData();
      haptic.success();
    };
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

  const handleDeleteAll = () => {
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

  const totalCheckIns = Object.values(completions).reduce(
    (total, days) => total + Object.keys(days).length,
    0,
  );

  return (
    <Host style={{ flex: 1 }}>
      <Form>
        <Section
          title="Notifications"
          footer={
            <Text modifiers={[font({ design: "rounded" })]}>
              Reminders are scheduled on this device only. habitude never sends
              anything to a server.
            </Text>
          }
        >
          <LabeledContent
            label={<SettingsLabel label="Permission" systemImage="bell.fill" />}
          >
            <Text
              modifiers={[
                font({ design: "rounded" }),
                foregroundStyle({ type: "color", color: permissionColor }),
              ]}
            >
              {permissionLabel}
            </Text>
          </LabeledContent>
          {permission != null && !permission.granted && permission.canAskAgain && (
            <SettingsButton
              label="Allow notifications"
              systemImage="bell.badge"
              onPress={() => void requestPermission()}
            />
          )}
          {permission != null && !permission.granted && !permission.canAskAgain && (
            <SettingsButton
              label="Open iOS Settings"
              systemImage="gear"
              onPress={() => void Linking.openURL("app-settings:")}
            />
          )}
          <SettingsButton
            label="Send test notification"
            systemImage="paperplane"
            onPress={() => void handleTestNotification()}
          />
        </Section>

        <Section
          title="Data"
          footer={
            <Text modifiers={[font({ design: "rounded" })]}>
              Sample data seeds five habits with twelve weeks of history, so the
              heat graph and the widget have something to show.
            </Text>
          }
        >
          <SettingsButton
            label="Load sample data"
            systemImage="wand.and.stars"
            onPress={handleLoadSample}
          />
          {habits.length > 0 && (
            <Button
              label="Delete all data"
              role="destructive"
              onPress={handleDeleteAll}
            />
          )}
        </Section>

        <Section title="About">
          <SettingsButton
            label="View onboarding"
            systemImage="sparkles"
            onPress={() => {
              haptic.impact();
              resetOnboarding();
            }}
          />
          <LabeledContent
            label={<SettingsLabel label="Habits" systemImage="list.bullet" />}
          >
            <Text modifiers={[font({ design: "rounded" })]}>{`${habits.length}`}</Text>
          </LabeledContent>
          <LabeledContent
            label={
              <SettingsLabel label="Check-ins" systemImage="checkmark.seal.fill" />
            }
          >
            <Text modifiers={[font({ design: "rounded" })]}>{`${totalCheckIns}`}</Text>
          </LabeledContent>
          <LabeledContent
            label={<SettingsLabel label="Version" systemImage="info.circle.fill" />}
          >
            <Text modifiers={[font({ design: "rounded" })]}>
              {Application.nativeApplicationVersion ?? "1.0.0"}
            </Text>
          </LabeledContent>
        </Section>
      </Form>
    </Host>
  );
}
