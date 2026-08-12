import type { ColorValue } from "react-native";

export type Props = {
  /** An SF Symbol name, as the app stores it. */
  name: string;
  size?: number;
  color: ColorValue;
  contentDescription?: string;
};
