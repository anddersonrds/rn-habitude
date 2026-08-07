import { accent, colors } from "@/theme/colors";
import { Image, Label, Text } from "@expo/ui/swift-ui";
import { font, foregroundStyle } from "@expo/ui/swift-ui/modifiers";
import type { Props } from "./types";

export function SettingsLabel({ label, systemImage }: Props) {
  return (
    <Label icon={<Image systemName={systemImage} color={accent} size={18} />}>
      <Text
        modifiers={[
          font({ design: "rounded" }),
          foregroundStyle({ type: "color", color: colors.text }),
        ]}
      >
        {label}
      </Text>
    </Label>
  );
}
