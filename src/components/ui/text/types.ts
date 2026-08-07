import type { TextProps } from "react-native";

export type Variant =
  | "largeTitle"
  | "title"
  | "title2"
  | "title3"
  | "headline"
  | "body"
  | "subheadline"
  | "footnote"
  | "caption";

export type Props = TextProps & {
  variant?: Variant;
  /** Use the secondary/tertiary label system color. */
  secondary?: boolean;
  tertiary?: boolean;
};
