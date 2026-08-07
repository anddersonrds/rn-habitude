import { Color } from "expo-router";
import { Text as RNText } from "react-native";
import { styles } from "./styles";
import type { Props } from "./types";

/** SF Rounded, matching the SwiftUI screens that use `font({ design: "rounded" })`. */
export const appFontFamily = "ui-rounded";

export function Text({
  variant = "body",
  secondary,
  tertiary,
  style,
  ...rest
}: Props) {
  return (
    <RNText
      {...rest}
      style={[
        styles[variant],
        { fontFamily: appFontFamily, color: Color.ios.label },
        secondary && { color: Color.ios.secondaryLabel },
        tertiary && { color: Color.ios.tertiaryLabel },
        style,
      ]}
    />
  );
}
