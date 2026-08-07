import { Celebration } from "@/components/celebration";
import { EmptyState } from "@/components/empty-state";
import { accent, success } from "@/theme";
import {
  Host,
  HStack,
  Image,
  List,
  ProgressView,
  Section,
  Spacer,
  Text,
  VStack,
} from "@expo/ui/swift-ui";
import {
  animation,
  Animation,
  accessibilityLabel,
  accessibilityValue,
  contentTransition,
  font,
  listStyle,
  opacity,
  progressViewStyle,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { EaseView } from "react-native-ease";
import { HabitRow } from "./components/habit-row";
import { useTodayModel } from "./hooks/use-today-model";
import { styles } from "./styles";

const LIST_CHANGE_ANIMATION = Animation.easeInOut({ duration: 0.22 });
const PROGRESS_ANIMATION = Animation.spring({ duration: 0.55, bounce: 0.06 });
const CONTENT_ENTER = {
  type: "timing",
  duration: 240,
  easing: "easeOut",
} as const;

/**
 * Today renders its checklist with native SwiftUI through @expo/ui and reuses
 * the React Native empty state shared with the Habits screen.
 */
export function TodayScreen() {
  const { t } = useTranslation(["today", "common"]);
  const model = useTodayModel();

  const progressSummary = model.allDone
    ? t("allDone")
    : t("progress", { done: model.doneCount, count: model.items.length });

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon="plus"
          accessibilityLabel={t("common:addHabit")}
          accessibilityHint={t("addHabitHint")}
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
              title={t("common:noHabitsYet")}
              description={t("emptyDescription")}
              actionLabel={t("common:newHabit")}
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
                        {t("nothingScheduled")}
                      </Text>
                      <Text
                        modifiers={[
                          font({ design: "rounded", textStyle: "footnote" }),
                          opacity(0.55),
                        ]}
                      >
                        {t("restDay")}
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
                          color={success}
                          size={17}
                        />
                      )}
                    </HStack>
                    <ProgressView
                      value={model.progress}
                      modifiers={[
                        progressViewStyle("linear"),
                        tint(model.allDone ? success : accent),
                        animation(PROGRESS_ANIMATION, model.progress),
                        accessibilityLabel(t("progressLabel")),
                        accessibilityValue(
                          t("progressValue", {
                            done: model.doneCount,
                            count: model.items.length,
                          }),
                        ),
                      ]}
                    />
                  </VStack>
                )}
              </Section>

              {model.items.length > 0 && (
                <Section
                  title={t("checkInSection")}
                  footer={
                    <Text
                      modifiers={[
                        font({ design: "rounded", textStyle: "footnote" }),
                        opacity(0.55),
                      ]}
                    >
                      {t("checkInFooter")}
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
