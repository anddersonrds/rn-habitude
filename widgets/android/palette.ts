import {
  heatAppearance,
  heatStatusOfDayState,
  type HeatPalette,
} from "../../src/lib/domain/heat";

/** What the renderer takes: it reorders the channels for Android itself. */
export type HexColor = `#${string}`;

export type WidgetAppearance = "light" | "dark";

export type WidgetTheme = {
  background: HexColor;
  label: HexColor;
  neutral: HexColor;
};

export const WIDGET_THEMES: Record<WidgetAppearance, WidgetTheme> = {
  light: { background: "#FFFFFF", label: "#000000", neutral: "#000000" },
  dark: { background: "#1C1C1E", label: "#FFFFFF", neutral: "#FFFFFF" },
};

const MISSED_OPACITY = 0.12;
const UNSCHEDULED_OPACITY = 0.05;

/**
 * The cell rule is `lib/domain/heat.ts`'s, read rather than restated: this
 * widget draws the same statuses the app draws, at the two surface opacities
 * the iOS widget uses.
 */
export function widgetCellColor(
  dayState: number,
  habitColor: string,
  theme: WidgetTheme,
): HexColor {
  const palette: HeatPalette = {
    accent: habitColor,
    missed: { color: theme.neutral, opacity: MISSED_OPACITY },
    unscheduled: { color: theme.neutral, opacity: UNSCHEDULED_OPACITY },
  };
  const { color, opacity } = heatAppearance(
    heatStatusOfDayState(dayState),
    palette,
  );
  return withOpacity(color, opacity);
}

/* The renderer takes no opacity, so it is folded into the colour. */
function withOpacity(color: string, opacity: number): HexColor {
  const alpha = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();
  return `${color as HexColor}${alpha}`;
}
