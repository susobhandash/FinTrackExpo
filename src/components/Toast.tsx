import React, { useEffect, useRef } from "react";
import { Animated, Text, View, Platform, StatusBar } from "react-native";
import { CheckCircle2, XCircle } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ToastProps {
  message: string;
  type: "success" | "error";
  visible: boolean;
}

export default function Toast({ message, type, visible }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-60)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 70,
          friction: 12,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -60,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacity, translateY]);

  const isSuccess = type === "success";
  const topOffset =
    insets.top > 0
      ? insets.top + 8
      : Platform.OS === "android"
        ? (StatusBar.currentHeight ?? 24) + 8
        : 52;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: topOffset,
        left: 20,
        right: 20,
        opacity,
        transform: [{ translateY }],
        zIndex: 99999,
        elevation: 99999,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderRadius: 16,
          backgroundColor: isSuccess ? "#064e3b" : "#7f1d1d",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 10,
          elevation: 12,
        }}
      >
        {isSuccess ? (
          <CheckCircle2 size={20} color="#34d399" />
        ) : (
          <XCircle size={20} color="#f87171" />
        )}
        <Text
          style={{
            color: "#fff",
            fontFamily: "Inter_600SemiBold",
            fontSize: 15,
            flex: 1,
          }}
        >
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}
