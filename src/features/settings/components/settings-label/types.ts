import type { Image } from "@expo/ui/swift-ui";
import type { ComponentProps } from "react";

export type SettingsIcon = NonNullable<
  ComponentProps<typeof Image>["systemName"]
>;

export type Props = {
  label: string;
  systemImage: SettingsIcon;
  /**
   * The trailing value, and the emphasis it carries. Only the Android row draws
   * them: on iOS the value comes from the `LabeledContent` wrapping the label,
   * and Compose has no such thing.
   */
  value?: string;
  valueColor?: string;
};
