import { Celebration } from "@/components/celebration";
import { EmptyState } from "@/components/empty-state";
import { AppSymbol } from "@/components/ui/app-symbol";
import { ComposeSymbol } from "@/components/ui/compose-symbol";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { accent, success } from "@/theme";
import {
  Card,
  Column,
  Host,
  LazyColumn,
  LinearProgressIndicator,
  Row,
  Text,
  useMaterialColors,
} from "@expo/ui/jetpack-compose";
import {
  clip,
  fillMaxWidth,
  padding,
  Shapes,
  weight,
} from "@expo/ui/jetpack-compose/modifiers";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import { EaseView } from "react-native-ease";
import { HabitRow } from "./components/habit-row";
import { useTodayModel } from "./hooks/use-today-model";
import { styles } from "./styles";

const CONTENT_ENTER = {
  type: "timing",
  duration: 240,
  easing: "easeOut",
} as const;

/** The add button stays React Native, because no Compose tree reaches the bar. */
export function TodayScreen() {
  const { t } = useTranslation(["today", "common"]);
  const { confirm, dialog } = useConfirm();
  const model = useTodayModel(confirm);
  const material = useMaterialColors();

  const progressSummary = model.allDone
    ? t("allDone")
    : t("progress", { done: model.doneCount, count: model.items.length });

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("common:addHabit")}
              accessibilityHint={t("addHabitHint")}
              onPress={model.addHabit}
            >
              <AppSymbol name="plus" size={22} tintColor={accent} />
            </Pressable>
          ),
        }}
      />

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
          <Host style={styles.host} useViewportSizeMeasurement>
            <LazyColumn
              contentPadding={{ start: 16, top: 12, end: 16, bottom: 24 }}
              verticalArrangement={{ spacedBy: 8 }}
            >
              <Text
                style={{ typography: "labelLarge" }}
                color={material.onSurfaceVariant}
              >
                {model.dateLabel}
              </Text>

              {model.items.length === 0 ? (
                <Card modifiers={[fillMaxWidth(), clip(Shapes.RoundedCorner(20))]}>
                  <Row
                    modifiers={[padding(14, 12, 14, 12)]}
                    verticalAlignment="center"
                    horizontalArrangement={{ spacedBy: 12 }}
                  >
                    <ComposeSymbol
                      name="moon.zzz.fill"
                      size={25}
                      color={material.outline}
                    />
                    <Column verticalArrangement={{ spacedBy: 2 }}>
                      <Text style={{ typography: "titleMedium" }}>
                        {t("nothingScheduled")}
                      </Text>
                      <Text
                        style={{ typography: "bodySmall" }}
                        color={material.onSurfaceVariant}
                      >
                        {t("restDay")}
                      </Text>
                    </Column>
                  </Row>
                </Card>
              ) : (
                <Card modifiers={[fillMaxWidth(), clip(Shapes.RoundedCorner(20))]}>
                  <Column
                    modifiers={[padding(14, 12, 14, 12)]}
                    verticalArrangement={{ spacedBy: 10 }}
                  >
                    <Row
                      verticalAlignment="center"
                      horizontalArrangement={{ spacedBy: 8 }}
                    >
                      <Text
                        style={{ typography: "titleMedium" }}
                        modifiers={[weight(1)]}
                      >
                        {progressSummary}
                      </Text>
                      {model.allDone && (
                        <ComposeSymbol
                          name="checkmark.seal.fill"
                          size={17}
                          color={success}
                        />
                      )}
                    </Row>
                    <LinearProgressIndicator
                      progress={model.progress}
                      color={model.allDone ? success : accent}
                      modifiers={[fillMaxWidth()]}
                    />
                  </Column>
                </Card>
              )}

              {model.items.length > 0 && (
                <>
                  <Text
                    style={{ typography: "labelLarge" }}
                    color={material.onSurfaceVariant}
                  >
                    {t("checkInSection")}
                  </Text>
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
                  <Text
                    style={{ typography: "bodySmall" }}
                    color={material.onSurfaceVariant}
                  >
                    {t("checkInFooter")}
                  </Text>
                </>
              )}
            </LazyColumn>
          </Host>
        )}
      </EaseView>

      {model.celebrating && (
        <Celebration
          colors={model.celebrationColors}
          onFinished={model.endCelebration}
        />
      )}
      {dialog}
    </>
  );
}
