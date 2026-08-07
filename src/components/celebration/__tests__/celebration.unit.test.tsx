import { Celebration } from "@/components/celebration";
import i18n from "@/i18n/i18next";
import en from "@/i18n/locales/en";
import { symbolView } from "@/test-utils/native-views";
import { renderWithProviders } from "@/test-utils/render";
import { accent, success } from "@/theme";
import { act } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import type { TestInstance } from "test-renderer";

/*
Both hooks below decide what renders, and neither can be driven from a prop.
Reanimated is spread rather than replaced so the animated components stay real,
and `__esModule` has to be declared or the default export goes missing.
*/
jest.mock("react-native-reanimated", () => {
  const actual = jest.requireActual("react-native-reanimated");
  return {
    __esModule: true,
    ...actual,
    useReducedMotion: jest.fn(() => false),
  };
});

jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  __esModule: true,
  default: jest.fn(() => "light"),
}));

const { useReducedMotion } = jest.requireMock<{ useReducedMotion: jest.Mock }>(
  "react-native-reanimated",
);
const { default: useColorScheme } = jest.requireMock<{ default: jest.Mock }>(
  "react-native/Libraries/Utilities/useColorScheme",
);

const DURATION_MS = 2100;

const today = en.translations.today;

const RED = "#FF3B30";
const GREEN = "#34C759";

/* A spark is a positioned square with a fill; the ring has a border instead. */
function sparkColors(container: TestInstance) {
  return container
    .queryAll((node) => {
      const style = StyleSheet.flatten(node.props.style);
      return (
        style?.position === "absolute" &&
        style.backgroundColor !== undefined &&
        style.width !== undefined
      );
    })
    .map((spark) => StyleSheet.flatten(spark.props.style).backgroundColor);
}

function ringColors(container: TestInstance) {
  return container
    .queryAll(
      (node) => StyleSheet.flatten(node.props.style)?.borderColor !== undefined,
    )
    .map((ring) => StyleSheet.flatten(ring.props.style).borderColor);
}

function scrimColor(container: TestInstance) {
  const [scrim] = container.queryAll((node) => {
    const style = StyleSheet.flatten(node.props.style);
    return (
      style?.position === "absolute" &&
      style.backgroundColor !== undefined &&
      style.width === undefined
    );
  });
  return StyleSheet.flatten(scrim.props.style).backgroundColor;
}

beforeEach(async () => {
  await i18n.changeLanguage("en");
  useReducedMotion.mockReturnValue(false);
  useColorScheme.mockReturnValue("light");
});

afterEach(() => jest.useRealTimers());

describe("Celebration", () => {
  it("should say the day is complete", async () => {
    const { getByText } = await renderWithProviders(
      <Celebration colors={[RED]} onFinished={jest.fn()} />,
    );

    expect(getByText(today.celebrationTitle)).toBeOnTheScreen();
    expect(getByText(today.celebrationBody)).toBeOnTheScreen();
  });

  it("should seal it with the same green the day's progress uses", async () => {
    const { container } = await renderWithProviders(
      <Celebration colors={[RED]} onFinished={jest.fn()} />,
    );

    expect(symbolView(container, "checkmark.seal.fill").props.tintColor).toBe(
      success,
    );
  });

  it("should throw the sparks in the colors of the habits that were completed", async () => {
    const { container } = await renderWithProviders(
      <Celebration colors={[RED, GREEN]} onFinished={jest.fn()} />,
    );

    /* Fourteen sparks over two colors, taken in turn. */
    expect(sparkColors(container)).toEqual([
      RED, GREEN, RED, GREEN, RED, GREEN, RED,
      GREEN, RED, GREEN, RED, GREEN, RED, GREEN,
    ]);
  });

  it("should carry one habit's color through every spark", async () => {
    const { container } = await renderWithProviders(
      <Celebration colors={[RED]} onFinished={jest.fn()} />,
    );

    expect(new Set(sparkColors(container))).toEqual(new Set([RED]));
  });

  it("should pulse the ring in the first habit's color", async () => {
    const { container } = await renderWithProviders(
      <Celebration colors={[RED, GREEN]} onFinished={jest.fn()} />,
    );

    expect(ringColors(container)).toEqual([RED]);
  });

  it("should fall back to the app accent when there are no colors to use", async () => {
    const { container } = await renderWithProviders(
      <Celebration colors={[]} onFinished={jest.fn()} />,
    );

    expect(new Set(sparkColors(container))).toEqual(new Set([accent]));
    expect(ringColors(container)).toEqual([accent]);
  });

  it("should wash the screen white over a light interface", async () => {
    const { container } = await renderWithProviders(
      <Celebration colors={[RED]} onFinished={jest.fn()} />,
    );

    expect(scrimColor(container)).toBe("rgba(255, 255, 255, 0.6)");
  });

  it("should wash the screen black over a dark interface", async () => {
    useColorScheme.mockReturnValue("dark");

    const { container } = await renderWithProviders(
      <Celebration colors={[RED]} onFinished={jest.fn()} />,
    );

    expect(scrimColor(container)).toBe("rgba(0, 0, 0, 0.45)");
  });

  it("should hold the sparks and the ring back when motion is reduced", async () => {
    useReducedMotion.mockReturnValue(true);

    const { container, getByText } = await renderWithProviders(
      <Celebration colors={[RED]} onFinished={jest.fn()} />,
    );

    expect(sparkColors(container)).toEqual([]);
    expect(ringColors(container)).toEqual([]);
    expect(getByText(today.celebrationTitle)).toBeOnTheScreen();
  });

  it("should still seal the day when motion is reduced", async () => {
    useReducedMotion.mockReturnValue(true);

    const { container } = await renderWithProviders(
      <Celebration colors={[RED]} onFinished={jest.fn()} />,
    );

    expect(symbolView(container, "checkmark.seal.fill")).toBeTruthy();
  });

  it("should stay on screen until the moment is over", async () => {
    jest.useFakeTimers();
    const onFinished = jest.fn();
    await renderWithProviders(
      <Celebration colors={[RED]} onFinished={onFinished} />,
    );

    await act(async () => jest.advanceTimersByTime(DURATION_MS - 1));

    expect(onFinished).not.toHaveBeenCalled();
  });

  it("should finish exactly once", async () => {
    jest.useFakeTimers();
    const onFinished = jest.fn();
    await renderWithProviders(
      <Celebration colors={[RED]} onFinished={onFinished} />,
    );

    await act(async () => jest.advanceTimersByTime(DURATION_MS));
    await act(async () => jest.advanceTimersByTime(DURATION_MS * 10));

    expect(onFinished).toHaveBeenCalledTimes(1);
  });

  it("should not finish after it has been taken off the screen", async () => {
    jest.useFakeTimers();
    const onFinished = jest.fn();
    const { unmount } = await renderWithProviders(
      <Celebration colors={[RED]} onFinished={onFinished} />,
    );

    await unmount();
    await act(async () => jest.advanceTimersByTime(DURATION_MS));

    expect(onFinished).not.toHaveBeenCalled();
  });
});
