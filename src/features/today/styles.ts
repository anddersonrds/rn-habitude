import { colors, layout } from "@/theme";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: colors.groupedBackground,
  },
  empty: {
    flex: 1,
    backgroundColor: colors.groupedBackground,
  },
  title: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: 12,
  },
  host: {
    flex: 1,
    backgroundColor: colors.groupedBackground,
  },
});
