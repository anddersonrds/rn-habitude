import { Text } from "@/components/ui/text";
import { View } from "react-native";
import { styles } from "./styles";
import type { Props } from "./types";

export function Stat({ value, label }: Props) {
  return (
    <View style={styles.stat}>
      <Text variant="title2" style={styles.statNumber}>
        {value}
      </Text>
      <Text variant="footnote" secondary>
        {label}
      </Text>
    </View>
  );
}
