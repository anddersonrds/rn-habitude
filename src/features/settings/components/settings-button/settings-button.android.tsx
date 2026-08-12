import { Box } from "@expo/ui/jetpack-compose";
import { clickable, clip, fillMaxWidth, Shapes } from "@expo/ui/jetpack-compose/modifiers";
import { SettingsLabel } from "../settings-label";
import { SETTINGS_ROW_RADIUS } from "../row";
import type { Props } from "./types";

/**
 * The pressable row is the label row made clickable, so a button and a value
 * row are the same shape. The clip is what keeps the ripple inside that shape.
 */
export function SettingsButton({ label, systemImage, onPress, value }: Props) {
  return (
    <Box
      modifiers={[
        fillMaxWidth(),
        clip(Shapes.RoundedCorner(SETTINGS_ROW_RADIUS)),
        clickable(onPress),
      ]}
    >
      <SettingsLabel label={label} systemImage={systemImage} value={value} />
    </Box>
  );
}
