import React, { useCallback, useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from "@expo-google-fonts/poppins";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppProvider, useApp } from "@/context/AppContext";
import { BottomSheetProvider } from "@/context/BottomSheetContext";
import { ToastProvider, useToast } from "@/context/ToastContext";
import Toast from "@/components/Toast";
import WelcomeScreen from "@/components/WelcomeScreen";
import "../global.css";

SplashScreen.preventAutoHideAsync();

const WELCOME_KEY = "hasSeenWelcome_v1";

function AppContent() {
  const { loading, config } = useApp();
  const { toast } = useToast();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  const ready = !loading && fontsLoaded;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.getItem(WELCOME_KEY).then((val) => {
      setOnboardingDone(!!val);
      setOnboardingChecked(true);
    });
  }, [ready]);

  const handleWelcomeDone = useCallback(async () => {
    await AsyncStorage.setItem(WELCOME_KEY, "1");
    setOnboardingDone(true);
  }, []);

  if (!ready || !onboardingChecked) return null;

  if (!onboardingDone) {
    return <WelcomeScreen onDone={handleWelcomeDone} />;
  }

  return (
    <>
      <StatusBar style={config.theme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      {toast && (
        <Toast message={toast.message} type={toast.type} visible={!!toast} />
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <ToastProvider>
            <BottomSheetProvider>
              <AppContent />
            </BottomSheetProvider>
          </ToastProvider>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
