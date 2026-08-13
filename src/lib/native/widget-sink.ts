import HabitudeWidget, {
  type HabitudeWidgetProps,
} from "../../../widgets/HabitudeWidget";

export function pushWidgetSnapshot(props: HabitudeWidgetProps): void {
  HabitudeWidget.updateSnapshot(props);
}
