import { formatCount } from "@/lib/numbers";
import {
  Button,
  Form,
  Host,
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
import { useTranslation } from "react-i18next";
import { SettingsButton } from "./components/settings-button";
import { SettingsLabel } from "./components/settings-label";
import { useSettingsModel } from "./hooks/use-settings-model";

export function SettingsScreen() {
  const { t, i18n } = useTranslation(["settings", "language"]);
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
        <Section title={t("language:title")}>
          <Picker
            label={t("language:title")}
            selection={language}
            onSelectionChange={chooseLanguage}
            modifiers={[pickerStyle("menu")]}
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

        <Section
          title={t("notifications")}
          footer={
            <Text
              modifiers={[font({ design: "rounded", textStyle: "footnote" })]}
            >
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
            <Text
              modifiers={[font({ design: "rounded", textStyle: "footnote" })]}
            >
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
            <Text modifiers={[font({ design: "rounded" })]}>{formatCount(habitCount, i18n.language)}</Text>
          </LabeledContent>
          <LabeledContent
            label={
              <SettingsLabel
                label={t("checkIns")}
                systemImage="checkmark.seal.fill"
              />
            }
          >
            <Text modifiers={[font({ design: "rounded" })]}>{formatCount(totalCheckIns, i18n.language)}</Text>
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
      </Form>
    </Host>
  );
}
