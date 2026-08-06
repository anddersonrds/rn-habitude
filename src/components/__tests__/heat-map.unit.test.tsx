import { HeatMap } from "@/components/HeatMap";
import i18n from "@/i18n/i18next";
import { makeHabit } from "@/test-utils/factories";
import { renderWithProviders } from "@/test-utils/render";
import { freezeClock, restoreClock } from "@/test-utils/time";
import { Color } from "expo-router";
import { StyleSheet } from "react-native";
import type { TestInstance } from "test-renderer";

/*
A Wednesday, so the last column is a partial week: the three days after it are
the future, which is a different blank from the days before the habit existed.
The grid ends on the Saturday of this week and starts on a Sunday.
*/
const TODAY = "2026-07-29T12:00:00-03:00";

const WEEKDAYS = [1, 2, 3, 4, 5];
const HABIT_COLOR = "#FF9500";

const DONE = HABIT_COLOR;
const TODAY_PENDING = `${HABIT_COLOR}55`;
const MISSED = Color.ios.tertiarySystemFill;
const UNSCHEDULED = Color.ios.quaternarySystemFill;
const BLANK = "transparent";

/* Cells carry no text and no name; their square shape is what marks them. */
function cellColors(container: TestInstance, cellSize = 11) {
  return container
    .queryAll(
      (node) =>
        node.props.style?.width === cellSize &&
        node.props.style?.height === cellSize,
    )
    .map((cell) => StyleSheet.flatten(cell.props.style).backgroundColor);
}

/* Month labels are the only absolutely positioned thing the grid draws. */
function labelPositions(container: TestInstance) {
  return container
    .queryAll(
      (node) => StyleSheet.flatten(node.props.style)?.position === "absolute",
    )
    .map((label) => ({
      label: label.children.join(""),
      left: StyleSheet.flatten(label.props.style).left,
    }));
}

beforeEach(async () => {
  await i18n.changeLanguage("en");
  freezeClock(TODAY);
});
afterEach(restoreClock);

