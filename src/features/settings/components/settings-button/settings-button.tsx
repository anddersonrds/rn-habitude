import { Button } from "@expo/ui/swift-ui";
import { SettingsLabel } from "../settings-label";
import type { Props } from "./types";

export function SettingsButton({ label, systemImage, onPress }: Props) {
  return (
    <Button onPress={onPress}>
      <SettingsLabel label={label} systemImage={systemImage} />
    </Button>
  );
}
