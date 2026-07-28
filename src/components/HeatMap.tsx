import { Text } from "@/components/ui/Text";
import { todayKey } from "@/lib/dates";
import { heatCells, heatMonthLabels, type HeatCell } from "@/lib/streaks";
import type { Habit } from "@/lib/types";
import { Color } from "expo-router";
import { useMemo, useRef } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

type Props = {
  habit: Habit;
  completed: Record<string, true> | undefined;
  weeks?: number;
  cellSize?: number;
  gap?: number;
  /** Show month labels above and weekday labels on the left. */
  labels?: boolean;
  scrollable?: boolean;
};

const WEEKDAY_ROWS = ["", "M", "", "W", "", "F", ""];

function cellColor(cell: HeatCell, habit: Habit, today: string) {
  switch (cell.status) {
    case "done":
      return habit.color;
    case "missed":
      // Today isn't missed yet, so show a hint of the habit color instead.
      return cell.date === today
        ? `${habit.color}55`
        : Color.ios.tertiarySystemFill;
    case "unscheduled":
      return Color.ios.quaternarySystemFill;
    case "empty":
      return "transparent";
  }
}

/** GitHub-style consistency grid, colored with the habit's own accent. */
export function HeatMap({
  habit,
  completed,
  weeks = 18,
  cellSize = 11,
  gap = 3,
  labels = false,
  scrollable = false,
}: Props) {
  const today = todayKey();
  const scrollRef = useRef<ScrollView>(null);

  const cells = useMemo(
    () => heatCells(habit, completed, weeks, today),
    [habit, completed, weeks, today],
  );

  const columns = useMemo(() => {
    const byWeek: HeatCell[][] = [];
    for (const cell of cells) {
      (byWeek[cell.week] ??= []).push(cell);
    }
    return byWeek;
  }, [cells]);

  const months = useMemo(
    () => (labels ? heatMonthLabels(cells) : []),
    [cells, labels],
  );
  const columnWidth = cellSize + gap;

  const grid = (
    <View>
      {labels && (
        <View style={styles.monthRow}>
          {months.map((month) => (
            <Text
              key={`${month.label}-${month.week}`}
              variant="caption"
              secondary
              style={{ position: "absolute", left: month.week * columnWidth }}
            >
              {month.label}
            </Text>
          ))}
        </View>
      )}
      <View style={{ flexDirection: "row", gap }}>
        {columns.map((column, weekIndex) => (
          <View key={weekIndex} style={{ gap }}>
            {column.map((cell) => (
              <View
                key={cell.date}
                style={{
                  width: cellSize,
                  height: cellSize,
                  borderRadius: cellSize * 0.28,
                  backgroundColor: cellColor(cell, habit, today),
                }}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );

  if (!scrollable) return grid;

  return (
    <View style={{ flexDirection: "row" }}>
      {labels && (
        <View style={[styles.weekdayColumn, { paddingTop: 16, gap }]}>
          {WEEKDAY_ROWS.map((label, index) => (
            <View
              key={index}
              style={{ height: cellSize, justifyContent: "center" }}
            >
              <Text variant="caption" tertiary>
                {label}
              </Text>
            </View>
          ))}
        </View>
      )}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: false })
        }
      >
        {grid}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  monthRow: {
    position: "relative",
    height: 16,
  },
  weekdayColumn: {
    marginRight: 6,
  },
});
