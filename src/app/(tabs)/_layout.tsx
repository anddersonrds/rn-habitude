import { haptic } from "@/lib/native/haptics";
import { useTabBarHidden } from "@/lib/native/tab-bar";
import { accent } from "@/theme";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useTranslation } from "react-i18next";

export default function TabLayout() {
  const { t } = useTranslation("tabs");
  const hidden = useTabBarHidden();

  return (
    <NativeTabs
      hidden={hidden}
      disableTransparentOnScrollEdge
      tintColor={accent}
      minimizeBehavior="never"
      screenListeners={{
        tabPress: () => haptic.impact(),
      }}
    >
      <NativeTabs.Trigger name="(today)">
        <NativeTabs.Trigger.Label>{t("today")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="checklist" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="habits">
        <NativeTabs.Trigger.Label>{t("habits")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="square.grid.2x2.fill" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>{t("settings")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape.fill" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
