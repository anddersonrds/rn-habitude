import type {
  WidgetTaskHandlerProps,
  WidgetInfo,
} from "react-native-android-widget";
import type { HabitudeWidgetProps } from "../../HabitudeWidget";
import { saveWidgetSnapshot, WIDGET_SNAPSHOT_SETTING } from "../snapshot";
import { widgetTaskHandler } from "../widget-task-handler";
import { setSetting } from "../../../src/lib/data/db";

const SNAPSHOT: HabitudeWidgetProps = {
  rows: [
    {
      name: "Walk outside",
      icon: "figure.walk",
      color: "#34C759",
      days: [2, 2, 2],
      streak: 3,
    },
  ],
  totalHabits: 1,
  doneToday: 1,
  dueToday: 1,
  date: "2026-07-29",
};

const WIDGET_INFO: WidgetInfo = {
  widgetName: "HabitudeWidget",
  widgetId: 1,
  width: 300,
  height: 110,
  screenInfo: {
    screenHeightDp: 800,
    screenWidthDp: 400,
    density: 3,
    densityDpi: 480,
  },
};

function handle(overrides: Partial<WidgetTaskHandlerProps> = {}) {
  const renderWidget = jest.fn();

  return {
    renderWidget,
    done: widgetTaskHandler({
      widgetInfo: WIDGET_INFO,
      widgetAction: "WIDGET_ADDED",
      renderWidget,
      ...overrides,
    }),
  };
}

beforeEach(() => {
  saveWidgetSnapshot(SNAPSHOT);
});

describe("widgetTaskHandler", () => {
  it("should draw what the app pushed last", async () => {
    const { renderWidget, done } = handle();
    await done;

    expect(renderWidget.mock.calls[0][0].light.props.snapshot).toEqual(SNAPSHOT);
  });

  it("should draw the empty state when the app has never pushed", async () => {
    setSetting(WIDGET_SNAPSHOT_SETTING, "not json");

    const { renderWidget, done } = handle();
    await done;

    expect(renderWidget.mock.calls[0][0].light.props.snapshot.rows).toEqual([]);
  });

  it("should ignore a widget that is not this one", async () => {
    const { renderWidget, done } = handle({
      widgetInfo: { ...WIDGET_INFO, widgetName: "Something else" },
    });
    await done;

    expect(renderWidget).not.toHaveBeenCalled();
  });

  it("should not redraw a widget being removed, nor one being tapped", async () => {
    const removed = handle({ widgetAction: "WIDGET_DELETED" });
    const tapped = handle({ widgetAction: "WIDGET_CLICK" });
    await Promise.all([removed.done, tapped.done]);

    expect(removed.renderWidget).not.toHaveBeenCalled();
    expect(tapped.renderWidget).not.toHaveBeenCalled();
  });
});
