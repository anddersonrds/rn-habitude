import type { ColorValue } from "react-native";

export type Props = {
  /** An SF Symbol name, as the app stores it. */
  name: string;
  /** In dp. Also part of the cache key, since the image is rasterised at it. */
  size?: number;
  /** Required: the image carries its colour, so there is nothing to inherit. */
  color: ColorValue;
  contentDescription?: string;
};
