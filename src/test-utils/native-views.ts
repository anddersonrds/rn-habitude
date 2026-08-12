/**
 * Queries for the parts of a tree that carry no text and no accessible name,
 * where the only thing to ask about is the props the native side receives.
 */
import type { TestInstance } from "test-renderer";

/* The host view `expo-symbols` renders. A symbol has no queryable name. */
const SYMBOL_VIEW = "ViewManagerAdapter_SymbolModule";

/* Every `@expo/ui` component reaches the tree as this one host view. */
const NATIVE_VIEW = "ViewManagerAdapter_ExpoUI";

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

/** Every `@expo/ui` view in the tree, in render order. */
export function nativeViews(view: TestInstance): TestInstance[] {
  return view.queryAll((node) => node.type === NATIVE_VIEW);
}

/**
 * The `@expo/ui` view a prop names - `label` for a button or a picker, `text`
 * for a piece of SwiftUI text - failing with whatever the tree named instead.
 */
export function nativeView(
  view: TestInstance,
  prop: string,
  value: unknown,
): TestInstance {
  const views = nativeViews(view);
  const match = views.find((node) => node.props[prop] === value);
  if (!match) {
    const named = views
      .map((node) => node.props[prop])
      .filter((carried) => carried !== undefined)
      .join(", ");
    throw new Error(
      `Expected a view whose \`${prop}\` is "${String(value)}", but the tree carries: ${named || "none"}.`,
    );
  }
  return match;
}

/** How a Compose gesture is reached: a click is a modifier, not a prop. */
export function viewWithModifier(
  view: TestInstance,
  type: string,
): TestInstance {
  const match = nativeViews(view).find((node) =>
    ((node.props.modifiers ?? []) as { $type: string }[]).some(
      (entry) => entry.$type === type,
    ),
  );
  if (!match) throw new Error(`Nothing in the tree carries a \`${type}\`.`);
  return match;
}

/** A Compose button holds its label as a child, so it is found through its subtree. */
export function composeButton(view: TestInstance, label: string): TestInstance {
  const buttons = nativeViews(view).filter(
    (node) => typeof node.props.onButtonPressed === "function",
  );
  const match = buttons.find((button) =>
    button.queryAll((node) => node.props.text === label).length > 0,
  );
  if (!match) {
    const labelled = buttons
      .flatMap((button) =>
        button.queryAll((node) => typeof node.props.text === "string"),
      )
      .map((node) => node.props.text)
      .join(", ");
    throw new Error(
      `Expected a button labelled "${label}", but the tree offers: ${labelled || "none"}.`,
    );
  }
  return match;
}

/**
 * A SwiftUI modifier off a native view, by the `$type` the native side keys on.
 * Modifiers are how a native view says what state it is in, so this is the only
 * way to assert one.
 */
export function modifier(
  target: TestInstance,
  type: string,
): Record<string, unknown> {
  const carried = (target.props.modifiers ?? []) as { $type: string }[];
  const match = carried.find((entry) => entry.$type === type);
  if (!match) {
    const names = carried.map((entry) => entry.$type).join(", ");
    throw new Error(
      `Expected a \`${type}\` modifier, but the view carries: ${names || "none"}.`,
    );
  }
  return match as Record<string, unknown>;
}
