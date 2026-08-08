import type { typography } from "@/theme";
import type { TextProps } from "react-native";

export type Variant = keyof typeof typography;

export type Props = TextProps & {
  variant?: Variant;
  /** Use the secondary/tertiary label system color. */
  secondary?: boolean;
  tertiary?: boolean;
};
