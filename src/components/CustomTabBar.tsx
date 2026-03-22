import React, { useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Animated,
} from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import {
  Home,
  ArrowLeftRight,
  PieChart,
  Settings,
  Landmark,
} from "lucide-react-native";
import { useApp } from "@/context/AppContext";
import { hapticSelection } from "@/utils/haptics";

const { width: SCREEN_W } = Dimensions.get("window");
const PILL_W = SCREEN_W - 48;
const PILL_H = 64;
const BR = 40;
const H_PAD = 4;

const ROUTE_ICONS: Record<string, React.ComponentType<any>> = {
  index: Home,
  wealth: Landmark,
  transactions: ArrowLeftRight,
  analytics: PieChart,
  settings: Settings,
};

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { config } = useApp();
  const isDark = config.theme === "dark";

  const routes = state.routes.filter((r) => r.name !== "budget");
  const tabCount = routes.length;
  const TAB_W = (PILL_W - H_PAD * 2) / tabCount;

  const visualIndex = routes.findIndex((r) => r.key === state.routes[state.index]?.key);
  const safeVisualIndex = visualIndex === -1 ? 0 : visualIndex;

  // Animate blob X position
  const blobAnim = useRef(new Animated.Value(H_PAD + safeVisualIndex * TAB_W)).current;
  useEffect(() => {
    Animated.spring(blobAnim, {
      toValue: H_PAD + safeVisualIndex * TAB_W,
      damping: 18,
      stiffness: 180,
      mass: 0.8,
      useNativeDriver: false,
    }).start();
  }, [safeVisualIndex]);

  // Theme colors
  const pillBg = isDark
    ? "rgba(15,23,42,0.72)"
    : "rgba(255,255,255,0.72)";

  const borderColor = isDark
    ? "rgba(255,255,255,0.15)"
    : "rgba(255,255,255,0.80)";

  const blobColor = isDark
    ? "rgba(6,95,70,0.88)"
    : "rgba(167,243,208,0.92)";

  const activeColor = isDark ? "#6ee7b7" : "#064e3b";
  const inactiveColor = "#34d399";

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View
        style={[
          styles.pill,
          {
            width: PILL_W,
            height: PILL_H,
            backgroundColor: pillBg,
            borderColor: borderColor,
          },
        ]}
      >
        {/* Animated active blob */}
        <Animated.View
          style={[
            styles.blob,
            {
              width: TAB_W,
              height: PILL_H - 12,
              backgroundColor: blobColor,
              transform: [{ translateX: blobAnim }],
            },
          ]}
          pointerEvents="none"
        />

        {/* Touch targets */}
        <View style={styles.tabRow}>
          {routes.map((route) => {
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
                style={styles.tab}
                activeOpacity={0.8}
              >
                <Icon
                  size={21}
                  color={isFocused ? activeColor : inactiveColor}
                  strokeWidth={isFocused ? 3 : 2.2}
                />
              </TouchableOpacity>
            );
          })}
        </View>
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
    borderRadius: BR,
    borderWidth: 1,
    overflow: "hidden",
    elevation: 20,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
  },
  blob: {
    position: "absolute",
    top: 6,
    borderRadius: 28,
  },
  tabRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    paddingHorizontal: H_PAD,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
