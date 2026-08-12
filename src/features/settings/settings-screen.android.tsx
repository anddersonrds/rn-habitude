import { formatCount } from "@/lib/utils/numbers";
import { accent, success, useSystemColors } from "@/theme";
import {
  DropdownMenu,
  DropdownMenuItem,
  Host,
  LazyColumn,
  Text,
  TextButton,
} from "@expo/ui/jetpack-compose";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useColorScheme } from "react-native";
import { SettingsButton } from "./components/settings-button";
import { SettingsLabel } from "./components/settings-label";
import { useSettingsModel } from "./hooks/use-settings-model";

/** The `Section` header SwiftUI draws for free; Compose has no `Section`. */
function SectionLabel({ children }: { children: string }) {
  const colors = useSystemColors();

  /* A Compose colour is a string; `tsc` reads the palette's iOS type. */
  return (
    <Text
      style={{ typography: "labelLarge" }}
      color={String(colors.secondaryText)}
    >
      {children}
    </Text>
  );
}

function Footnote({ children }: { children: string }) {
  const colors = useSystemColors();

  return (
    <Text
      style={{ typography: "bodySmall" }}
      color={String(colors.secondaryText)}
    >
      {children}
    </Text>
  );
}

/**
 * Settings in Jetpack Compose. The SwiftUI `Form` of `Section`s becomes a
 * `LazyColumn` of rows under their own labels, and the language `Picker` - a
 * menu on iOS - becomes the Material menu, a `DropdownMenu` anchored on the
 * same row. Its open state is held here because the trigger has to be a row
 * this screen owns.
 */
export function SettingsScreen() {
  const { t, i18n } = useTranslation(["settings", "language"]);
  const colors = useSystemColors();
  const scheme = useColorScheme();
  const [choosingLanguage, setChoosingLanguage] = useState(false);
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

  /* The model names a SwiftUI colour; this is the same meaning in Material. */
  const permissionTint =
    permissionColor === "green"
      ? success
      : permissionColor === "red"
        ? String(colors.destructive)
        : String(colors.secondaryText);

  const activeLanguage =
    languages.find((entry) => entry.tag === language)?.label ?? "";

  return (
    <Host style={{ flex: 1 }} colorScheme={scheme} seedColor={accent}>
      <LazyColumn
        contentPadding={{ start: 16, top: 12, end: 16, bottom: 24 }}
        verticalArrangement={{ spacedBy: 8 }}
      >
        <SectionLabel>{t("language:title")}</SectionLabel>
        <DropdownMenu
          expanded={choosingLanguage}
          onDismissRequest={() => setChoosingLanguage(false)}
        >
          <DropdownMenu.Trigger>
            <SettingsButton
              label={t("language:title")}
              systemImage="globe.americas.fill"
              value={activeLanguage}
              onPress={() => setChoosingLanguage(true)}
            />
          </DropdownMenu.Trigger>
          <DropdownMenu.Items>
            {languages.map((entry) => (
              <DropdownMenuItem
                key={entry.tag}
                onClick={() => {
                  setChoosingLanguage(false);
                  chooseLanguage(entry.tag);
                }}
              >
                <DropdownMenuItem.Text>
                  <Text>{entry.label}</Text>
                </DropdownMenuItem.Text>
              </DropdownMenuItem>
            ))}
          </DropdownMenu.Items>
        </DropdownMenu>

        <SectionLabel>{t("notifications")}</SectionLabel>
        <SettingsLabel
          label={t("permission")}
          systemImage="bell.fill"
          value={permissionLabel}
          valueColor={permissionTint}
        />
        {canRequestPermission && (
          <SettingsButton
            label={t("allowNotifications")}
            systemImage="bell.badge"
            onPress={() => void requestPermission()}
          />
        )}
        {canOpenSettings && (
          <SettingsButton
            label={t("openSettings")}
            systemImage="gear"
            onPress={openSystemSettings}
          />
        )}
        <SettingsButton
          label={t("sendTestNotification")}
          systemImage="paperplane"
          onPress={() => void sendTest()}
        />
        <Footnote>{t("notificationsFooter")}</Footnote>

        <SectionLabel>{t("data")}</SectionLabel>
        <SettingsButton
          label={t("loadSampleData")}
          systemImage="wand.and.stars"
          onPress={loadSample}
        />
        {hasHabits && (
          <TextButton onClick={deleteEverything}>
            <Text color={String(colors.destructive)}>{t("deleteAllData")}</Text>
          </TextButton>
        )}
        <Footnote>{t("dataFooter")}</Footnote>

        <SectionLabel>{t("about")}</SectionLabel>
        <SettingsButton
          label={t("viewOnboarding")}
          systemImage="sparkles"
          onPress={viewOnboarding}
        />
        <SettingsLabel
          label={t("habits")}
          systemImage="list.bullet"
          value={formatCount(habitCount, i18n.language)}
        />
        <SettingsLabel
          label={t("checkIns")}
          systemImage="checkmark.seal.fill"
          value={formatCount(totalCheckIns, i18n.language)}
        />
        <SettingsLabel
          label={t("version")}
          systemImage="info.circle.fill"
          value={version}
        />
      </LazyColumn>
    </Host>
  );
}
