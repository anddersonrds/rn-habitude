import { EmptyState } from "@/components/empty-state";
import { formatCount } from "@/lib/utils/numbers";
import { listChange, tints } from "@/theme";
import {
  Host,
  HStack,
  List,
  Section,
  Spacer,
  Text,
  VStack,
} from "@expo/ui/swift-ui";
import {
  animation,
  Animation,
  environment,
  font,
  listStyle,
  opacity,
} from "@expo/ui/swift-ui/modifiers";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useColorScheme, View } from "react-native";
import { HabitRow } from "./components/habit-row";
import { useHabitsModel } from "./hooks/use-habits-model";
import { styles } from "./styles";

const EDIT_ANIMATION = Animation.spring({ duration: 0.35, bounce: 0.06 });

/**
 * The whole screen is a native SwiftUI `List`. Reordering is `List.ForEach`'s
 * `onMove`, so the lift, the gap, and the drop animation are system behavior
 * rather than a gesture reimplementation.
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
  const neutral = useColorScheme() === "dark" ? tints.white : tints.black;

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
            /* Edit mode shows SwiftUI's grabber handles. The long press is
            already the context menu's and `ContextMenu` cannot be retriggered,
            so reordering gets its own mode rather than competing for it. */
            environment("editMode", reordering ? "active" : "inactive"),
            animation(EDIT_ANIMATION, reordering),
            animation(listChange, rows.length),
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
