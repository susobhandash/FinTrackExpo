import React from "react";
import {
  View, TouchableOpacity, Text, StyleSheet, Dimensions, Platform,
} from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import {
  Home, ArrowLeftRight, PieChart, TrendingUp, Target, Settings,
} from "lucide-react-native";
import { useApp } from "@/context/AppContext";

const SCREEN_W = Dimensions.get("window").width;
const PILL_W = SCREEN_W - 32;

const ICONS = [Home, ArrowLeftRight, TrendingUp, PieChart, Target, Settings];
const LABELS = ["Home", "Txns", "Wealth", "Insights", "Budget", "Settings"];

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { config } = useApp();
  const isDark = config.theme === "dark";

  const pillBg = isDark ? "rgba(15,23,42,0.90)" : "rgba(255,255,255,0.90)";
  const activeBg = isDark ? "rgba(52,211,153,0.18)" : "rgba(52,211,153,0.12)";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const inactiveColor = isDark ? "#64748b" : "#94a3b8";
  const activeColor = "#34d399";

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
          const label = LABELS[index] ?? route.name;

          const onPress = () => {
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
                size={20}
                color={isFocused ? activeColor : inactiveColor}
                strokeWidth={isFocused ? 2.2 : 1.8}
              />
              <Text
                style={[
                  styles.label,
                  { color: isFocused ? activeColor : inactiveColor },
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
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
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    borderRadius: 28,
    gap: 2,
  },
  label: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
  },
});
