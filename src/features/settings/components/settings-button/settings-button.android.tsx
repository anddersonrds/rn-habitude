import { Box } from "@expo/ui/jetpack-compose";
import { clickable, clip, fillMaxWidth, Shapes } from "@expo/ui/jetpack-compose/modifiers";
import { SettingsLabel } from "../settings-label";
import { SETTINGS_ROW_RADIUS } from "../row";
import type { Props } from "./types";

/* The clip is what keeps the ripple inside the row's own shape. */
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
