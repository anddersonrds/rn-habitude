import { requestWidgetUpdate } from "react-native-android-widget";
import type { HabitudeWidgetProps } from "../../../widgets/HabitudeWidget";
import {
  ANDROID_WIDGET_NAME,
  renderHabitudeWidget,
} from "../../../widgets/android/render";
import { saveWidgetSnapshot } from "../../../widgets/android/snapshot";

/**
 * Two halves, because the launcher can ask for a redraw with the app closed:
 * the snapshot is stored for that handler, and the widgets already on a home
 * screen are redrawn now.
 */
export function pushWidgetSnapshot(props: HabitudeWidgetProps): void {
  saveWidgetSnapshot(props);

  void requestWidgetUpdate({
    widgetName: ANDROID_WIDGET_NAME,
    renderWidget: ({ width }) => renderHabitudeWidget(props, width),
  });
}
