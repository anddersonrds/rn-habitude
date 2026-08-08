import { HeatGraph } from "@/components/heat-graph";
import type { HeatStatus } from "@/lib/domain/heat";
import { renderWithProviders } from "@/test-utils/render";
import { colors } from "@/theme";
import { StyleSheet, type ViewStyle } from "react-native";
import type { TestInstance } from "test-renderer";

jest.mock("react-native-reanimated", () => {
  const actual = jest.requireActual("react-native-reanimated");
  return { __esModule: true, ...actual, useReducedMotion: jest.fn(() => false) };
});

const { useReducedMotion } = jest.requireMock<{ useReducedMotion: jest.Mock }>(
  "react-native-reanimated",
);

const ACCENT = "#FF9500";
const MISSED = colors.fill;
const UNSCHEDULED = colors.subtleFill;
const BLANK = "transparent";

/* Cells carry no text and no name; a background is what marks one. */
function cells(container: TestInstance): ViewStyle[] {
  return container
    .queryAll((node) => {
      const style = StyleSheet.flatten(node.props.style) as ViewStyle | undefined;
      return style?.backgroundColor != null && style.borderRadius != null;
    })
    .map((cell) => StyleSheet.flatten(cell.props.style) as ViewStyle);
}

function cellColors(container: TestInstance) {
  return cells(container).map((style) => style.backgroundColor);
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

function week(...statuses: HeatStatus[]): HeatStatus[] {
  return statuses;
}

beforeEach(() => {
  useReducedMotion.mockReturnValue(false);
});

describe("the grid", () => {
  it("should draw one cell per day it is given", async () => {
    const { container } = await renderWithProviders(
      <HeatGraph
        columns={[week("done", "missed"), week("empty", "unscheduled")]}
        accent={ACCENT}
        cellSize={11}
        gap={3}
      />,
    );

    expect(cellColors(container)).toHaveLength(4);
  });

  it("should colour every day by what happened on it", async () => {
    const { container } = await renderWithProviders(
      <HeatGraph
        columns={[week("done", "missed", "unscheduled", "empty")]}
        accent={ACCENT}
        cellSize={11}
        gap={3}
      />,
    );

    expect(cellColors(container)).toEqual([
      ACCENT,
      MISSED,
      UNSCHEDULED,
      BLANK,
    ]);
  });

  it("should hint a day that is still open in the habit's own colour", async () => {
    const { container } = await renderWithProviders(
      <HeatGraph
        columns={[week("pending")]}
        accent={ACCENT}
        cellSize={11}
        gap={3}
      />,
    );

    expect(cells(container)[0]).toMatchObject({
      backgroundColor: ACCENT,
      opacity: 0.3,
    });
  });

  it("should draw square cells of the side it is given", async () => {
    const { container } = await renderWithProviders(
      <HeatGraph
        columns={[week("done")]}
        accent={ACCENT}
        cellSize={11}
        gap={3}
      />,
    );

    expect(cells(container)[0]).toMatchObject({ width: 11, height: 11 });
  });

  it("should space the columns and the days inside them by the same gap", async () => {
    const { container } = await renderWithProviders(
      <HeatGraph
        columns={[week("done", "done"), week("done", "done")]}
        accent={ACCENT}
        cellSize={11}
        gap={3}
      />,
    );

    const gaps = container
      .queryAll((node) => StyleSheet.flatten(node.props.style)?.gap != null)
      .map((node) => StyleSheet.flatten(node.props.style).gap);

    expect(gaps).toEqual([3, 3, 3]);
  });

  it("should let the columns share the width when the cells have no side", async () => {
    const { container } = await renderWithProviders(
      <HeatGraph
        columns={[week("done")]}
        accent={ACCENT}
        cellHeight={18}
        gap={5}
        radius={5}
      />,
    );

    expect(cells(container)[0]).toMatchObject({
      width: undefined,
      height: 18,
      borderRadius: 5,
    });
  });
});

describe("the labels", () => {
  const columns = [week("done"), week("done"), week("done")];

  it("should render no month labels unless it is given them", async () => {
    const { container } = await renderWithProviders(
      <HeatGraph columns={columns} accent={ACCENT} cellSize={11} gap={3} />,
    );

    expect(labelPositions(container)).toEqual([]);
  });

  it("should place each month over the column it starts on", async () => {
    const { container } = await renderWithProviders(
      <HeatGraph
        columns={columns}
        accent={ACCENT}
        cellSize={11}
        gap={3}
        monthLabels={[
          { week: 0, label: "Jun" },
          { week: 2, label: "Jul" },
        ]}
      />,
    );

    expect(labelPositions(container)).toEqual([
      { label: "Jun", left: 0 },
      { label: "Jul", left: 28 },
    ]);
  });

  it("should move a label with the column width", async () => {
    const { container } = await renderWithProviders(
      <HeatGraph
        columns={columns}
        accent={ACCENT}
        cellSize={20}
        gap={4}
        monthLabels={[{ week: 2, label: "Jul" }]}
      />,
    );

    expect(labelPositions(container)).toEqual([{ label: "Jul", left: 48 }]);
  });

  it("should mark the weekday rows down the side of a scrolling grid", async () => {
    const { getByText } = await renderWithProviders(
      <HeatGraph
        columns={columns}
        accent={ACCENT}
        cellSize={11}
        gap={3}
        weekdayLabels={["", "M", "", "W", "", "F", ""]}
        scrollable
      />,
    );

    expect(getByText("M")).toBeOnTheScreen();
    expect(getByText("W")).toBeOnTheScreen();
    expect(getByText("F")).toBeOnTheScreen();
  });

  it("should leave the weekday rows off a grid that does not scroll", async () => {
    const { queryByText } = await renderWithProviders(
      <HeatGraph
        columns={columns}
        accent={ACCENT}
        cellSize={11}
        gap={3}
        weekdayLabels={["", "M", "", "W", "", "F", ""]}
      />,
    );

    expect(queryByText("M")).toBeNull();
  });
});

describe("scrolling", () => {
  const columns = new Array(52).fill(week("done"));

  it("should let a long grid scroll sideways", async () => {
    const { container } = await renderWithProviders(
      <HeatGraph
        columns={columns}
        accent={ACCENT}
        cellSize={11}
        gap={3}
        scrollable
      />,
    );

    expect(
      container.queryAll((node) => node.props.horizontal === true),
    ).toHaveLength(1);
  });

  it("should keep a grid that was not asked to scroll in place", async () => {
    const { container } = await renderWithProviders(
      <HeatGraph columns={columns} accent={ACCENT} cellSize={11} gap={3} />,
    );

    expect(container.queryAll((node) => node.props.horizontal === true)).toEqual(
      [],
    );
  });
});

describe("the fade", () => {
  const columns = [week("done", "done"), week("done", "done")];

  /* `delayV` is Reanimated's own field on the builder. */
  function fadeDelays(container: TestInstance): number[] {
    return container
      .queryAll((node) => node.props.entering != null)
      .map((cell) => (cell.props.entering as { delayV?: number }).delayV ?? 0);
  }

  it("should not fade a grid that was not asked to", async () => {
    const { container } = await renderWithProviders(
      <HeatGraph columns={columns} accent={ACCENT} cellSize={11} gap={3} />,
    );

    expect(fadeDelays(container)).toEqual([]);
  });

  it("should stagger the fade by column and then by cell", async () => {
    const { container } = await renderWithProviders(
      <HeatGraph
        columns={columns}
        accent={ACCENT}
        cellSize={11}
        gap={3}
        entering={{ duration: 240, columnDelay: 45, cellDelay: 12 }}
      />,
    );

    expect(fadeDelays(container)).toEqual([0, 12, 45, 57]);
  });

  it("should bypass the fade under Reduce Motion", async () => {
    useReducedMotion.mockReturnValue(true);

    const { container } = await renderWithProviders(
      <HeatGraph
        columns={columns}
        accent={ACCENT}
        cellSize={11}
        gap={3}
        entering={{ duration: 240, columnDelay: 45, cellDelay: 12 }}
      />,
    );

    expect(fadeDelays(container)).toEqual([]);
  });
});
