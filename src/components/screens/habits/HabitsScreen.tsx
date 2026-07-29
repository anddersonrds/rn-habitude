import { EmptyState } from "@/components/EmptyState";
import { WEEKDAY_NAMES } from "@/constants/habit-options";
import { todayKey } from "@/lib/dates";
import { haptic } from "@/lib/haptics";
import { deleteHabit, reorderHabits, useAppState } from "@/lib/store";
import { computeStreaks, trailingDayStates } from "@/lib/streaks";
import { isDaily, type Habit } from "@/lib/types";
import {
  Button,
  ContextMenu,
  Host,
  HStack,
  Image,
  List,
  RoundedRectangle,
  Section,
  Spacer,
  Text,
  VStack,
} from "@expo/ui/swift-ui";
import {
  animation,
  Animation,
  accessibilityHint,
  accessibilityLabel,
  background,
  contentShape,
  environment,
  font,
  foregroundStyle,
  frame,
  listStyle,
  onTapGesture,
  opacity,
  shapes,
  tag,
} from "@expo/ui/swift-ui/modifiers";
import { Color, router, Stack } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, useColorScheme, View } from "react-native";

/** Days of history shown in each row's inline heat strip. */
const STRIP_DAYS = 21;
const EDIT_ANIMATION = Animation.spring({ duration: 0.35, bounce: 0.06 });
const LIST_CHANGE_ANIMATION = Animation.easeInOut({ duration: 0.22 });

export function scheduleLabel(habit: Habit): string {
  if (isDaily(habit)) return "Every day";
  if (habit.weekdays.length === 0) return "No days";
  return habit.weekdays.map((day) => WEEKDAY_NAMES[day].slice(0, 3)).join(", ");
}

/** The habit's recent consistency, drawn natively so the row stays SwiftUI. */
function HeatStrip({
  states,
  color,
  neutral,
}: {
  states: number[];
  color: string;
  neutral: string;
}) {
  return (
    <HStack spacing={2} modifiers={[frame({ width: 76 })]}>
      {states.map((state, index) => (
        <RoundedRectangle
          key={index}
          cornerRadius={1.5}
          modifiers={[
            frame({ height: 16 }),
            foregroundStyle(state === 2 || state === 3 ? color : neutral),
            opacity(state === 2 ? 1 : state === 3 ? 0.3 : state === 1 ? 0.14 : 0.06),
          ]}
        />
      ))}
    </HStack>
  );
}

