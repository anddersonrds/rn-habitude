/**
 * Queries for the parts of a tree that carry no text and no accessible name,
 * where the only thing to ask about is the props the native side receives.
 */
import type { TestInstance } from "test-renderer";

/* The host view `expo-symbols` renders. A symbol has no queryable name. */
const SYMBOL_VIEW = "ViewManagerAdapter_SymbolModule";

/** Every SF Symbol in the tree, in render order. */
export function symbolViews(view: TestInstance): TestInstance[] {
  return view.queryAll((node) => node.type === SYMBOL_VIEW);
}

/** The symbol a component draws, failing with whatever it drew instead. */
export function symbolView(view: TestInstance, name: string): TestInstance {
  const symbols = symbolViews(view);
  const match = symbols.find((symbol) => symbol.props.name === name);
  if (!match) {
    const drawn = symbols.map((symbol) => symbol.props.name).join(", ");
    throw new Error(
      `Expected a \`${name}\` symbol, but the tree draws: ${drawn || "none"}.`,
    );
  }
  return match;
}
