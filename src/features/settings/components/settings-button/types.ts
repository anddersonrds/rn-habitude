import type { SettingsIcon } from "../settings-label/types";

export type Props = {
  label: string;
  systemImage: SettingsIcon;
  onPress: () => void;
  /** Forwarded to the label, which is the only platform that draws one. */
  value?: string;
};
