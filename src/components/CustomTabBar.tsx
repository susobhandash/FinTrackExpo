import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import {
  Home,
  ArrowLeftRight,
  PieChart,
  TrendingUp,
  Settings,
} from "lucide-react-native";
import { useApp } from "@/context/AppContext";
import { hapticSelection } from "@/utils/haptics";

const SCREEN_W = Dimensions.get("window").width;
const PILL_W = SCREEN_W - 48;

const ROUTE_ICONS: Record<string, React.ComponentType<any>> = {
  index:        Home,
  wealth:       TrendingUp,
  transactions: ArrowLeftRight,
  analytics:    PieChart,
  settings:     Settings,
};

export default function CustomTabBar({
  state,
  navigation,
}: BottomTabBarProps) {
  const { config } = useApp();
  const isDark = config.theme === "dark";

  const pillBg = isDark
    ? "rgba(15, 23, 42, 0.56)"
    : "rgba(255, 255, 255, 0.67)";
  const activeBg = isDark
    ? "rgba(6, 95, 70, 0.18)"
    : "rgba(209, 250, 229, 0.12)";
  const border = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)";
  const activeColor = isDark ? "#6ee7b7" : "#34d399";
  const inactiveColor = isDark ? "#3d4a60" : "#b0bec5";

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View
        style={[
          styles.pill,
          { backgroundColor: pillBg, borderColor: border, width: PILL_W },
        ]}
      >
        {state.routes.filter((r) => r.name !== "budget").map((route) => {
          const index = state.routes.indexOf(route);
          const isFocused = state.index === index;
          const Icon = ROUTE_ICONS[route.name] ?? Home;

          const onPress = () => {
            hapticSelection();
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              style={[styles.tab, isFocused && { backgroundColor: activeBg }]}
              activeOpacity={1}
            >
              <Icon
                size={21}
                color={activeColor}
                strokeWidth={isFocused ? 3 : 2.2}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: Platform.OS === "android" ? 16 : 28,
    left: 0,
    right: 0,
    alignItems: "center",
    pointerEvents: "box-none",
  },
  pill: {
    flexDirection: "row",
    borderRadius: 40,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 5,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 10 },
    elevation: 18,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 32,
    position: "relative",
  },
  activeDot: {
    position: "absolute",
    top: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#34d399",
  },
});
