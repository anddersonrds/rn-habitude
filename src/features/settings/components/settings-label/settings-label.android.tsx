import { ComposeSymbol } from "@/components/ui/compose-symbol";
import { accent, useSystemColors } from "@/theme";
import { ListItem, Text } from "@expo/ui/jetpack-compose";
import { clip, fillMaxWidth, Shapes } from "@expo/ui/jetpack-compose/modifiers";
import { SETTINGS_ROW_RADIUS } from "../row";
import type { Props } from "./types";

/**
 * A `Form` row is a `ListItem` here, which carries the value in a slot of its
 * own - iOS gets it from the `LabeledContent` around the label, and Compose has
 * neither `Form` nor `LabeledContent`.
 */
export function SettingsLabel({ label, systemImage, value }: Props) {
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
          {/* A Compose colour is a string; `tsc` reads the palette's iOS type. */}
          <Text color={String(colors.secondaryText)}>{value}</Text>
        </ListItem.TrailingContent>
      )}
    </ListItem>
  );
}
