import { EmptyState } from "@/components/empty-state";
import { formatCount } from "@/lib/numbers";
import type { Habit } from "@/lib/types";
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
  moveDisabled,
  onTapGesture,
  opacity,
  shapes,
  tag,
} from "@expo/ui/swift-ui/modifiers";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useColorScheme, View } from "react-native";
import { useHabitsModel } from "./hooks/use-habits-model";
import { styles } from "./styles";

const EDIT_ANIMATION = Animation.spring({ duration: 0.35, bounce: 0.06 });
const LIST_CHANGE_ANIMATION = Animation.easeInOut({ duration: 0.22 });

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
  schedule,
  neutral,
  reordering,
  onOpen,
  onEdit,
  onDelete,
}: {
  habit: Habit;
  states: number[];
  streak: number;
  schedule: string;
  neutral: string;
  reordering: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation(["habits", "common"]);

  const content = (
    <HStack
      spacing={12}
      modifiers={[
        // `tag` rides on whichever view is the row's root, so it moves here
        // when the context menu is gone.
        ...(reordering ? [tag(habit.id)] : []),
        contentShape(shapes.rectangle()),
        accessibilityLabel(
          streak > 0
            ? t("rowLabelWithStreak", {
                name: habit.name,
                schedule,
                count: streak,
              })
            : t("rowLabel", { name: habit.name, schedule }),
        ),
        accessibilityHint(t(reordering ? "reorderingHint" : "idleHint")),
        ...(reordering ? [] : [onTapGesture(onOpen)]),
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
        <Text modifiers={[font({ design: "rounded", textStyle: "headline" })]}>
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
            {streak > 0
              ? t("streakAndSchedule", { count: streak, schedule })
              : schedule}
          </Text>
        </HStack>
      </VStack>
      <Spacer />
      <HeatStrip states={states} color={habit.color} neutral={neutral} />
    </HStack>
  );

  // Reordering swaps the whole row, it does not just change a modifier. A
  // `ContextMenu` row is a container with slots and its drops are discarded; the
  // bare content is a leaf, which is what the documented reorderable list uses
  // and the only shape that actually reorders here. Verified on device both
  // ways.
  if (reordering) return content;

  // Outside reorder mode the long press belongs to the context menu, so the row
  // must not be draggable at all. Without this the row still lifts and then
  // always snaps back, which is an affordance promising something it cannot do.
  return (
    <ContextMenu modifiers={[tag(habit.id), moveDisabled()]}>
      <ContextMenu.Items>
        <Button
          label={t("open")}
          systemImage="chart.bar.fill"
          onPress={onOpen}
        />
        <Button
          label={t("common:edit")}
          systemImage="pencil"
          onPress={onEdit}
        />
        <Button
          label={t("common:delete")}
          systemImage="trash"
          role="destructive"
          onPress={onDelete}
        />
      </ContextMenu.Items>
      <ContextMenu.Trigger>{content}</ContextMenu.Trigger>
    </ContextMenu>
  );
}

/**
 * The whole screen is a native SwiftUI `List`. Reordering is `List.ForEach`'s
 * `onMove`, so the lift, the gap, and the drop animation are system behavior
 * rather than a gesture reimplementation.
 *
 * Reordering is confined to its own mode for a structural reason, not a
 * stylistic one: a row wrapped in `ContextMenu` has its drops discarded, and
 * only a leaf row reorders. `HabitRow` therefore returns a different shape in
 * each mode, and outside reorder mode the row is `moveDisabled` so it never
 * offers a drag it cannot finish.
 */
export function HabitsScreen() {
  const { t, i18n } = useTranslation(["habits", "common"]);
  const {
    rows,
    hasHabits,
    canReorder,
    countLabel,
    bestStreak,
    totalCheckIns,
    reordering,
    toggleReordering,
    addHabit,
    openHabit,
    editHabit,
    confirmDelete,
    move,
  } = useHabitsModel();
  const neutral = useColorScheme() === "dark" ? "#FFFFFF" : "#000000";

  if (!hasHabits) {
    return (
      <>
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            icon="plus"
            accessibilityLabel={t("common:addHabit")}
            onPress={addHabit}
          />
        </Stack.Toolbar>
        <View style={styles.empty}>
          <EmptyState
            symbol="square.grid.2x2"
            title={t("common:noHabitsYet")}
            description={t("emptyDescription")}
            actionLabel={t("common:newHabit")}
            onAction={addHabit}
          />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Toolbar placement="right">
        {canReorder && (
          <Stack.Toolbar.Button onPress={toggleReordering}>
            {reordering ? t("reorderDone") : t("reorder")}
          </Stack.Toolbar.Button>
        )}
        <Stack.Toolbar.Button
          icon="plus"
          accessibilityLabel={t("common:addHabit")}
          onPress={addHabit}
        />
      </Stack.Toolbar>

      <Host style={styles.host}>
        <List
          modifiers={[
            listStyle("insetGrouped"),
            // Edit mode shows SwiftUI's grabber handles. The long press is
            // already the context menu's and `ContextMenu` cannot be
            // retriggered, so reordering gets its own mode rather than
            // competing for the same gesture.
            environment("editMode", reordering ? "active" : "inactive"),
            animation(EDIT_ANIMATION, reordering),
            animation(LIST_CHANGE_ANIMATION, rows.length),
          ]}
        >
          <Section
            title={countLabel}
            footer={
              <Text
                modifiers={[
                  font({ design: "rounded", textStyle: "footnote" }),
                  opacity(0.55),
                ]}
              >
                {t(reordering ? "reorderingFooter" : "idleFooter")}
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
                  {formatCount(bestStreak, i18n.language)}
                </Text>
                <Text
                  modifiers={[
                    font({ design: "rounded", textStyle: "footnote" }),
                    opacity(0.55),
                  ]}
                >
                  {t("longestStreak")}
                </Text>
              </VStack>
              <Spacer />
              <VStack alignment="trailing" spacing={1}>
                <Text
                  modifiers={[
                    font({ design: "rounded", textStyle: "headline" }),
                  ]}
                >
                  {formatCount(totalCheckIns, i18n.language)}
                </Text>
                <Text
                  modifiers={[
                    font({ design: "rounded", textStyle: "caption" }),
                    opacity(0.55),
                  ]}
                >
                  {t("checkIns")}
                </Text>
              </VStack>
            </HStack>
          </Section>

          {/* `List.ForEach` sits in its own `Section`, matching the documented
              structure. Necessary but not sufficient: what actually decides
              whether a drop sticks is the row's shape, in `HabitRow`. */}
          <Section>
            <List.ForEach onMove={move}>
              {rows.map(({ habit, states, streak, schedule }) => (
                <HabitRow
                  key={habit.id}
                  habit={habit}
                  states={states}
                  streak={streak}
                  schedule={schedule}
                  neutral={neutral}
                  reordering={reordering}
                  onOpen={() => openHabit(habit)}
                  onEdit={() => editHabit(habit)}
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
