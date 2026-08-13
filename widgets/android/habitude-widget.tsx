/* The renderer walks the element tree reading `__name__` off each type, which a
memoized element hides from it. */
"use no memo";

import { FlexWidget, TextWidget } from "react-native-android-widget";
import type { HabitudeWidgetProps } from "../HabitudeWidget";
import {
  WIDGET_THEMES,
  widgetCellColor,
  type HexColor,
  type WidgetAppearance,
} from "./palette";

/** Narrower than this and the row drops its name, as `systemSmall` does on iOS. */
const COMPACT_WIDTH_DP = 200;

const MAX_ROWS = 4;

export type Props = {
  snapshot: HabitudeWidgetProps;
  appearance: WidgetAppearance;
  widthDp: number;
  accent: HexColor;
};

export function HabitudeAndroidWidget({
  snapshot,
  appearance,
  widthDp,
  accent,
}: Props) {
  const theme = WIDGET_THEMES[appearance];
  const compact = widthDp < COMPACT_WIDTH_DP;
  const rows = (snapshot.rows ?? []).slice(0, MAX_ROWS);
  const cellCount = compact ? 7 : 14;

  if (rows.length === 0) {
    return (
      <FlexWidget
        clickAction="OPEN_APP"
        accessibilityLabel="Habitude"
        style={{
          height: "match_parent",
          width: "match_parent",
          justifyContent: "center",
          alignItems: "center",
          flexGap: 8,
          backgroundColor: theme.background,
          borderRadius: 16,
        }}
      >
        <FlexWidget
          style={{ height: 10, width: 10, borderRadius: 5, backgroundColor: accent }}
        />
        <TextWidget
          text="Add your first habit"
          style={{ fontSize: 12, color: theme.label }}
        />
      </FlexWidget>
    );
  }

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      accessibilityLabel="Habitude"
      style={{
        height: "match_parent",
        width: "match_parent",
        flexDirection: "column",
        flexGap: compact ? 4 : 5,
        padding: 12,
        backgroundColor: theme.background,
        borderRadius: 16,
      }}
    >
      {!compact && (
        <FlexWidget
          style={{
            width: "match_parent",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <TextWidget
            text="CONSISTENCY"
            style={{ fontSize: 11, fontWeight: "600", color: theme.label }}
          />
          <TextWidget
            text={
              snapshot.dueToday === 0
                ? "Nothing due today"
                : `${snapshot.doneToday}/${snapshot.dueToday} today`
            }
            style={{ fontSize: 11, fontWeight: "600", color: accent }}
          />
        </FlexWidget>
      )}
      {rows.map((row, rowIndex) => (
        <FlexWidget
          key={`row-${rowIndex}`}
          style={{
            width: "match_parent",
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            flexGap: compact ? 6 : 7,
          }}
        >
          <FlexWidget
            style={{
              height: 8,
              width: 8,
              borderRadius: 4,
              backgroundColor: row.color as HexColor,
            }}
          />
          {!compact && (
            <TextWidget
              text={row.name}
              maxLines={1}
              truncate="END"
              style={{ width: 64, fontSize: 12, color: theme.label }}
            />
          )}
          <FlexWidget
            style={{ flex: 1, flexDirection: "row", flexGap: compact ? 3 : 2 }}
          >
            {row.days.slice(-cellCount).map((day, dayIndex) => (
              <FlexWidget
                key={`day-${dayIndex}`}
                style={{
                  flex: 1,
                  height: compact ? 13 : 12,
                  borderRadius: 3,
                  backgroundColor: widgetCellColor(day, row.color, theme),
                }}
              />
            ))}
          </FlexWidget>
          {!compact && (
            <TextWidget
              text={`${row.streak}`}
              style={{
                width: 24,
                fontSize: 11,
                fontWeight: "600",
                textAlign: "right",
                color: theme.label,
              }}
            />
          )}
        </FlexWidget>
      ))}
      {snapshot.totalHabits > rows.length && (
        <TextWidget
          text={`+${snapshot.totalHabits - rows.length} more`}
          style={{ fontSize: 10, color: theme.label }}
        />
      )}
    </FlexWidget>
  );
}
