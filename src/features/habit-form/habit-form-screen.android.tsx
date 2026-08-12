import { AppSymbol } from "@/components/ui/app-symbol";
import { Text } from "@/components/ui/text";
import { HABIT_ICONS, WEEKDAY_KEYS } from "@/constants/habit-options";
import { foregroundOnColor } from "@/lib/utils/foreground-on-color";
import { colors } from "@/theme";
import { Stack } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Switch, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Animated, {
  FadeInDown,
  FadeOutUp,
  LinearTransition,
} from "react-native-reanimated";
import { useColorGrid } from "./hooks/use-color-grid";
import { useHabitFormModel } from "./hooks/use-habit-form-model";
import type { FrequencyChoice } from "./hooks/use-habit-form-model/types";
import { styles } from "./styles";

const CONDITIONAL_LAYOUT = LinearTransition.duration(200);
const CONDITIONAL_ENTER = FadeInDown.duration(180);
const CONDITIONAL_EXIT = FadeOutUp.duration(140);

const FREQUENCIES: { choice: FrequencyChoice; key: "daily" | "specificDays" }[] = [
  { choice: "daily", key: "daily" },
  { choice: "specific", key: "specificDays" },
];

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
/* A 24-hour mask rather than copy: all eight catalogs would read "HH:mm". */
const TIME_HINT = "HH:mm";

function formatTime(date: Date): string {
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
}

