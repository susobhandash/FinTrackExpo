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
  Target,
  Settings,
} from "lucide-react-native";
import { useApp } from "@/context/AppContext";
import { hapticSelection } from "@/utils/haptics";

const SCREEN_W = Dimensions.get("window").width;
const PILL_W = SCREEN_W - 48;

const ICONS = [Home, TrendingUp, ArrowLeftRight, PieChart, Target, Settings];

export default function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const { config } = useApp();
  const isDark = config.theme === "dark";

  const pillBg = isDark ? "rgba(4,6,20,0.7)" : "rgba(255,255,255,0.7)";
  const border = isDark ? "rgba(99,102,241,0.18)" : "rgba(99,102,241,0.12)";
  const activeBg = isDark ? "rgba(6,95,70,0.9)" : "rgba(236,253,245,0.9)";
  const activeColor = "#34d399";
  const inactiveColor = isDark ? "#3d4a60" : "#b0bec5";

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View
        style={[
          styles.pill,
          { backgroundColor: pillBg, borderColor: border, width: PILL_W },
        ]}
      >
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const Icon = ICONS[index] ?? Home;

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
              activeOpacity={0.65}
            >
              <Icon
                size={21}
                color={isFocused ? activeColor : inactiveColor}
                strokeWidth={isFocused ? 2.2 : 1.6}
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