function HabitRow({
  habit,
  states,
  streak,
  neutral,
  onOpen,
  onEdit,
  onDelete,
}: {
  habit: Habit;
  states: number[];
  streak: number;
  neutral: string;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const schedule = scheduleLabel(habit);

  return (
    <ContextMenu modifiers={[tag(habit.id)]}>
      <ContextMenu.Items>
        <Button label="Open" systemImage="chart.bar.fill" onPress={onOpen} />
        <Button label="Edit" systemImage="pencil" onPress={onEdit} />
        <Button
          label="Delete"
          systemImage="trash"
          role="destructive"
          onPress={onDelete}
        />
      </ContextMenu.Items>
      <ContextMenu.Trigger>
        <HStack
          spacing={12}
          modifiers={[
            contentShape(shapes.rectangle()),
            accessibilityLabel(
              `${habit.name}, ${schedule}${streak > 0 ? `, ${streak}-day streak` : ""}`,
            ),
            accessibilityHint("Opens habit history. Long press for more actions."),
            onTapGesture(onOpen),
          ]}
        >
          <Image
            systemName={habit.icon as never}
            color={habit.color}
            size={19}
            modifiers={[
              frame({ width: 40, height: 40 }),
              background(
                `${habit.color}26`,
                shapes.roundedRectangle({ cornerRadius: 11 }),
              ),
            ]}
          />
          <VStack alignment="leading" spacing={3}>
            <Text
              modifiers={[font({ design: "rounded", textStyle: "headline" })]}
            >
              {habit.name}
            </Text>
            <HStack spacing={5}>
              {streak > 0 && (
                <Image systemName="flame.fill" color={habit.color} size={10} />
              )}
              <Text
                modifiers={[
                  font({ design: "rounded", textStyle: "footnote" }),
                  opacity(0.55),
                ]}
              >
                {streak > 0 ? `${streak} days  ·  ${schedule}` : schedule}
              </Text>
            </HStack>
          </VStack>
          <Spacer />
          <HeatStrip states={states} color={habit.color} neutral={neutral} />
        </HStack>
      </ContextMenu.Trigger>
    </ContextMenu>
  );
}

/**
 * The whole screen is a native SwiftUI `List`, which is what makes rows
 * reorderable by dragging: `List.ForEach`'s `onMove` is SwiftUI's own
 * drag-and-drop, so the lift, the gap, and the drop animation are all system
 * behavior rather than a gesture reimplementation.
 */
export function HabitsScreen() {
  const state = useAppState();
  const [reordering, setReordering] = useState(false);
  const today = todayKey();
  const neutral = useColorScheme() === "dark" ? "#FFFFFF" : "#000000";

  const rows = state.habits.map((habit) => ({
    habit,
    states: trailingDayStates(habit, state.completions[habit.id], STRIP_DAYS, today),
    streak: computeStreaks(habit, state.completions[habit.id], today).current,
  }));

  const bestStreak = rows.reduce((best, row) => Math.max(best, row.streak), 0);
  const totalCheckIns = Object.values(state.completions).reduce(
    (total, days) => total + Object.keys(days).length,
    0,
  );

  const addHabit = () => {
    haptic.tap();
    router.push("/habit-form");
  };

  const confirmDelete = (habit: Habit) => {
    haptic.warning();
    Alert.alert(
      `Delete "${habit.name}"?`,
      "This permanently deletes the habit and its history.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteHabit(habit.id),
        },
      ],
    );
  };

  /**
   * SwiftUI reports `destination` as an index in the pre-removal array, so the
   * moved ids are pulled out first and the target is shifted back by however
   * many of them sat before it.
   */
  const move = (from: number[], to: number) => {
    const ids = state.habits.map((habit) => habit.id);
    const moving = from.map((index) => ids[index]);
    const remaining = ids.filter((_, index) => !from.includes(index));
    const destination = to - from.filter((index) => index < to).length;
    remaining.splice(destination, 0, ...moving);
    reorderHabits(remaining);
    haptic.rigid();
  };

  if (state.habits.length === 0) {
    return (
      <>
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            icon="plus"
            accessibilityLabel="Add habit"
            onPress={addHabit}
          />
        </Stack.Toolbar>
        <View style={styles.empty}>
          <EmptyState
            symbol="square.grid.2x2"
            title="No habits yet"
            description="Habits you create show up here with their streaks and history."
            actionLabel="New habit"
            onAction={addHabit}
          />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Toolbar placement="right">
        {state.habits.length > 1 && (
          <Stack.Toolbar.Button
            onPress={() => {
              haptic.tap();
              setReordering((current) => !current);
            }}
          >
            {reordering ? "Done" : "Reorder"}
          </Stack.Toolbar.Button>
        )}
        <Stack.Toolbar.Button
          icon="plus"
          accessibilityLabel="Add habit"
          onPress={addHabit}
        />
      </Stack.Toolbar>

      <Host style={styles.host}>
        <List
          modifiers={[
            listStyle("insetGrouped"),
            // Edit mode shows SwiftUI's grabber handles. Rows carry a context
            // menu, which claims the long press, so reordering gets its own
            // explicit mode instead of competing for the same gesture.
            environment("editMode", reordering ? "active" : "inactive"),
            animation(EDIT_ANIMATION, reordering),
            animation(LIST_CHANGE_ANIMATION, state.habits.length),
          ]}
        >
          <Section
            title={
              state.habits.length === 1 ? "1 habit" : `${state.habits.length} habits`
            }
            footer={
              <Text
                modifiers={[
                  font({ design: "rounded", textStyle: "footnote" }),
                  opacity(0.55),
                ]}
              >
                {reordering
                  ? "Drag the handles to set the order used across the app."
                  : "Tap Reorder to drag habits into a new order. Long press a habit for more actions."}
              </Text>
            }
          >
            <HStack spacing={16}>
              <VStack alignment="leading" spacing={1}>
                <Text
                  modifiers={[
                    font({
                      design: "rounded",
                      textStyle: "title2",
                      weight: "bold",
                    }),
                  ]}
                >
                  {`${bestStreak}`}
                </Text>
                <Text
                  modifiers={[
                    font({ design: "rounded", textStyle: "footnote" }),
                    opacity(0.55),
                  ]}
                >
                  longest active streak
                </Text>
              </VStack>
              <Spacer />
              <VStack alignment="trailing" spacing={1}>
                <Text
                  modifiers={[
                    font({ design: "rounded", textStyle: "headline" }),
                  ]}
                >
                  {`${totalCheckIns}`}
                </Text>
                <Text
                  modifiers={[
                    font({ design: "rounded", textStyle: "caption" }),
                    opacity(0.55),
                  ]}
                >
                  check-ins
                </Text>
              </VStack>
            </HStack>
          </Section>

          {/* Matches the structure the `@expo/ui` docs use for a reorderable
              list: the `ForEach` inside its own `Section`, `tag` on every row. */}
          <Section>
            <List.ForEach onMove={move}>
              {rows.map(({ habit, states, streak }) => (
                <HabitRow
                  key={habit.id}
                  habit={habit}
                  states={states}
                  streak={streak}
                  neutral={neutral}
                  onOpen={() => router.push(`/habit/${habit.id}`)}
                  onEdit={() => router.push(`/habit-form?id=${habit.id}`)}
                  onDelete={() => confirmDelete(habit)}
                />
              ))}
            </List.ForEach>
          </Section>
        </List>
      </Host>
    </>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
    backgroundColor: Color.ios.systemGroupedBackground,
  },
  empty: {
    flex: 1,
    backgroundColor: Color.ios.systemGroupedBackground,
  },
});
