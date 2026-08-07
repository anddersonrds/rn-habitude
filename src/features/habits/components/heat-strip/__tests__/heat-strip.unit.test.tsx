import { HeatStrip } from "@/features/habits/components/heat-strip";
import { modifier, nativeViews } from "@/test-utils/native-views";
import { renderWithProviders } from "@/test-utils/render";
import { Host } from "@expo/ui/swift-ui";
import type { TestInstance } from "test-renderer";

const COLOR = "#FF9500";
const NEUTRAL = "#000000";
const STRIP_WIDTH = 76;

/* A cell is the only rounded rectangle the strip draws. */
function cells(container: TestInstance) {
  return container
    .queryAll((node) => node.props.cornerRadius === 1.5)
    .map((cell) => ({
      color: modifier(cell, "foregroundStyle").color as string,
      opacity: modifier(cell, "opacity").value as number,
    }));
}

/* The strip itself is the stack the width is pinned on. */
function strip(container: TestInstance): TestInstance {
  const found = nativeViews(container).find((node) =>
    ((node.props.modifiers ?? []) as { $type: string }[]).some(
      (entry) => entry.$type === "frame",
    ),
  );
  if (!found) throw new Error("Nothing in the tree is pinned to a width.");
  return found;
}

function renderStrip(states: number[]) {
  return renderWithProviders(
    <Host>
      <HeatStrip states={states} color={COLOR} neutral={NEUTRAL} />
    </Host>,
  );
}

describe("HeatStrip", () => {
  it("should draw one cell per day it is given", async () => {
    const { container } = await renderStrip([0, 1, 2, 3, 0, 1, 2]);

    expect(cells(container)).toHaveLength(7);
  });

  it("should draw a completed day solid in the habit's colour", async () => {
    const { container } = await renderStrip([2]);

    expect(cells(container)).toEqual([{ color: COLOR, opacity: 1 }]);
  });

  it("should draw a day still open as a faded habit colour", async () => {
    const { container } = await renderStrip([3]);

    expect(cells(container)).toEqual([{ color: COLOR, opacity: 0.3 }]);
  });

  it("should draw a missed day in the neutral colour", async () => {
    const { container } = await renderStrip([1]);

    expect(cells(container)).toEqual([{ color: NEUTRAL, opacity: 0.14 }]);
  });

  it("should draw an unscheduled day fainter than a missed one", async () => {
    const { container } = await renderStrip([0]);

    expect(cells(container)).toEqual([{ color: NEUTRAL, opacity: 0.06 }]);
  });

  it("should keep its width whatever it is asked to draw", async () => {
    const short = await renderStrip([2]);
    const long = await renderStrip(new Array(21).fill(2));

    for (const { container } of [short, long]) {
      expect(modifier(strip(container), "frame")).toMatchObject({
        width: STRIP_WIDTH,
      });
    }
  });
});
