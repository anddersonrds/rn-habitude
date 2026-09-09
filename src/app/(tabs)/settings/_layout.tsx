import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

export default function SettingsLayout() {
  const { t } = useTranslation("tabs");

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: t("settings"),
          /* eslint-disable-next-line no-restricted-syntax -- A route file cannot
          take an `.android` sibling. The Android screen blanks this title and
          draws its own, so the two never appear together. */
          headerLargeTitleEnabled: true,
        }}
      />
    </Stack>
  );
}
