import { EmptyState } from "@/components/empty-state";
import { haptic } from "@/lib/haptics";
import { symbolView, symbolViews } from "@/test-utils/native-views";
import { renderWithProviders } from "@/test-utils/render";
import { accent } from "@/theme";
import { fireEvent } from "@testing-library/react-native";

/*
The provider fires a selection haptic on every press. Mocking the module is
what makes the difference between that one and a component's own visible.
*/
jest.mock("@/lib/haptics", () => ({
  haptic: {
    selection: jest.fn(),
    tap: jest.fn(),
    impact: jest.fn(),
    rigid: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
    checkIn: jest.fn(),
    celebrate: jest.fn(),
  },
}));

const HABIT_TINT = "#FF3B30";

function renderEmptyState(props: Partial<Parameters<typeof EmptyState>[0]> = {}) {
  return renderWithProviders(
    <EmptyState
      symbol="sparkles"
      title="No habits yet"
      description="Add your first habit to begin."
      {...props}
    />,
  );
}

afterEach(() => jest.clearAllMocks());

describe("EmptyState", () => {
  it("should render the title and the description", async () => {
    const { getByText } = await renderEmptyState();

    expect(getByText("No habits yet")).toBeOnTheScreen();
    expect(getByText("Add your first habit to begin.")).toBeOnTheScreen();
  });

  it("should show the symbol it was given", async () => {
    const { container } = await renderEmptyState({ symbol: "flame.fill" });

    expect(symbolView(container, "flame.fill")).toBeTruthy();
  });

  it("should draw one symbol and no more", async () => {
    const { container } = await renderEmptyState();

    expect(symbolViews(container)).toHaveLength(1);
  });

  it("should tint the symbol with the app accent by default", async () => {
    const { container } = await renderEmptyState();

    expect(symbolView(container, "sparkles").props.tintColor).toBe(accent);
  });

  it("should follow a habit's own color when one is given", async () => {
    const { container } = await renderEmptyState({ tint: HABIT_TINT });

    expect(symbolView(container, "sparkles").props.tintColor).toBe(HABIT_TINT);
  });

  it("should wash the surface behind the symbol in the same tint", async () => {
    const { container } = await renderEmptyState({ tint: HABIT_TINT });

    expect(symbolView(container, "sparkles").parent).toHaveStyle({
      backgroundColor: `${HABIT_TINT}1F`,
    });
  });

  it("should render no action when there is nothing to do", async () => {
    const { queryByRole } = await renderEmptyState();

    expect(queryByRole("button")).toBeNull();
  });

  it("should render no action when a label has no handler behind it", async () => {
    const { queryByRole } = await renderEmptyState({ actionLabel: "Add habit" });

    expect(queryByRole("button")).toBeNull();
  });

  it("should render no action when a handler has no label in front of it", async () => {
    const { queryByRole } = await renderEmptyState({ onAction: jest.fn() });

    expect(queryByRole("button")).toBeNull();
  });

  it("should name the action for a screen reader", async () => {
    const { getByRole } = await renderEmptyState({
      actionLabel: "Add habit",
      onAction: jest.fn(),
    });

    expect(getByRole("button", { name: "Add habit" })).toBeOnTheScreen();
  });

  it("should run the action once when it is pressed", async () => {
    const onAction = jest.fn();
    const { getByRole } = await renderEmptyState({
      actionLabel: "Add habit",
      onAction,
    });

    await fireEvent.press(getByRole("button", { name: "Add habit" }));

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("should leave the press haptic to the provider", async () => {
    const { getByRole } = await renderEmptyState({
      actionLabel: "Add habit",
      onAction: jest.fn(),
    });

    await fireEvent.press(getByRole("button", { name: "Add habit" }));

    expect(haptic.selection).toHaveBeenCalledTimes(1);
    expect(haptic.tap).not.toHaveBeenCalled();
    expect(haptic.impact).not.toHaveBeenCalled();
  });

  /*
  The button's own surface is not assertable: the gesture handler mock swaps
  the pressable for a `TouchableNativeFeedback`, which drops `style`. The label
  colour below is derived from that same tint, so the decision is still covered.
  */
  it("should keep the action label readable on a dark tint", async () => {
    const { getByText } = await renderEmptyState({
      actionLabel: "Add habit",
      onAction: jest.fn(),
      tint: "#000000",
    });

    expect(getByText("Add habit")).toHaveStyle({ color: "#FFFFFF" });
  });

  it("should keep the action label readable on a light tint", async () => {
    const { getByText } = await renderEmptyState({
      actionLabel: "Add habit",
      onAction: jest.fn(),
      tint: "#FFCC00",
    });

    expect(getByText("Add habit")).toHaveStyle({ color: "#000000" });
  });
});
