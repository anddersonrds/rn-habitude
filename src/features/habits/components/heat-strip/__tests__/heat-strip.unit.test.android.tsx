import { HeatStrip } from "@/features/habits/components/heat-strip";
import { renderWithProviders } from "@/test-utils/render";
import { colors } from "@/theme";
import { StyleSheet, type ViewStyle } from "react-native";
import type { TestInstance } from "test-renderer";

const COLOR = "#FF9500";
const NEUTRAL = "#000000";

/* Written out rather than imported from the styles the strip reads, so a case
still fails when a dimension moves. These are the iOS strip's numbers. */
const STRIP_WIDTH = 76;
const STRIP_GAP = 2;
const CELL_HEIGHT = 16;
const CELL_RADIUS = 1.5;

/* A cell carries no text and no name, so a rounded background is what marks
one. The radius is the strip's, which is what tells a cell from its column. */
function cells(container: TestInstance): ViewStyle[] {
  return container
    .queryAll((node) => flatten(node)?.borderRadius === CELL_RADIUS)
    .map((cell) => flatten(cell) as ViewStyle);
}

function flatten(node: TestInstance): ViewStyle | undefined {
  return StyleSheet.flatten(node.props.style) as ViewStyle | undefined;
}

function appearances(container: TestInstance) {
  return cells(container).map(({ backgroundColor, opacity }) => ({
    color: backgroundColor,
    opacity,
  }));
}

function widths(container: TestInstance) {
  return container
    .queryAll((node) => flatten(node)?.width != null)
    .map((node) => flatten(node)?.width);
}

function renderStrip(states: number[]) {
  return renderWithProviders(
    <HeatStrip states={states} color={COLOR} neutral={NEUTRAL} />,
  );
}

describe("HeatStrip", () => {
  it("should draw one cell per day it is given", async () => {
    const { container } = await renderStrip([0, 1, 2, 3, 0, 1, 2]);

    expect(cells(container)).toHaveLength(7);
  });

  it("should draw a completed day solid in the habit's colour", async () => {
    const { container } = await renderStrip([2]);

    expect(appearances(container)).toEqual([
      { color: COLOR, opacity: undefined },
    ]);
  });

  it("should draw a day still open as a faded habit colour", async () => {
    const { container } = await renderStrip([3]);

    expect(appearances(container)).toEqual([{ color: COLOR, opacity: 0.3 }]);
  });

  it("should draw a missed day in the surface every heat graph gives it", async () => {
    const { container } = await renderStrip([1]);

    expect(appearances(container)).toEqual([
      { color: colors.fill, opacity: undefined },
    ]);
  });

  it("should draw an unscheduled day fainter than a missed one", async () => {
    const { container } = await renderStrip([0]);

    expect(appearances(container)).toEqual([
      { color: colors.subtleFill, opacity: undefined },
    ]);
  });

  it("should keep its width whatever it is asked to draw", async () => {
    const short = await renderStrip([2]);
    const long = await renderStrip(new Array(21).fill(2));

    for (const { container } of [short, long]) {
      expect(widths(container)).toEqual([STRIP_WIDTH]);
    }
  });

  it("should draw its cells at the height and the gap the iOS strip uses", async () => {
    const { container } = await renderStrip([2, 2]);

    expect(cells(container).map((cell) => cell.height)).toEqual([
      CELL_HEIGHT,
      CELL_HEIGHT,
    ]);
    expect(
      container.queryAll((node) => flatten(node)?.gap === STRIP_GAP),
    ).not.toHaveLength(0);
  });
});
