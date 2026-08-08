import { Text } from "@/components/ui/text";
import { heatAppearance, type HeatPalette } from "@/lib/heat";
import { colors } from "@/theme";
import { useRef } from "react";
import { ScrollView, View } from "react-native";
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated";
import { styles } from "./styles";
import type { Props } from "./types";

/* The two system fills a grid drawn in React Native tints its days with. */
const SURFACE = {
  missed: { color: colors.fill as string, opacity: 1 },
  unscheduled: { color: colors.subtleFill as string, opacity: 1 },
};

/**
 * The app's heat grid: the habit's history, the onboarding artwork, and
 * whatever else draws days as a matrix of rounded cells. Geometry, labels and
 * the fade are props, so one renderer serves grids that look nothing alike.
 */
export function HeatGraph({
  columns,
  accent,
  cellSize,
  cellHeight,
  gap,
  radius,
  entering,
  monthLabels,
  weekdayLabels,
  scrollable = false,
}: Props) {
  const reduceMotion = useReducedMotion();
  const scrollRef = useRef<ScrollView>(null);

  const palette: HeatPalette = { accent, ...SURFACE };
  const fades = entering != null && !reduceMotion;
  const sized = cellSize != null;
  const rowHeight = cellSize ?? cellHeight;
  const columnWidth = (cellSize ?? 0) + gap;

  const grid = (
    <View>
      {monthLabels && (
        <View style={styles.monthRow}>
          {monthLabels.map((month) => (
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
      <View style={[styles.grid, !sized && styles.sharedGrid, { gap }]}>
        {columns.map((column, week) => (
          <View key={week} style={[!sized && styles.sharedColumn, { gap }]}>
            {column.map((status, weekday) => {
              const { color, opacity } = heatAppearance(status, palette);
              return (
                /* Animated whether or not it animates: the alternative is a
                second element type in a file that may declare one component. */
                <Animated.View
                  key={weekday}
                  entering={
                    fades
                      ? FadeIn.duration(entering.duration).delay(
                          week * entering.columnDelay +
                            weekday * entering.cellDelay,
                        )
                      : undefined
                  }
                  style={[
                    styles.cell,
                    {
                      width: cellSize,
                      height: rowHeight,
                      borderRadius: radius ?? (cellSize ?? 0) * 0.28,
                      backgroundColor: color,
                    },
                    /* A full opacity is the absence of one. Carrying the key at
                    all is what a fade, which animates opacity, would fight. */
                    opacity < 1 && { opacity },
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );

  if (!scrollable) return grid;

  return (
    <View style={{ flexDirection: "row" }}>
      {weekdayLabels && (
        <View style={[styles.weekdayColumn, { paddingTop: 16, gap }]}>
          {weekdayLabels.map((label, index) => (
            <View
              key={index}
              style={{ height: rowHeight, justifyContent: "center" }}
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
