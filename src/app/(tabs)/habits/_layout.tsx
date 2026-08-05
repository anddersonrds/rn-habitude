import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

export default function HabitsLayout() {
  const { t } = useTranslation("tabs");

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: t("habits"), headerLargeTitleEnabled: true }}
      />
    </Stack>
  );
}
