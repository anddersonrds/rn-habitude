import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

export default function HabitsLayout() {
  const { t } = useTranslation("tabs");

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: t("habits"),
          /* eslint-disable-next-line no-restricted-syntax -- A route file cannot
          fork; the Android screen blanks this and draws its own. */
          headerLargeTitleEnabled: true,
        }}
      />
    </Stack>
  );
}
