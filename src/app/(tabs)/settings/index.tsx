import { useSettingsModel } from "@/components/screens/settings/useSettingsModel";
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
import type { ComponentProps } from "react";

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
  const {
    permissionLabel,
    permissionColor,
    canRequestPermission,
    canOpenSettings,
    habitCount,
    totalCheckIns,
    hasHabits,
    version,
    requestPermission,
    openSystemSettings,
    sendTest,
    loadSample,
    deleteEverything,
    viewOnboarding,
  } = useSettingsModel();

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
          {canRequestPermission && (
            <SettingsButton
              label="Allow notifications"
              systemImage="bell.badge"
              onPress={() => void requestPermission()}
            />
          )}
          {canOpenSettings && (
            <SettingsButton
              label="Open iOS Settings"
              systemImage="gear"
              onPress={openSystemSettings}
            />
          )}
          <SettingsButton
            label="Send test notification"
            systemImage="paperplane"
            onPress={() => void sendTest()}
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
            onPress={loadSample}
          />
          {hasHabits && (
            <Button
              label="Delete all data"
              role="destructive"
              onPress={deleteEverything}
            />
          )}
        </Section>

        <Section title="About">
          <SettingsButton
            label="View onboarding"
            systemImage="sparkles"
            onPress={viewOnboarding}
          />
          <LabeledContent
            label={<SettingsLabel label="Habits" systemImage="list.bullet" />}
          >
            <Text modifiers={[font({ design: "rounded" })]}>{`${habitCount}`}</Text>
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
              {version}
            </Text>
          </LabeledContent>
        </Section>
      </Form>
    </Host>
  );
}
