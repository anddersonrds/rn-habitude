import { isValidElement, type ReactElement } from "react";
import { TextWidget } from "react-native-android-widget";
import type { HabitudeWidgetProps } from "../../HabitudeWidget";
import { HabitudeAndroidWidget } from "../habitude-widget";

const WIDE_DP = 300;
const COMPACT_DP = 150;

const ACCENT = "#32ADE6";
const HABIT_COLOR = "#34C759";

const DONE_FORTNIGHT = Array.from({ length: 14 }, () => 2);

const SNAPSHOT: HabitudeWidgetProps = {
  rows: [
    {
      name: "Walk outside",
      icon: "figure.walk",
      color: HABIT_COLOR,
      days: DONE_FORTNIGHT,
      streak: 6,
    },
  ],
  totalHabits: 1,
  doneToday: 1,
  dueToday: 1,
  date: "2026-07-29",
};

type Element = ReactElement<{ children?: unknown }>;

/* Nothing renders this tree under the runner: the widget is drawn natively from
the elements, so the elements are what a case can ask about. */
function flatten(node: unknown): Element[] {
  if (Array.isArray(node)) return node.flatMap(flatten);
  if (!isValidElement(node)) return [];
  const element = node as Element;
  return [element, ...flatten(element.props.children)];
}

function draw(
  overrides: { snapshot?: Partial<HabitudeWidgetProps>; widthDp?: number } = {},
): Element[] {
  return flatten(
    HabitudeAndroidWidget({
      snapshot: { ...SNAPSHOT, ...overrides.snapshot },
      appearance: "light",
      widthDp: overrides.widthDp ?? WIDE_DP,
      accent: ACCENT,
    }),
  );
}

/** A cell is the only thing here whose colour carries an alpha channel. */
function cellColors(tree: Element[]): string[] {
  return tree
    .map((element) => {
      const { style } = element.props as { style?: { backgroundColor?: string } };
      return style?.backgroundColor;
    })
    .filter((color): color is string => color?.length === 9);
}

function texts(tree: Element[]): string[] {
  return tree
    .filter((element) => element.type === TextWidget)
    .map((element) => (element.props as { text: string }).text);
}

describe("HabitudeAndroidWidget", () => {
  it("should draw one cell per day the app sends", () => {
    expect(cellColors(draw())).toHaveLength(14);
  });

  it("should name the habit and its streak when there is room", () => {
    expect(texts(draw())).toEqual(
      expect.arrayContaining(["Walk outside", "6", "1/1 today"]),
    );
  });

  it("should drop the name, the streak and half the days when narrow", () => {
    const tree = draw({ widthDp: COMPACT_DP });

    expect(cellColors(tree)).toHaveLength(7);
    expect(texts(tree)).not.toContain("Walk outside");
    expect(texts(tree)).not.toContain("6");
  });

  it("should say nothing is due rather than show a zero", () => {
    const tree = draw({ snapshot: { doneToday: 0, dueToday: 0 } });

    expect(texts(tree)).toContain("Nothing due today");
  });

  it("should draw at most four habits and count the rest", () => {
    const rows = [1, 2, 3, 4, 5, 6].map((n) => ({
      name: `Habit ${n}`,
      icon: "circle",
      color: HABIT_COLOR,
      days: DONE_FORTNIGHT,
      streak: n,
    }));
    const tree = draw({ snapshot: { rows, totalHabits: 6 } });

    expect(texts(tree)).toContain("+2 more");
    expect(texts(tree)).not.toContain("Habit 5");
  });

  it("should invite a first habit when there are none", () => {
    const tree = draw({ snapshot: { rows: [], totalHabits: 0 } });

    expect(texts(tree)).toEqual(["Add your first habit"]);
    expect(cellColors(tree)).toHaveLength(0);
  });

  it("should open the app from anywhere on it", () => {
    const [root] = draw();

    expect((root.props as { clickAction?: string }).clickAction).toBe(
      "OPEN_APP",
    );
  });
});
