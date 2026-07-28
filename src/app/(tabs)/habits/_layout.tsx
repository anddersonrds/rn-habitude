import { Stack } from "expo-router";

export default function HabitsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: "Habits", headerLargeTitleEnabled: true }}
      />
    </Stack>
  );
}
