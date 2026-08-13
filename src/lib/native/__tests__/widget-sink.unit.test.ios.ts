import HabitudeWidget, {
  type HabitudeWidgetProps,
} from "@/../widgets/HabitudeWidget";
import { pushWidgetSnapshot } from "@/lib/native/widget-sink";

const SNAPSHOT: HabitudeWidgetProps = {
  rows: [],
  totalHabits: 0,
  doneToday: 0,
  dueToday: 0,
  date: "2026-07-29",
};

describe("pushWidgetSnapshot", () => {
  it("should hand the snapshot to the widget extension unchanged", () => {
    pushWidgetSnapshot(SNAPSHOT);

    expect(HabitudeWidget.updateSnapshot).toHaveBeenCalledWith(SNAPSHOT);
  });
});
