import { HStack, Image, RoundedRectangle, Text, VStack } from "@expo/ui/swift-ui";
import {
  containerBackground,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  opacity,
  padding,
  widgetURL,
} from "@expo/ui/swift-ui/modifiers";
import { createWidget, type WidgetEnvironment } from "expo-widgets";

/**
 * Day cell states, oldest first:
 * 0 = not scheduled / before the habit existed
 * 1 = scheduled but missed
 * 2 = completed
 * 3 = today, still pending
 */
export type WidgetHabitRow = {
  name: string;
  icon: string;
  color: string;
  days: number[];
  streak: number;
};

export type HabitudeWidgetProps = {
  rows: WidgetHabitRow[];
  totalHabits: number;
  /** Habits completed today, over habits scheduled today. */
  doneToday: number;
  dueToday: number;
  date: string;
};

/** How many trailing days the app sends per habit. */
export const WIDGET_DAYS = 14;

const HabitudeWidgetView = (
  props: HabitudeWidgetProps,
  environment: WidgetEnvironment,
) => {
  "widget";
  const isDark = environment.colorScheme === "dark";
  const isSmall = environment.widgetFamily === "systemSmall";
  const background = isDark ? "#1C1C1E" : "#FFFFFF";
  const label = isDark ? "#FFFFFF" : "#000000";
  const neutral = isDark ? "#FFFFFF" : "#000000";

  // NOTE: this function is serialized by the 'widget' directive and runs inside
  // the widget extension. It must not reference module-scope values.
  const rows = (props.rows ?? []).slice(0, 4);
  const cellCount = isSmall ? 7 : 14;
  // Cells have a fixed height but a flexible width: widget widths differ per
  // iPhone, so fixed cell widths either overflow or waste space. SwiftUI splits
  // the leftover row width equally between them.
  const cellHeight = isSmall ? 13 : 12;
  const cellGap = isSmall ? 3 : 2;

  if (rows.length === 0) {
    return (
      <VStack
        spacing={6}
        modifiers={[
          containerBackground(background, "widget"),
          widgetURL("habitude://"),
          frame({ maxWidth: Infinity, maxHeight: Infinity }),
        ]}
      >
        <Image systemName="checklist" size={26} color="#5856D6" />
        <Text
          modifiers={[
            font({ design: "rounded", size: 12, weight: "medium" }),
            foregroundStyle(label),
            opacity(0.55),
          ]}
        >
          Add your first habit
        </Text>
      </VStack>
    );
  }

  return (
    <VStack
      alignment="leading"
      spacing={isSmall ? 4 : 5}
      modifiers={[
        containerBackground(background, "widget"),
        widgetURL("habitude://"),
        padding({ horizontal: isSmall ? 12 : 14, vertical: 10 }),
        frame({ maxWidth: Infinity, maxHeight: Infinity }),
      ]}
    >
      {/* Children must be ONE flat array: the native renderer drops any child
          that is itself an array (there is no React-style flattening in the
          widget runtime), so `{rows.map(...)}{other}` silently drops the rows. */}
      {[
        !isSmall && (
          <HStack key="header" spacing={6}>
            <Text
              modifiers={[
                font({ design: "rounded", size: 11, weight: "semibold" }),
                foregroundStyle(label),
                opacity(0.45),
              ]}
            >
              CONSISTENCY
            </Text>
            <Text
              modifiers={[
                font({ design: "rounded", size: 11, weight: "semibold" }),
                foregroundStyle(label),
                opacity(0.35),
                frame({ maxWidth: Infinity, alignment: "trailing" }),
              ]}
            >
              {props.dueToday === 0
                ? "Nothing due today"
                : `${props.doneToday}/${props.dueToday} today`}
            </Text>
          </HStack>
        ),
        ...rows.map((row, rowIndex) => (
          // Each row expands to an equal share of the leftover height so the
          // grid fills the widget vertically regardless of the row count.
          <HStack
            key={`row-${rowIndex}`}
            spacing={isSmall ? 6 : 7}
            modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity })]}
          >
            <Image
              systemName={row.icon as never}
              size={isSmall ? 13 : 12}
              color={row.color}
              modifiers={[frame({ width: 16 })]}
            />
            {!isSmall && (
              <Text
                modifiers={[
                  font({ design: "rounded", size: 12, weight: "medium" }),
                  foregroundStyle(label),
                  lineLimit(1),
                  frame({ width: 64, alignment: "leading" }),
                ]}
              >
                {row.name}
              </Text>
            )}
            <HStack spacing={cellGap}>
              {row.days.slice(-cellCount).map((day, dayIndex) => (
                <RoundedRectangle
                  key={`day-${dayIndex}`}
                  cornerRadius={3}
                  modifiers={[
                    frame({ height: cellHeight }),
                    foregroundStyle(day === 2 || day === 3 ? row.color : neutral),
                    opacity(day === 2 ? 1 : day === 3 ? 0.3 : day === 1 ? 0.12 : 0.05),
                  ]}
                />
              ))}
            </HStack>
            {!isSmall && (
              <HStack
                spacing={1}
                modifiers={[frame({ width: 30, alignment: "trailing" })]}
              >
                <Image systemName="flame.fill" size={9} color={row.color} />
                <Text
                  modifiers={[
                    font({ design: "rounded", size: 11, weight: "semibold" }),
                    foregroundStyle(label),
                    opacity(0.75),
                  ]}
                >
                  {`${row.streak}`}
                </Text>
              </HStack>
            )}
          </HStack>
        )),
        props.totalHabits > rows.length && (
          <Text
            key="more"
            modifiers={[
              font({ design: "rounded", size: 10, weight: "medium" }),
              foregroundStyle(label),
              opacity(0.4),
            ]}
          >
            {`+${props.totalHabits - rows.length} more`}
          </Text>
        ),
      ]}
    </VStack>
  );
};

export default createWidget<HabitudeWidgetProps>(
  "HabitudeWidget",
  HabitudeWidgetView,
);
