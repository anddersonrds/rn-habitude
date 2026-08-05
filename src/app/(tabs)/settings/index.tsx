import { useSettingsModel } from "@/components/screens/settings/useSettingsModel";
import { accent, colors } from "@/theme/colors";
import {
  Button,
  Form,
  Host,
  Image,
  Label,
  LabeledContent,
  Picker,
  Section,
  Text,
} from "@expo/ui/swift-ui";
import {
  font,
  foregroundStyle,
  pickerStyle,
  tag,
} from "@expo/ui/swift-ui/modifiers";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation(["settings", "language"]);
  const {
    permissionLabel,
    permissionColor,
    canRequestPermission,
    canOpenSettings,
    habitCount,
    totalCheckIns,
    hasHabits,
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
  } = useSettingsModel();

  return (
    <Host style={{ flex: 1 }}>
      <Form>
        <Section
          title={t("notifications")}
          footer={
            <Text modifiers={[font({ design: "rounded" })]}>
              {t("notificationsFooter")}
            </Text>
          }
        >
          <LabeledContent
            label={
              <SettingsLabel label={t("permission")} systemImage="bell.fill" />
            }
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
              label={t("allowNotifications")}
              systemImage="bell.badge"
              onPress={() => void requestPermission()}
            />
          )}
          {canOpenSettings && (
            <SettingsButton
              label={t("openIosSettings")}
              systemImage="gear"
              onPress={openSystemSettings}
            />
          )}
          <SettingsButton
            label={t("sendTestNotification")}
            systemImage="paperplane"
            onPress={() => void sendTest()}
          />
        </Section>

        <Section
          title={t("data")}
          footer={
            <Text modifiers={[font({ design: "rounded" })]}>
              {t("dataFooter")}
            </Text>
          }
        >
          <SettingsButton
            label={t("loadSampleData")}
            systemImage="wand.and.stars"
            onPress={loadSample}
          />
          {hasHabits && (
            <Button
              label={t("deleteAllData")}
              role="destructive"
              onPress={deleteEverything}
            />
          )}
        </Section>

        <Section title={t("about")}>
          <SettingsButton
            label={t("viewOnboarding")}
            systemImage="sparkles"
            onPress={viewOnboarding}
          />
          <LabeledContent
            label={
              <SettingsLabel label={t("habits")} systemImage="list.bullet" />
            }
          >
            <Text modifiers={[font({ design: "rounded" })]}>{`${habitCount}`}</Text>
          </LabeledContent>
          <LabeledContent
            label={
              <SettingsLabel
                label={t("checkIns")}
                systemImage="checkmark.seal.fill"
              />
            }
          >
            <Text modifiers={[font({ design: "rounded" })]}>{`${totalCheckIns}`}</Text>
          </LabeledContent>
          <LabeledContent
            label={
              <SettingsLabel
                label={t("version")}
                systemImage="info.circle.fill"
              />
            }
          >
            <Text modifiers={[font({ design: "rounded" })]}>
              {version}
            </Text>
          </LabeledContent>
        </Section>

        <Section title={t("language:title")}>
          {/* SwiftUI draws the row, its current value, the push and the
          checkmark. `automatic` inside a Form can resolve to a popup menu,
          which has neither a row value nor a pushed list. */}
          <Picker
            label={t("language:title")}
            selection={language}
            onSelectionChange={chooseLanguage}
            modifiers={[pickerStyle("navigationLink")]}
          >
            {languages.map((entry) => (
              <Text
                key={entry.tag}
                modifiers={[tag(entry.tag), font({ design: "rounded" })]}
              >
                {entry.label}
              </Text>
            ))}
          </Picker>
        </Section>
      </Form>
    </Host>
  );
}
