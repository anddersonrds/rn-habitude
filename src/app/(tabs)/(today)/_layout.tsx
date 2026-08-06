import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

export default function TodayLayout() {
  const { t } = useTranslation("tabs");

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: t("today"), headerLargeTitleEnabled: true }}
      />
    </Stack>
  );
}
