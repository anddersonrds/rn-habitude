import { HabitRow } from "@/features/today/components/habit-row";
import type { TodayItem } from "@/features/today/hooks/use-today-model/types";
import i18n from "@/i18n/i18next";
import en from "@/i18n/locales/en";
import { makeHabit } from "@/test-utils/factories";
import { pressButton, tapNative } from "@/test-utils/native-events";
import { modifier, nativeView, nativeViews } from "@/test-utils/native-views";
import { renderWithProviders } from "@/test-utils/render";
import { accent, success } from "@/theme";
import { Host } from "@expo/ui/swift-ui";
import type { TestInstance } from "test-renderer";

const today = en.translations.today;
const common = en.translations.common;

const habit = makeHabit({ id: "walk", name: "Walk outside", color: "#FF9500" });

function item(overrides: Partial<TodayItem> = {}): TodayItem {
  return { habit, done: false, streak: 0, subtitle: null, ...overrides };
}

/* The row's own content is the stack the tap is attached to. */
function content(container: TestInstance): TestInstance {
  const found = nativeViews(container).find((node) =>
    ((node.props.modifiers ?? []) as { $type: string }[]).some(
      (entry) => entry.$type === "onTapGesture",
    ),
  );
  if (!found) throw new Error("Nothing in the row answers a tap.");
  return found;
}

/** The circle on the trailing edge, which is what says whether the day is done. */
function statusIcon(container: TestInstance): TestInstance {
  const icons = container.queryAll(
    (node) => typeof node.props.systemName === "string",
  );
  const found = icons.find((icon) =>
    ["circle", "checkmark.circle.fill"].includes(icon.props.systemName as string),
  );
  if (!found) throw new Error("The row draws no status.");
  return found;
}

function renderRow({
  todayItem = item(),
  onToggle = jest.fn(),
  onEdit = jest.fn(),
  onHistory = jest.fn(),
  onDelete = jest.fn(),
} = {}) {
  return renderWithProviders(
    <Host>
      <HabitRow
        item={todayItem}
        onToggle={onToggle}
        onEdit={onEdit}
        onHistory={onHistory}
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

    expect(nativeView(container, "text", "Walk outside")).toBeTruthy();
  });

  it("should carry the subtitle when the model gives it one", async () => {
    const { container } = await renderRow({
      todayItem: item({ subtitle: "3-day streak" }),
    });

    expect(nativeView(container, "text", "3-day streak")).toBeTruthy();
  });

  it("should draw nothing under the name when there is no subtitle", async () => {
    const { container } = await renderRow({ todayItem: item({ subtitle: null }) });

    const texts = container
      .queryAll((node) => typeof node.props.text === "string")
      .map((node) => node.props.text);
    expect(texts).toContain("Walk outside");
    expect(texts).toHaveLength(1);
  });

  it("should show an open habit as an empty circle", async () => {
    const { container } = await renderRow({ todayItem: item({ done: false }) });

    expect(statusIcon(container).props.systemName).toBe("circle");
  });

  it("should seal a checked habit with a filled circle in its own colour", async () => {
    const { container } = await renderRow({ todayItem: item({ done: true }) });

    const icon = statusIcon(container);
    expect(icon.props.systemName).toBe("checkmark.circle.fill");
    expect(modifier(icon, "foregroundStyle").color).toBe(habit.color);
  });

  it("should strike the name through once the habit is checked", async () => {
    const done = await renderRow({ todayItem: item({ done: true }) });
    const open = await renderRow({ todayItem: item({ done: false }) });

    const striking = (container: TestInstance) =>
      modifier(nativeView(container, "text", "Walk outside"), "strikethrough")
        .isActive;
    expect(striking(done.container)).toBe(true);
    expect(striking(open.container)).toBe(false);
  });
});

describe("the swipe actions", () => {
  it("should offer to check in from the leading edge", async () => {
    const { container } = await renderRow({ todayItem: item({ done: false }) });

    const button = nativeView(container, "label", today.checkIn);
    expect(modifier(button, "tint").color).toBe(success);
  });

  it("should offer to undo once the habit is checked", async () => {
    const { container } = await renderRow({ todayItem: item({ done: true }) });

    const button = nativeView(container, "label", today.undo);
    expect(modifier(button, "tint").color).toBe(accent);
  });

  it("should offer delete, edit and history from the trailing edge", async () => {
    const { container } = await renderRow();

    expect(nativeView(container, "label", common.delete)).toBeTruthy();
    expect(nativeView(container, "label", common.edit)).toBeTruthy();
    expect(nativeView(container, "label", today.history)).toBeTruthy();
  });

  it("should refuse the system's own delete, so the swipe stays the app's", async () => {
    const { container } = await renderRow();

    const row = nativeViews(container).find((node) =>
      ((node.props.modifiers ?? []) as { $type: string }[]).some(
        (entry) => entry.$type === "deleteDisabled",
      ),
    );
    expect(row).toBeTruthy();
  });
});

describe("what the row answers", () => {
  it("should toggle the habit when the row is tapped", async () => {
    const onToggle = jest.fn();
    const { container } = await renderRow({ onToggle });

    await tapNative(content(container));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("should toggle the habit from the check-in action too", async () => {
    const onToggle = jest.fn();
    const { container } = await renderRow({ onToggle });

    await pressButton(nativeView(container, "label", today.checkIn));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("should edit the habit from the swipe", async () => {
    const onEdit = jest.fn();
    const { container } = await renderRow({ onEdit });

    await pressButton(nativeView(container, "label", common.edit));

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("should open the history from the swipe", async () => {
    const onHistory = jest.fn();
    const { container } = await renderRow({ onHistory });

    await pressButton(nativeView(container, "label", today.history));

    expect(onHistory).toHaveBeenCalledTimes(1);
  });

  it("should delete the habit from the swipe", async () => {
    const onDelete = jest.fn();
    const { container } = await renderRow({ onDelete });

    await pressButton(nativeView(container, "label", common.delete));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
