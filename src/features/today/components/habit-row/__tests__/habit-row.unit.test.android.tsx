import { HabitRow } from "@/features/today/components/habit-row";
import type { TodayItem } from "@/features/today/hooks/use-today-model/types";
import i18n from "@/i18n/i18next";
import en from "@/i18n/locales/en";
import { makeHabit } from "@/test-utils/factories";
import {
  clickCompose,
  longPressCompose,
  pressComposeButton,
} from "@/test-utils/native-events";
import {
  composeButton,
  nativeView,
  nativeViews,
  viewWithModifier,
} from "@/test-utils/native-views";
import { renderWithProviders } from "@/test-utils/render";
import { Host } from "@expo/ui/jetpack-compose";
import type { TestInstance } from "test-renderer";

const today = en.translations.today;
const common = en.translations.common;

const habit = makeHabit({ id: "walk", name: "Walk outside", color: "#FF9500" });

function item(overrides: Partial<TodayItem> = {}): TodayItem {
  return { habit, done: false, streak: 0, subtitle: null, ...overrides };
}

/** The card, which is what the tap and the long press are attached to. */
function card(container: TestInstance): TestInstance {
  return viewWithModifier(container, "combinedClickable");
}

/** The circle on the trailing edge, which is what says whether the day is done. */
function statusIcon(container: TestInstance): TestInstance {
  const icons = nativeViews(container).filter(
    (node) => node.props.size === 26 && node.props.source !== undefined,
  );
  if (icons.length !== 1) throw new Error("The row draws no single status.");
  return icons[0];
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
    expect(texts).toEqual(["Walk outside"]);
  });

  it("should show an open habit in a muted circle", async () => {
    const { container } = await renderRow({ todayItem: item({ done: false }) });

    expect(statusIcon(container).props.tint).not.toBe(habit.color);
  });

  it("should seal a checked habit in its own colour", async () => {
    const { container } = await renderRow({ todayItem: item({ done: true }) });

    expect(statusIcon(container).props.tint).toBe(habit.color);
  });

  it("should strike the name through once the habit is checked", async () => {
    const done = await renderRow({ todayItem: item({ done: true }) });
    const open = await renderRow({ todayItem: item({ done: false }) });

    expect(nativeView(done.container, "text", "Walk outside").props.textDecoration)
      .toBe("lineThrough");
    expect(nativeView(open.container, "text", "Walk outside").props.textDecoration)
      .toBe("none");
  });
});

describe("the actions a long press reveals", () => {
  it("should keep them out of the row until it is long-pressed", async () => {
    const { container } = await renderRow();

    expect(() => composeButton(container, common.edit)).toThrow();
  });

  it("should offer edit, history and delete once it is", async () => {
    const { container } = await renderRow();

    await longPressCompose(card(container));

    expect(composeButton(container, common.edit)).toBeTruthy();
    expect(composeButton(container, today.history)).toBeTruthy();
    expect(composeButton(container, common.delete)).toBeTruthy();
  });

  it("should put them away on a second long press", async () => {
    const { container } = await renderRow();

    await longPressCompose(card(container));
    await longPressCompose(card(container));

    expect(() => composeButton(container, common.edit)).toThrow();
  });
});

describe("what the row answers", () => {
  it("should toggle the habit when the row is tapped", async () => {
    const onToggle = jest.fn();
    const { container } = await renderRow({ onToggle });

    await clickCompose(card(container));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("should not toggle the habit on a long press", async () => {
    const onToggle = jest.fn();
    const { container } = await renderRow({ onToggle });

    await longPressCompose(card(container));

    expect(onToggle).not.toHaveBeenCalled();
  });

  it("should edit the habit from the revealed action", async () => {
    const onEdit = jest.fn();
    const { container } = await renderRow({ onEdit });

    await longPressCompose(card(container));
    await pressComposeButton(composeButton(container, common.edit));

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("should open the history from the revealed action", async () => {
    const onHistory = jest.fn();
    const { container } = await renderRow({ onHistory });

    await longPressCompose(card(container));
    await pressComposeButton(composeButton(container, today.history));

    expect(onHistory).toHaveBeenCalledTimes(1);
  });

  it("should delete the habit from the revealed action", async () => {
    const onDelete = jest.fn();
    const { container } = await renderRow({ onDelete });

    await longPressCompose(card(container));
    await pressComposeButton(composeButton(container, common.delete));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
