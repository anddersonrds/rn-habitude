import { Stat } from "@/components/stat";
import { symbolViews } from "@/test-utils/native-views";
import { renderWithProviders } from "@/test-utils/render";
import { StyleSheet } from "react-native";
import type { TestInstance } from "test-renderer";

const row = { layout: "row", symbol: "trophy.fill", color: "#FFCC00" } as const;

/* Whatever holds the value and the label is what carries the arrangement. */
function arrangement(container: TestInstance) {
  const [held] = container.queryAll(
    (node) => StyleSheet.flatten(node.props.style)?.gap != null,
  );
  return StyleSheet.flatten(held.props.style);
}

describe("a column", () => {
  it("should show the value and what it counts", async () => {
    const { getByText } = await renderWithProviders(
      <Stat value="248" label="Check-ins" />,
    );

    expect(getByText("248")).toBeOnTheScreen();
    expect(getByText("Check-ins")).toBeOnTheScreen();
  });

  it("should draw the value exactly as it is given it", async () => {
    const { getByText } = await renderWithProviders(
      <Stat value="1.248" label="Check-ins" />,
    );

    expect(getByText("1.248")).toBeOnTheScreen();
  });

  it("should stack the value over its label and share the width", async () => {
    const { container } = await renderWithProviders(
      <Stat value="248" label="Check-ins" />,
    );

    expect(arrangement(container)).toMatchObject({
      flex: 1,
      alignItems: "center",
    });
  });

  it("should draw no symbol", async () => {
    const { container } = await renderWithProviders(
      <Stat value="248" label="Check-ins" />,
    );

    expect(symbolViews(container)).toEqual([]);
  });
});

describe("a row", () => {
  it("should show the value and what it counts", async () => {
    const { getByText } = await renderWithProviders(
      <Stat {...row} value="12" label="Best streak" />,
    );

    expect(getByText("12")).toBeOnTheScreen();
    expect(getByText("Best streak")).toBeOnTheScreen();
  });

  it("should draw the value exactly as it is given it", async () => {
    const { getByText } = await renderWithProviders(
      <Stat {...row} value="83%" label="Rate" />,
    );

    expect(getByText("83%")).toBeOnTheScreen();
  });

  it("should draw the symbol in the colour it is given", async () => {
    const { container } = await renderWithProviders(
      <Stat {...row} value="12" label="Best streak" />,
    );

    const [symbol] = symbolViews(container);
    expect(symbol.props.name).toBe("trophy.fill");
    expect(symbol.props.tintColor).toBe("#FFCC00");
  });

  it("should lay the label out between the symbol and the value", async () => {
    const { container } = await renderWithProviders(
      <Stat {...row} value="12" label="Best streak" />,
    );

    expect(arrangement(container)).toMatchObject({
      flexDirection: "row",
      minHeight: 52,
    });
  });
});
