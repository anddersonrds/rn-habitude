import { Color } from "expo-router";
import { Text as RNText, StyleSheet, type TextProps } from "react-native";

type Variant =
  | "largeTitle"
  | "title"
  | "title2"
  | "title3"
  | "headline"
  | "body"
  | "subheadline"
  | "footnote"
  | "caption";

type Props = TextProps & {
  variant?: Variant;
  /** Use the secondary/tertiary label system color. */
  secondary?: boolean;
  tertiary?: boolean;
};

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

const styles = StyleSheet.create({
  largeTitle: { fontSize: 34, fontWeight: "700", letterSpacing: 0.4 },
  title: { fontSize: 28, fontWeight: "700", letterSpacing: 0.36 },
  title2: { fontSize: 22, fontWeight: "700", letterSpacing: 0.35 },
  title3: { fontSize: 20, fontWeight: "600", letterSpacing: 0.38 },
  headline: { fontSize: 17, fontWeight: "600", letterSpacing: -0.41 },
  body: { fontSize: 17, letterSpacing: -0.41 },
  subheadline: { fontSize: 15, letterSpacing: -0.24 },
  footnote: { fontSize: 13, letterSpacing: -0.08 },
  caption: { fontSize: 12 },
});
