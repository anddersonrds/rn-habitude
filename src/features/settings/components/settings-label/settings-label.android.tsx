import { ComposeSymbol } from "@/components/ui/compose-symbol";
import { accent, useSystemColors } from "@/theme";
import { ListItem, Text } from "@expo/ui/jetpack-compose";
import { clip, fillMaxWidth, Shapes } from "@expo/ui/jetpack-compose/modifiers";
import { SETTINGS_ROW_RADIUS } from "../row";
import type { Props } from "./types";

export function SettingsLabel({
  label,
  systemImage,
  value,
  valueColor,
}: Props) {
  const colors = useSystemColors();

  return (
    <ListItem
      modifiers={[fillMaxWidth(), clip(Shapes.RoundedCorner(SETTINGS_ROW_RADIUS))]}
    >
      <ListItem.LeadingContent>
        <ComposeSymbol name={systemImage} size={18} color={accent} />
      </ListItem.LeadingContent>
      <ListItem.HeadlineContent>
        <Text>{label}</Text>
      </ListItem.HeadlineContent>
      {value !== undefined && (
        <ListItem.TrailingContent>
          <Text color={valueColor ?? String(colors.secondaryText)}>{value}</Text>
        </ListItem.TrailingContent>
      )}
    </ListItem>
  );
}
