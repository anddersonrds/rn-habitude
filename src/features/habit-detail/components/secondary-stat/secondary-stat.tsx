import { Text } from "@/components/ui/text";
import { SymbolView } from "expo-symbols";
import { View } from "react-native";
import { styles } from "./styles";
import type { Props } from "./types";

export function SecondaryStat({ symbol, color, value, label }: Props) {
  return (
    <View style={styles.secondaryStat}>
      <SymbolView name={symbol} size={16} tintColor={color} />
      <Text variant="subheadline" secondary style={styles.secondaryStatLabel}>
        {label}
      </Text>
      <Text variant="headline" style={styles.statNumber}>
        {value}
      </Text>
    </View>
  );
}
