import type { Image } from "@expo/ui/swift-ui";
import type { ComponentProps } from "react";

export type SettingsIcon = NonNullable<
  ComponentProps<typeof Image>["systemName"]
>;

export type Props = {
  label: string;
  systemImage: SettingsIcon;
  /** Drawn by the Compose row only; on iOS the `LabeledContent` carries it. */
  value?: string;
  valueColor?: string;
};
