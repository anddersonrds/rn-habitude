import type { Image } from "@expo/ui/swift-ui";
import type { ComponentProps } from "react";

export type SettingsIcon = NonNullable<
  ComponentProps<typeof Image>["systemName"]
>;

export type Props = {
  label: string;
  systemImage: SettingsIcon;
  /**
   * The trailing value. Only the Android row draws it: on iOS the value comes
   * from the `LabeledContent` wrapping the label, and Compose has no such thing.
   */
  value?: string;
};