describe("HeatMap", () => {
  const habit = makeHabit({
    color: HABIT_COLOR,
    createdAt: "2026-07-15",
    weekdays: WEEKDAYS,
  });

  it("should draw a column of seven days for every week it is given", async () => {
    const { container } = await renderWithProviders(
      <HeatMap habit={habit} completed={undefined} weeks={3} />,
    );

    expect(cellColors(container)).toHaveLength(21);
  });

  it("should draw eighteen weeks when no span is given", async () => {
    const { container } = await renderWithProviders(
      <HeatMap habit={habit} completed={undefined} />,
    );

    expect(cellColors(container)).toHaveLength(126);
  });

  it("should draw a single week", async () => {
    const { container } = await renderWithProviders(
      <HeatMap habit={habit} completed={undefined} weeks={1} />,
    );

    expect(cellColors(container)).toHaveLength(7);
  });

  it("should draw a full year", async () => {
    const { container } = await renderWithProviders(
      <HeatMap habit={habit} completed={undefined} weeks={52} />,
    );

    expect(cellColors(container)).toHaveLength(364);
  });

  it("should color every day by what happened on it", async () => {
    const { container } = await renderWithProviders(
      <HeatMap
        habit={habit}
        completed={{ "2026-07-16": true }}
        weeks={3}
      />,
    );

    expect(cellColors(container)).toEqual([
      /* The week before the habit existed. */
      BLANK, BLANK, BLANK,
      MISSED, DONE, MISSED,
      UNSCHEDULED,
      /* A full week: the weekend is off, the weekdays went by unchecked. */
      UNSCHEDULED, MISSED, MISSED, MISSED, MISSED, MISSED, UNSCHEDULED,
      /* This week, up to today, then the days that have not happened. */
      UNSCHEDULED, MISSED, MISSED, TODAY_PENDING, BLANK, BLANK, BLANK,
    ]);
  });

  it("should hint today in the habit's own color rather than call it missed", async () => {
    const { container } = await renderWithProviders(
      <HeatMap habit={habit} completed={undefined} weeks={1} />,
    );

    expect(cellColors(container)[3]).toBe(TODAY_PENDING);
  });

  it("should fill today solid once it is checked off", async () => {
    const { container } = await renderWithProviders(
      <HeatMap habit={habit} completed={{ "2026-07-29": true }} weeks={1} />,
    );

    expect(cellColors(container)[3]).toBe(DONE);
  });

  it("should leave a habit with no history blank up to the day it began", async () => {
    const today = makeHabit({ color: HABIT_COLOR, createdAt: "2026-07-29" });

    const { container } = await renderWithProviders(
      <HeatMap habit={today} completed={undefined} weeks={1} />,
    );

    expect(cellColors(container)).toEqual([
      BLANK,
      BLANK,
      BLANK,
      TODAY_PENDING,
      BLANK,
      BLANK,
      BLANK,
    ]);
  });

  it("should track back to a record older than the habit's own start date", async () => {
    const { container } = await renderWithProviders(
      <HeatMap habit={habit} completed={{ "2026-07-13": true }} weeks={3} />,
    );

    /* The 13th and the 14th are blank in the case above, where the habit
    starts on the 15th and carries no record before it. */
    expect(cellColors(container).slice(0, 4)).toEqual([
      BLANK,
      DONE,
      MISSED,
      MISSED,
    ]);
  });

  it("should render no month labels unless it is asked for them", async () => {
    const { container } = await renderWithProviders(
      <HeatMap habit={habit} completed={undefined} weeks={6} />,
    );

    expect(labelPositions(container)).toEqual([]);
  });

  it("should label the column where a new month starts", async () => {
    const { container } = await renderWithProviders(
      <HeatMap habit={habit} completed={undefined} weeks={6} labels />,
    );

    expect(labelPositions(container)).toEqual([
      { label: "Jun", left: 0 },
      { label: "Jul", left: 28 },
    ]);
  });

  it("should place a label over its own column at any cell size", async () => {
    const { container } = await renderWithProviders(
      <HeatMap
        habit={habit}
        completed={undefined}
        weeks={6}
        cellSize={20}
        gap={4}
        labels
      />,
    );

    expect(labelPositions(container)).toEqual([
      { label: "Jun", left: 0 },
      { label: "Jul", left: 48 },
    ]);
  });

  it("should mark the weekday rows down the side of a scrolling grid", async () => {
    const { getByText } = await renderWithProviders(
      <HeatMap habit={habit} completed={undefined} weeks={6} labels scrollable />,
    );

    expect(getByText("M")).toBeOnTheScreen();
    expect(getByText("W")).toBeOnTheScreen();
    expect(getByText("F")).toBeOnTheScreen();
  });

  it("should name the months and the weekdays in the app's language", async () => {
    /* The runner is pinned to `en_US`, so French labels can only have come
    from the language the app is set to. */
    await i18n.changeLanguage("fr");

    const { container, getByText } = await renderWithProviders(
      <HeatMap habit={habit} completed={undefined} weeks={6} labels scrollable />,
    );

    expect(labelPositions(container)).toEqual([
      { label: "juin", left: 0 },
      { label: "juil.", left: 28 },
    ]);
    expect(getByText("L")).toBeOnTheScreen();
    expect(getByText("M")).toBeOnTheScreen();
    expect(getByText("V")).toBeOnTheScreen();
  });

  it("should leave the weekday rows off a grid that does not scroll", async () => {
    const { queryByText } = await renderWithProviders(
      <HeatMap habit={habit} completed={undefined} weeks={6} labels />,
    );

    expect(queryByText("M")).toBeNull();
  });

  it("should let a year of columns scroll sideways", async () => {
    const { container } = await renderWithProviders(
      <HeatMap habit={habit} completed={undefined} weeks={52} scrollable />,
    );

    expect(container.queryAll((node) => node.props.horizontal === true)).toHaveLength(1);
  });

  it("should keep a short grid in place", async () => {
    const { container } = await renderWithProviders(
      <HeatMap habit={habit} completed={undefined} weeks={6} />,
    );

    expect(container.queryAll((node) => node.props.horizontal === true)).toEqual([]);
  });
});
