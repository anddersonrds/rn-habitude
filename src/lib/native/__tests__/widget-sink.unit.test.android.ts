import type { HabitudeWidgetProps } from "@/../widgets/HabitudeWidget";
import { readWidgetSnapshot } from "@/../widgets/android/snapshot";
import { pushWidgetSnapshot } from "@/lib/native/widget-sink";

const mockRequestWidgetUpdate = jest.fn();

jest.mock("react-native-android-widget", () => ({
  ...jest.requireActual("react-native-android-widget"),
  requestWidgetUpdate: (...args: unknown[]) => mockRequestWidgetUpdate(...args),
}));

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

beforeEach(() => {
  jest.clearAllMocks();
});

describe("pushWidgetSnapshot", () => {
  it("should store the snapshot for a redraw the app is not around for", () => {
    pushWidgetSnapshot(SNAPSHOT);

    expect(readWidgetSnapshot()).toEqual(SNAPSHOT);
  });

  it("should redraw the widgets already on a home screen", () => {
    pushWidgetSnapshot(SNAPSHOT);

    expect(mockRequestWidgetUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ widgetName: "HabitudeWidget" }),
    );
  });

  it("should draw the update from the snapshot it was given, in both appearances", () => {
    pushWidgetSnapshot(SNAPSHOT);

    const { renderWidget } = mockRequestWidgetUpdate.mock.calls[0][0];
    const drawn = renderWidget({ width: 300 });

    expect(drawn.light.props.snapshot).toBe(SNAPSHOT);
    expect(drawn.dark.props.appearance).toBe("dark");
  });
});
