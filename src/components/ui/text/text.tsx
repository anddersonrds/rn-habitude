import { appFontFamily, colors } from "@/theme";
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
        { fontFamily: appFontFamily, color: colors.text },
        secondary && { color: colors.secondaryText },
        tertiary && { color: colors.tertiaryText },
        style,
      ]}
    />
  );
}