function parseTime(text: string, from: Date): Date {
  const [hours, minutes] = text.split(":").map(Number);
  const date = new Date(from);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Compose takes the screens that are lists of rows; a form comes here. The four
 * pickers, the switch and the time field have no `@expo/ui` Compose equivalent,
 * and the model is the same one the SwiftUI screen renders.
 */
export function HabitFormScreen() {
  const { t } = useTranslation(["habitForm", "common"]);
  const { t: tSchedule } = useTranslation("schedule");
  const { rows: colorRows, gap: colorGap } = useColorGrid();
  const {
    isEditing,
    name,
    setName,
    icon,
    color,
    daily,
    frequency,
    weekdays,
    reminderOn,
    reminderDate,
    canSave,
    toggleWeekday,
    chooseFrequency,
    selectIcon,
    selectColor,
    toggleReminder,
    pickReminderTime,
    save,
    cancel,
    confirmDelete,
  } = useHabitFormModel();

  /**
   * The one control this milestone downgrades: Compose has no date picker worth
   * reaching a third dependency for, so the time is typed and the pattern is
   * what stands in for the picker's guarantee.
   */
  const [timeText, setTimeText] = useState(() => formatTime(reminderDate));
  const timeIsValid = TIME_PATTERN.test(timeText);
  const canSubmit = canSave && (!reminderOn || timeIsValid);

  /* The model only ever holds a time the pattern accepted, so a rejected one
  cannot reach the store even if the button is somehow pressed. */
  const editTime = (text: string) => {
    setTimeText(text);
    if (TIME_PATTERN.test(text)) pickReminderTime(parseTime(text, reminderDate));
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: isEditing ? t("editTitle") : t("newTitle"),
          headerShown: true,
          headerLeft: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("common:cancel")}
              onPress={cancel}
              style={styles.headerAction}
            >
              <Text variant="body" style={{ color: colors.text }}>
                {t("common:cancel")}
              </Text>
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isEditing ? t("save") : t("add")}
              accessibilityState={{ disabled: !canSubmit }}
              disabled={!canSubmit}
              onPress={save}
              style={[styles.headerAction, !canSubmit && styles.headerActionOff]}
            >
              <Text variant="headline" style={{ color }}>
                {isEditing ? t("save") : t("add")}
              </Text>
            </Pressable>
          ),
        }}
      />

      <View style={styles.container}>
        <KeyboardAwareScrollView
          bottomOffset={64}
          contentContainerStyle={styles.content}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.nameCard}>
            <View style={[styles.namePreviewIcon, { backgroundColor: `${color}26` }]}>
              <AppSymbol name={icon} size={22} tintColor={color} />
            </View>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t("namePlaceholder")}
              placeholderTextColor={colors.tertiaryText as never}
              accessibilityLabel={t("nameLabel")}
              autoFocus={!isEditing}
              selectionColor={color}
              enablesReturnKeyAutomatically
              returnKeyType="done"
              submitBehavior="blurAndSubmit"
              maxLength={40}
              style={styles.nameInput}
            />
          </View>

          <Text variant="footnote" secondary style={styles.sectionLabel}>
            {t("scheduleSection")}
          </Text>
          <Animated.View layout={CONDITIONAL_LAYOUT} style={styles.card}>
            <View style={styles.schedulePicker}>
              <Text variant="subheadline" secondary>
                {t("frequency")}
              </Text>
              <View style={styles.chipRow}>
                {FREQUENCIES.map(({ choice, key }) => {
                  const selected = frequency === choice;
                  return (
                    <Pressable
                      key={choice}
                      accessibilityRole="button"
                      accessibilityLabel={t(key)}
                      accessibilityState={{ selected }}
                      onPress={() => chooseFrequency(choice)}
                      style={[
                        styles.chip,
                        { backgroundColor: selected ? color : colors.fill },
                      ]}
                    >
                      <Text
                        variant="subheadline"
                        style={{
                          color: selected
                            ? foregroundOnColor(color)
                            : (colors.secondaryText as never),
                          fontWeight: "600",
                        }}
                      >
                        {t(key)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            {!daily && (
              <Animated.View
                entering={CONDITIONAL_ENTER}
                exiting={CONDITIONAL_EXIT}
                style={styles.conditionalBlock}
              >
                <View style={styles.separator} />
                <View style={styles.weekdayRow}>
                  {WEEKDAY_KEYS.map((keys, day) => {
                    const selected = weekdays.includes(day);
                    return (
                      <Pressable
                        key={day}
                        accessibilityRole="button"
                        accessibilityLabel={tSchedule(keys.name)}
                        accessibilityState={{ selected }}
                        onPress={() => toggleWeekday(day)}
                        style={[
                          styles.weekdayDot,
                          {
                            backgroundColor: selected ? color : colors.fill,
                          },
                        ]}
                      >
                        <Text
                          variant="subheadline"
                          style={{
                            color: selected
                              ? foregroundOnColor(color)
                              : (colors.secondaryText as never),
                            fontWeight: "600",
                          }}
                        >
                          {tSchedule(keys.initial)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {weekdays.length === 0 && (
                  <Text variant="caption" style={styles.validationText}>
                    {t("chooseADay")}
                  </Text>
                )}
              </Animated.View>
            )}
          </Animated.View>

          <Text variant="footnote" secondary style={styles.sectionLabel}>
            {t("reminderSection")}
          </Text>
          <Animated.View layout={CONDITIONAL_LAYOUT} style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.rowLabel}>
                <AppSymbol name="bell.fill" size={18} tintColor={color} />
                <Text variant="body">{t("remindMe")}</Text>
              </View>
              <Switch
                value={reminderOn}
                onValueChange={(enabled) => void toggleReminder(enabled)}
                trackColor={{ true: color }}
              />
            </View>
            {reminderOn && (
              <Animated.View entering={CONDITIONAL_ENTER} exiting={CONDITIONAL_EXIT}>
                <View style={styles.separator} />
                <View style={styles.cardRow}>
                  <Text variant="body">{t("time")}</Text>
                  <TextInput
                    value={timeText}
                    onChangeText={editTime}
                    accessibilityLabel={t("time")}
                    placeholder={TIME_HINT}
                    placeholderTextColor={colors.tertiaryText as never}
                    keyboardType="numbers-and-punctuation"
                    selectionColor={color}
                    maxLength={TIME_HINT.length}
                    style={[
                      styles.timeInput,
                      !timeIsValid && { color: colors.destructive as never },
                    ]}
                  />
                </View>
              </Animated.View>
            )}
          </Animated.View>

          <Text variant="footnote" secondary style={styles.sectionLabel}>
            {t("iconSection")}
          </Text>
          <View style={styles.iconCard}>
            <View style={styles.iconGrid}>
              {HABIT_ICONS.map((symbol) => {
                const selected = symbol === icon;
                return (
                  <Pressable
                    key={symbol}
                    accessibilityRole="button"
                    accessibilityLabel={t("iconLabel", { symbol })}
                    accessibilityState={{ selected }}
                    onPress={() => selectIcon(symbol)}
                    style={[
                      styles.iconCell,
                      {
                        backgroundColor: selected ? color : colors.fill,
                      },
                    ]}
                  >
                    <AppSymbol
                      name={symbol}
                      size={21}
                      tintColor={
                        selected ? foregroundOnColor(color) : colors.secondaryText
                      }
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Text variant="footnote" secondary style={styles.sectionLabel}>
            {t("colorSection")}
          </Text>
          <View style={styles.colorCard}>
            <View style={styles.colorGrid}>
              {colorRows.map((rowColors, row) => (
                <View key={row} style={[styles.colorRow, { gap: colorGap }]}>
                  {rowColors.map((optionColor) => {
                    const selected = optionColor === color;
                    return (
                      <Pressable
                        key={optionColor}
                        accessibilityRole="button"
                        accessibilityLabel={t("colorLabel", { color: optionColor })}
                        accessibilityState={{ selected }}
                        onPress={() => selectColor(optionColor)}
                        style={[
                          styles.colorRing,
                          selected && { borderColor: optionColor },
                        ]}
                      >
                        <View
                          style={[styles.colorDot, { backgroundColor: optionColor }]}
                        >
                          {selected && (
                            <AppSymbol
                              name="checkmark"
                              size={13}
                              tintColor={foregroundOnColor(optionColor)}
                            />
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>

          {isEditing && (
            <Pressable
              accessibilityRole="button"
              onPress={confirmDelete}
              style={styles.deleteButton}
            >
              <Text variant="headline" style={{ color: colors.destructive }}>
                {t("deleteHabit")}
              </Text>
            </Pressable>
          )}
        </KeyboardAwareScrollView>
      </View>
    </>
  );
}
