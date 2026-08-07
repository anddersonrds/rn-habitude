import { HabitRow } from "@/features/habits/components/habit-row";
import i18n from "@/i18n/i18next";
import en from "@/i18n/locales/en";
import { pressButton, tapNative } from "@/test-utils/native-events";
import { modifier, nativeView, nativeViews } from "@/test-utils/native-views";
import { renderWithProviders } from "@/test-utils/render";
import { makeHabit } from "@/test-utils/factories";
import { Host } from "@expo/ui/swift-ui";
import type { TestInstance } from "test-renderer";

const habits = en.translations.habits;
const common = en.translations.common;

const habit = makeHabit({ id: "walk", name: "Walk outside", color: "#FF9500" });
const SCHEDULE = "Every day";

function has(node: TestInstance, type: string): boolean {
  return ((node.props.modifiers ?? []) as { $type: string }[]).some(
    (entry) => entry.$type === type,
  );
}

/* The row is the view that names itself to a screen reader. */
function row(container: TestInstance): TestInstance {
  const found = nativeViews(container).find((node) =>
    has(node, "accessibilityLabel"),
  );
  if (!found) throw new Error("Nothing in the tree names itself.");
  return found;
}

function renderRow({
  streak = 0,
  reordering = false,
  onOpen = jest.fn(),
  onEdit = jest.fn(),
  onDelete = jest.fn(),
} = {}) {
  return renderWithProviders(
    <Host>
      <HabitRow
        habit={habit}
        states={[2, 2, 1]}
        streak={streak}
        schedule={SCHEDULE}
        neutral="#000000"
        reordering={reordering}
        onOpen={onOpen}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </Host>,
  );
}

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

describe("what the row shows", () => {
  it("should draw the habit's name", async () => {
    const { container } = await renderRow();

    const [name] = container.queryAll(
      (node) => typeof node.props.text === "string",
    );
    expect(name.props.text).toBe("Walk outside");
  });

  it("should show the schedule alone when there is no streak", async () => {
    const { container } = await renderRow({ streak: 0 });

    expect(nativeView(container, "text", SCHEDULE)).toBeTruthy();
  });

  it("should light the flame once a streak is running", async () => {
    const withStreak = await renderRow({ streak: 4 });
    const without = await renderRow({ streak: 0 });

    const flames = (container: TestInstance) =>
      container.queryAll((node) => node.props.systemName === "flame.fill");
    expect(flames(withStreak.container)).toHaveLength(1);
    expect(flames(without.container)).toEqual([]);
  });

  it("should name itself with its streak to a screen reader", async () => {
    const { container } = await renderRow({ streak: 4 });

    expect(modifier(row(container), "accessibilityLabel").label).toContain(
      "Walk outside",
    );
  });

  it("should carry its heat strip", async () => {
    const { container } = await renderRow();

    expect(
      container.queryAll((node) => node.props.cornerRadius === 1.5),
    ).toHaveLength(3);
  });
});

describe("the two shapes the row takes", () => {
  it("should hold itself in a context menu while the list is not being reordered", async () => {
    const { container } = await renderRow({ reordering: false });

    expect(nativeView(container, "label", habits.open)).toBeTruthy();
    expect(nativeView(container, "label", common.edit)).toBeTruthy();
    expect(nativeView(container, "label", common.delete)).toBeTruthy();
  });

  it("should refuse the drag while the list is not being reordered", async () => {
    const { container } = await renderRow({ reordering: false });

    expect(nativeViews(container).some((node) => has(node, "moveDisabled"))).toBe(
      true,
    );
  });

  it("should become a bare leaf once the list is being reordered", async () => {
    const { container } = await renderRow({ reordering: true });

    expect(() => nativeView(container, "label", habits.open)).toThrow("none");
    expect(nativeViews(container).some((node) => has(node, "moveDisabled"))).toBe(
      false,
    );
  });

  it("should carry its identity on whichever view is its root", async () => {
    const idle = await renderRow({ reordering: false });
    const dragging = await renderRow({ reordering: true });

    /* Outside reorder mode the tag rides on the menu, not on the row. */
    expect(has(row(idle.container), "tag")).toBe(false);
    expect(modifier(row(dragging.container), "tag")).toMatchObject({
      tag: habit.id,
    });
  });

  it("should say it is dragged rather than tapped while reordering", async () => {
    const { container } = await renderRow({ reordering: true });

    expect(modifier(row(container), "accessibilityHint")).toMatchObject({
      hint: habits.reorderingHint,
    });
  });
});

describe("what the row answers", () => {
  it("should open the habit when it is tapped", async () => {
    const onOpen = jest.fn();
    const { container } = await renderRow({ onOpen });

    await tapNative(row(container));

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("should take no tap while the list is being reordered", async () => {
    const onOpen = jest.fn();
    const { container } = await renderRow({ reordering: true, onOpen });

    expect(has(row(container), "onTapGesture")).toBe(false);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("should edit the habit from its menu", async () => {
    const onEdit = jest.fn();
    const { container } = await renderRow({ onEdit });

    await pressButton(nativeView(container, "label", common.edit));

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("should delete the habit from its menu", async () => {
    const onDelete = jest.fn();
    const { container } = await renderRow({ onDelete });

    await pressButton(nativeView(container, "label", common.delete));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
