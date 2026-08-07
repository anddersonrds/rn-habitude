import { appFontFamily } from "@/theme/typography";
import { Color } from "expo-router";
import { Text as RNText } from "react-native";
import { styles } from "./styles";
import type { Props } from "./types";

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
