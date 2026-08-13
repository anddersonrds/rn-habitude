import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import type { HabitudeWidgetProps } from "../HabitudeWidget";
import { ANDROID_WIDGET_NAME, renderHabitudeWidget } from "./render";
import { readWidgetSnapshot } from "./snapshot";

const EMPTY: HabitudeWidgetProps = {
  rows: [],
  totalHabits: 0,
  doneToday: 0,
  dueToday: 0,
  date: "",
};

export async function widgetTaskHandler(
  props: WidgetTaskHandlerProps,
): Promise<void> {
  if (props.widgetInfo.widgetName !== ANDROID_WIDGET_NAME) return;
  if (props.widgetAction === "WIDGET_DELETED") return;
  /* A tap is `OPEN_APP`, which the launcher acts on without a redraw. */
  if (props.widgetAction === "WIDGET_CLICK") return;

  props.renderWidget(
    renderHabitudeWidget(readWidgetSnapshot() ?? EMPTY, props.widgetInfo.width),
  );
}
