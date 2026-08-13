import type { WidgetRepresentation } from "react-native-android-widget";
import { accent } from "../../src/theme/accent";
import type { HabitudeWidgetProps } from "../HabitudeWidget";
import { HabitudeAndroidWidget } from "./habitude-widget";

/** The name the config plugin declares, and what the launcher asks for. */
export const ANDROID_WIDGET_NAME = "HabitudeWidget";

/**
 * Both appearances are drawn every time: the widget is a bitmap, so the system
 * cannot restyle it when the scheme changes.
 */
export function renderHabitudeWidget(
  snapshot: HabitudeWidgetProps,
  widthDp: number,
): WidgetRepresentation {
  return {
    light: (
      <HabitudeAndroidWidget
        snapshot={snapshot}
        appearance="light"
        widthDp={widthDp}
        accent={accent}
      />
    ),
    dark: (
      <HabitudeAndroidWidget
        snapshot={snapshot}
        appearance="dark"
        widthDp={widthDp}
        accent={accent}
      />
    ),
  };
}
