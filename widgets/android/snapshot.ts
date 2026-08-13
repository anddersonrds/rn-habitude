import { getSetting, setSetting } from "../../src/lib/data/db";
import type { HabitudeWidgetProps } from "../HabitudeWidget";

export const WIDGET_SNAPSHOT_SETTING = "widget_snapshot";

export function saveWidgetSnapshot(props: HabitudeWidgetProps): void {
  setSetting(WIDGET_SNAPSHOT_SETTING, JSON.stringify(props));
}

/**
 * The launcher can ask for a redraw with the app closed, and the handler that
 * answers holds no app state, so the last push is what it has to draw from.
 */
export function readWidgetSnapshot(): HabitudeWidgetProps | null {
  const stored = getSetting(WIDGET_SNAPSHOT_SETTING);
  if (stored === null) return null;

  try {
    return JSON.parse(stored) as HabitudeWidgetProps;
  } catch {
    return null;
  }
}
