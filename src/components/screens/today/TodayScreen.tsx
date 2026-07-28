import { Celebration } from "@/components/Celebration";
import { EmptyState } from "@/components/EmptyState";
import { accent } from "@/theme/colors";
import {
  Button,
  Host,
  HStack,
  Image,
  List,
  ProgressView,
  Section,
  Spacer,
  SwipeActions,
  Text,
  VStack,
} from "@expo/ui/swift-ui";
import {
  animation,
  Animation,
  accessibilityLabel,
  accessibilityValue,
  background,
  contentShape,
  contentTransition,
  deleteDisabled,
  font,
  frame,
  listStyle,
  onTapGesture,
  opacity,
  progressViewStyle,
  scaleEffect,
  shapes,
  strikethrough,
  tag,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { Color, Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import { EaseView } from "react-native-ease";
import { useTodayModel, type TodayItem } from "./useTodayModel";

const DONE_GREEN = "#34C759";
const STATUS_ANIMATION = Animation.spring({ duration: 0.32, bounce: 0.18 });
const LIST_CHANGE_ANIMATION = Animation.easeInOut({ duration: 0.22 });
const PROGRESS_ANIMATION = Animation.spring({ duration: 0.55, bounce: 0.06 });
const CONTENT_ENTER = {
  type: "timing",
  duration: 240,
  easing: "easeOut",
} as const;

function HabitRow({
  item,
  onToggle,
  onEdit,
  onHistory,
  onDelete,
}: {
  item: TodayItem;
  onToggle: () => void;
  onEdit: () => void;
  onHistory: () => void;
  onDelete: () => void;
}) {
  const { habit, done, subtitle } = item;

  return (
    <SwipeActions modifiers={[tag(habit.id), deleteDisabled()]}>
      <HStack
        spacing={12}
        modifiers={[contentShape(shapes.rectangle()), onTapGesture(onToggle)]}
      >
        <Image
          systemName={habit.icon as never}
          color={habit.color}
          size={18}
          modifiers={[
            frame({ width: 38, height: 38 }),
            background(
              `${habit.color}26`,
              shapes.roundedRectangle({ cornerRadius: 10 }),
            ),
          ]}
        />
        <VStack alignment="leading" spacing={2}>
          <Text
            modifiers={[
              font({ design: "rounded", textStyle: "headline" }),
              strikethrough({ isActive: done, pattern: "solid" }),
              opacity(done ? 0.45 : 1),
            ]}
          >
            {habit.name}
          </Text>
          {subtitle !== null && (
            <Text
              modifiers={[
                font({ design: "rounded", textStyle: "footnote" }),
                opacity(0.55),
              ]}
            >
              {subtitle}
            </Text>
          )}
        </VStack>
        <Spacer />
        <Image
          systemName={done ? "checkmark.circle.fill" : "circle"}
          color={done ? habit.color : "#8E8E93"}
          size={26}
          modifiers={[
            opacity(done ? 1 : 0.5),
            scaleEffect(done ? 1 : 0.94),
            contentTransition("opacity"),
            animation(STATUS_ANIMATION, done),
          ]}
        />
      </HStack>

      {/* Full swipe from the leading edge checks in, like Mail's mark-as-read. */}
      <SwipeActions.Actions edge="leading">
        <Button
          label={done ? "Undo" : "Check in"}
          systemImage={done ? "arrow.uturn.backward" : "checkmark"}
          onPress={onToggle}
          modifiers={[tint(done ? accent : DONE_GREEN)]}
        />
      </SwipeActions.Actions>

      <SwipeActions.Actions edge="trailing" allowsFullSwipe={false}>
        <Button
          role="destructive"
          label="Delete"
          systemImage="trash.fill"
          onPress={onDelete}
        />
        <Button
          label="Edit"
          systemImage="pencil"
          onPress={onEdit}
          modifiers={[tint("#8E8E93")]}
        />
        <Button
          label="History"
          systemImage="chart.bar.fill"
          onPress={onHistory}
          modifiers={[tint("#007AFF")]}
        />
      </SwipeActions.Actions>
    </SwipeActions>
  );
}

/**
 * Today renders its checklist with native SwiftUI through @expo/ui and reuses
 * the React Native empty state shared with the Habits screen.
 */
export function TodayScreen() {
  const model = useTodayModel();

  const progressSummary = model.allDone
    ? "All done"
    : `${model.doneCount} of ${model.items.length} complete`;

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon="plus"
          accessibilityLabel="Add habit"
          accessibilityHint="Opens the new habit screen"
          onPress={model.addHabit}
        />
      </Stack.Toolbar>

      <EaseView
        style={styles.content}
        initialAnimate={{ opacity: 0, translateY: 6 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={CONTENT_ENTER}
      >
        {!model.hasHabits ? (
          <View style={styles.empty}>
            <EmptyState
              symbol="checklist"
              title="No habits yet"
              description="Add the first small thing you want to do consistently."
              actionLabel="New habit"
              onAction={model.addHabit}
            />
          </View>
        ) : (
          <Host style={styles.host}>
            <List
              modifiers={[
                listStyle("insetGrouped"),
                animation(LIST_CHANGE_ANIMATION, model.items.length),
              ]}
            >
              <Section title={model.dateLabel}>
                {model.items.length === 0 ? (
                  <HStack spacing={12}>
                    <Image systemName="moon.zzz.fill" color="#8E8E93" size={25} />
                    <VStack alignment="leading" spacing={2}>
                      <Text
                        modifiers={[
                          font({ design: "rounded", textStyle: "headline" }),
                        ]}
                      >
                        Nothing scheduled today
                      </Text>
                      <Text
                        modifiers={[
                          font({ design: "rounded", textStyle: "footnote" }),
                          opacity(0.55),
                        ]}
                      >
                        Enjoy the rest day. Your streaks are safe.
                      </Text>
                    </VStack>
                  </HStack>
                ) : (
                  <VStack alignment="leading" spacing={10}>
                    <HStack>
                      <Text
                        modifiers={[
                          font({ design: "rounded", textStyle: "headline" }),
                          contentTransition("numericText"),
                          animation(PROGRESS_ANIMATION, model.doneCount),
                        ]}
                      >
                        {progressSummary}
                      </Text>
                      <Spacer />
                      {model.allDone && (
                        <Image
                          systemName="checkmark.seal.fill"
                          color={DONE_GREEN}
                          size={17}
                        />
                      )}
                    </HStack>
                    <ProgressView
                      value={model.progress}
                      modifiers={[
                        progressViewStyle("linear"),
                        tint(model.allDone ? DONE_GREEN : accent),
                        animation(PROGRESS_ANIMATION, model.progress),
                        accessibilityLabel("Today's progress"),
                        accessibilityValue(
                          `${model.doneCount} of ${model.items.length} habits complete`,
                        ),
                      ]}
                    />
                  </VStack>
                )}
              </Section>

              {model.items.length > 0 && (
                <Section
                  title="Check in"
                  footer={
                    <Text
                      modifiers={[
                        font({ design: "rounded", textStyle: "footnote" }),
                        opacity(0.55),
                      ]}
                    >
                      Tap a habit to check it in. Swipe for more actions.
                    </Text>
                  }
                >
                  {model.items.map((item) => (
                    <HabitRow
                      key={item.habit.id}
                      item={item}
                      onToggle={() => model.toggle(item.habit)}
                      onEdit={() => model.editHabit(item.habit)}
                      onHistory={() => model.showHistory(item.habit)}
                      onDelete={() => model.confirmDelete(item.habit)}
                    />
                  ))}
                </Section>
              )}
            </List>
          </Host>
        )}
      </EaseView>

      {model.celebrating && (
        <Celebration
          colors={model.celebrationColors}
          onFinished={model.endCelebration}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: Color.ios.systemGroupedBackground,
  },
  empty: {
    flex: 1,
    backgroundColor: Color.ios.systemGroupedBackground,
  },
  host: {
    flex: 1,
    backgroundColor: Color.ios.systemGroupedBackground,
  },
});
