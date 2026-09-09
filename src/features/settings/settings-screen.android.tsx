import { useConfirm } from "@/components/ui/confirm-dialog";
import { formatCount } from "@/lib/utils/numbers";
import { success } from "@/theme";
import {
  DropdownMenu,
  DropdownMenuItem,
  Host,
  LazyColumn,
  Text,
  TextButton,
  useMaterialColors,
} from "@expo/ui/jetpack-compose";
import { Stack } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SettingsButton } from "./components/settings-button";
import { SettingsLabel } from "./components/settings-label";
import { useSettingsModel } from "./hooks/use-settings-model";

/* Material 3's navigation bar height: the native tab bar draws over the
content and measures nothing for JavaScript to read. */
const TAB_BAR_HEIGHT = 80;

/* Compose has no `Section`, so its header is a label of our own. */
function SectionLabel({ children }: { children: string }) {
  const material = useMaterialColors();

  return (
    <Text
      style={{ typography: "labelLarge" }}
      color={material.onSurfaceVariant}
    >
      {children}
    </Text>
  );
}

function Footnote({ children }: { children: string }) {
  const material = useMaterialColors();

  return (
    <Text
      style={{ typography: "bodySmall" }}
      color={material.onSurfaceVariant}
    >
      {children}
    </Text>
  );
}

/**
 * The language menu holds its open state here because its trigger has to be a
 * row this screen owns.
 */
export function SettingsScreen() {
  const { t, i18n } = useTranslation(["settings", "language", "tabs"]);
  const material = useMaterialColors();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const [choosingLanguage, setChoosingLanguage] = useState(false);
  const { confirm, dialog } = useConfirm();
  const {
    permissionLabel,
    permissionColor,
    canRequestPermission,
    canOpenSettings,
    canOpenExactAlarms,
    openExactAlarms,
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
  } = useSettingsModel(confirm);

  /* The model names a SwiftUI colour; this is the same meaning in Material. */
  const permissionTint =
    permissionColor === "green"
      ? success
      : permissionColor === "red"
        ? material.error
        : material.onSurfaceVariant;

  const activeLanguage =
    languages.find((entry) => entry.tag === language)?.label ?? "";

  return (
    <>
      {/* The screen draws the title itself, so the bar carries none and the two
      never appear at once. */}
      <Stack.Screen options={{ title: "" }} />

      {/* The background stops the navigator showing through between the rows. */}
      <Host style={{ flex: 1, backgroundColor: material.surface }}>
        <LazyColumn
          contentPadding={{
            start: 16,
            top: 12,
            end: 16,
            bottom: TAB_BAR_HEIGHT + bottomInset,
          }}
          verticalArrangement={{ spacedBy: 8 }}
        >
          <Text
            style={{ typography: "headlineLarge" }}
            color={material.onSurface}
          >
            {t("tabs:settings")}
          </Text>

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
          {canOpenExactAlarms && (
            <SettingsButton
              label={t("exactAlarms")}
              systemImage="alarm"
              onPress={openExactAlarms}
            />
          )}
          <Footnote>{t("notificationsFooter")}</Footnote>

          <SectionLabel>{t("data")}</SectionLabel>
          <SettingsButton
            label={t("loadSampleData")}
            systemImage="wand.and.stars"
            onPress={loadSample}
          />
          {hasHabits && (
            <TextButton onClick={deleteEverything}>
              <Text color={material.error}>
                {t("deleteAllData")}
              </Text>
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
      {dialog}
    </>
  );
}
