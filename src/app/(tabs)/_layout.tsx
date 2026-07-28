import { haptic } from "@/lib/haptics";
import { useTabBarHidden } from "@/lib/tab-bar";
import { accent } from "@/theme/colors";
import { NativeTabs } from "expo-router/unstable-native-tabs";

export default function TabLayout() {
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
        <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="checklist" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="habits">
        <NativeTabs.Trigger.Label>Habits</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="square.grid.2x2.fill" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape.fill" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
