import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

export default function TodayLayout() {
  const { t } = useTranslation("tabs");

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: t("today"),
          /* eslint-disable-next-line no-restricted-syntax -- A route file cannot fork. */
          headerLargeTitleEnabled: true,
        }}
      />
    </Stack>
  );
}
