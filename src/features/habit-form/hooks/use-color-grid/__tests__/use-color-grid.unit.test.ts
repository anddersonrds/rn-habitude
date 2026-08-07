import { HABIT_COLORS } from "@/constants/habit-options";
import { useColorGrid } from "@/features/habit-form/hooks/use-color-grid";
import { COLOR_CARD_PADDING, COLOR_RING } from "@/features/habit-form/styles";
import { layout } from "@/theme";
import { renderHook } from "@testing-library/react-native";
import { Dimensions } from "react-native";

/* The window is what the grid is derived from, and only its width matters. */
async function onADeviceOf(width: number) {
  jest
    .spyOn(Dimensions, "get")
    .mockReturnValue({ width, height: 844, scale: 3, fontScale: 1 });
  const { result } = await renderHook(() => useColorGrid());
  return result.current;
}

function cardWidth(deviceWidth: number) {
  return deviceWidth - layout.screenPadding * 2 - COLOR_CARD_PADDING * 2;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe("useColorGrid", () => {
  it("should lay every colour of the palette out", async () => {
    const { rows } = await onADeviceOf(390);

    expect(rows.flat()).toEqual([...HABIT_COLORS]);
  });

  it("should keep the palette in its declared order", async () => {
    const { rows } = await onADeviceOf(320);

    expect(rows.flat()).toEqual([...HABIT_COLORS]);
  });

  it("should make a full row span the card exactly", async () => {
    const width = 390;
    const { rows, gap } = await onADeviceOf(width);

    const columns = rows[0].length;
    const spanned = columns * COLOR_RING + (columns - 1) * gap;
    expect(spanned).toBeCloseTo(cardWidth(width));
  });

  it("should fit seven swatches on a 390pt device", async () => {
    const { rows } = await onADeviceOf(390);

    expect(rows.map((row) => row.length)).toEqual([7, 7]);
  });

  it("should fit six on a 375pt device, leaving a partial last row", async () => {
    const { rows } = await onADeviceOf(375);

    expect(rows.map((row) => row.length)).toEqual([6, 6, 2]);
  });

  it("should give the partial row the same gap as a full one", async () => {
    const { rows, gap } = await onADeviceOf(375);

    expect(rows[rows.length - 1]).toHaveLength(2);
    expect(gap).toBeGreaterThan(0);
  });

  it("should keep one swatch per row rather than none on an impossibly narrow window", async () => {
    const { rows } = await onADeviceOf(60);

    expect(rows.map((row) => row.length)).toEqual(
      new Array(HABIT_COLORS.length).fill(1),
    );
  });
});
