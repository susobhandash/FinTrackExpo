import React from "react";
import {
  View, TouchableOpacity, StyleSheet, Dimensions, Platform,
} from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import {
  Home, ArrowLeftRight, PieChart, TrendingUp, Target, Settings,
} from "lucide-react-native";
import { useApp } from "@/context/AppContext";
import { hapticSelection } from "@/utils/haptics";

const SCREEN_W = Dimensions.get("window").width;
const PILL_W = SCREEN_W - 32;

const ICONS = [Home, ArrowLeftRight, TrendingUp, PieChart, Target, Settings];

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { config } = useApp();
  const isDark = config.theme === "dark";

  const pillBg   = isDark ? "rgba(15,23,42,0.65)" : "rgba(255,255,255,0.65)";
  const activeBg = isDark ? "rgba(52,211,153,0.22)" : "rgba(52,211,153,0.16)";
  const border   = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)";
  const inactiveColor = isDark ? "#64748b" : "#94a3b8";
  const activeColor   = "#34d399";

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
              activeOpacity={0.7}
            >
              <Icon
                size={22}
                color={isFocused ? activeColor : inactiveColor}
                strokeWidth={isFocused ? 2.2 : 1.8}
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
    borderRadius: 36,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 28,
  },
});
