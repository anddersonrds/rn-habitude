import { Text } from "@/components/ui/text";
import { HABIT_ICONS, WEEKDAY_KEYS } from "@/constants/habit-options";
import { foregroundOnColor } from "@/lib/utils/foreground-on-color";
import { colors } from "@/theme";
import {
  DatePicker,
  Host,
  Picker,
  Button as SwiftUIButton,
  Text as SwiftUIText,
} from "@expo/ui/swift-ui";
import {
  buttonBorderShape,
  buttonStyle,
  controlSize,
  font,
  labelStyle,
  pickerStyle,
  tag,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { Stack } from "expo-router";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { PressableScale } from "pressto";
import { useTranslation } from "react-i18next";
import { Keyboard, Pressable, Switch, TextInput, View } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import Animated, {
  FadeInDown,
  FadeOutUp,
  LinearTransition,
} from "react-native-reanimated";
import { useColorGrid } from "./hooks/use-color-grid";
import { useHabitFormModel } from "./hooks/use-habit-form-model";
import { styles } from "./styles";

const CONDITIONAL_LAYOUT = LinearTransition.duration(200);
const CONDITIONAL_ENTER = FadeInDown.duration(180);
const CONDITIONAL_EXIT = FadeOutUp.duration(140);

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

  return (
    <>
      <Stack.Screen
        options={{
          title: isEditing ? t("editTitle") : t("newTitle"),
          headerShown: true,
        }}
      />
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button variant="plain" onPress={cancel}>
          {t("common:cancel")}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          variant="prominent"
          tintColor={color}
          disabled={!canSave}
          onPress={save}
        >
          {isEditing ? t("save") : t("add")}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>

      <View style={styles.container}>
        <KeyboardAwareScrollView
          bottomOffset={64}
          contentContainerStyle={styles.content}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >
          <View style={styles.nameCard}>
            <View style={[styles.namePreviewIcon, { backgroundColor: `${color}26` }]}>
              <SymbolView name={icon as SFSymbol} size={22} tintColor={color} />
            </View>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t("namePlaceholder")}
              placeholderTextColor={colors.tertiaryText as never}
              accessibilityLabel={t("nameLabel")}
              autoFocus={!isEditing}
              clearButtonMode="while-editing"
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
              <Host style={styles.pickerHost}>
                <Picker
                  label={t("frequency")}
                  selection={frequency}
                  onSelectionChange={chooseFrequency}
                  modifiers={[pickerStyle("segmented"), tint(color)]}
                >
                  <SwiftUIText modifiers={[font({ design: "rounded" }), tag("daily")]}>
                    {t("daily")}
                  </SwiftUIText>
                  <SwiftUIText
                    modifiers={[font({ design: "rounded" }), tag("specific")]}
                  >
                    {t("specificDays")}
                  </SwiftUIText>
                </Picker>
              </Host>
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
                            backgroundColor: selected
                              ? color
                              : colors.fill,
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
                <SymbolView name="bell.fill" size={18} tintColor={color} />
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
                  <Host matchContents>
                    <DatePicker
                      selection={reminderDate}
                      displayedComponents={["hourAndMinute"]}
                      onDateChange={pickReminderTime}
                      modifiers={[tint(color)]}
                    />
                  </Host>
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
                        backgroundColor: selected
                          ? color
                          : colors.fill,
                      },
                    ]}
                  >
                    <SymbolView
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
                          style={[
                            styles.colorDot,
                            { backgroundColor: optionColor },
                          ]}
                        >
                          {selected && (
                            <SymbolView
                              name="checkmark"
                              size={13}
                              weight="bold"
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
            <PressableScale onPress={confirmDelete} style={styles.deleteButton}>
              <Text variant="headline" style={{ color: colors.destructive }}>
                {t("deleteHabit")}
              </Text>
            </PressableScale>
          )}
        </KeyboardAwareScrollView>

        <KeyboardStickyView
          offset={{ closed: 56 }}
          pointerEvents="box-none"
          style={styles.keyboardAccessory}
        >
          <View pointerEvents="box-none" style={styles.keyboardAccessoryRow}>
            <Host matchContents>
              <SwiftUIButton
                label={t("dismissKeyboard")}
                systemImage="keyboard.chevron.compact.down"
                modifiers={[
                  buttonStyle("glass"),
                  buttonBorderShape("circle"),
                  controlSize("large"),
                  labelStyle("iconOnly"),
                ]}
                onPress={Keyboard.dismiss}
              />
            </Host>
            {canSave && (
              <Host matchContents>
                <SwiftUIButton
                  label={isEditing ? t("saveHabit") : t("createHabit")}
                  systemImage="checkmark"
                  modifiers={[
                    buttonStyle("glassProminent"),
                    buttonBorderShape("circle"),
                    controlSize("large"),
                    labelStyle("iconOnly"),
                    tint(color),
                  ]}
                  onPress={save}
                />
              </Host>
            )}
          </View>
        </KeyboardStickyView>
      </View>
    </>
  );
}
