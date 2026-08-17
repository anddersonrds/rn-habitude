import { ComposeSymbol } from "@/components/ui/compose-symbol";
import { accent } from "@/theme";
import { ListItem, Text, useMaterialColors } from "@expo/ui/jetpack-compose";
import { clip, fillMaxWidth, Shapes } from "@expo/ui/jetpack-compose/modifiers";
import { SETTINGS_ROW_RADIUS } from "../row";
import type { Props } from "./types";

export function SettingsLabel({
  label,
  systemImage,
  value,
  valueColor,
}: Props) {
  const material = useMaterialColors();

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
          <Text color={valueColor ?? material.onSurfaceVariant}>{value}</Text>
        </ListItem.TrailingContent>
      )}
    </ListItem>
  );
}
