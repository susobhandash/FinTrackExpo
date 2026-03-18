import { Tabs } from "expo-router";
import CustomTabBar from "@/components/CustomTabBar";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index"        options={{ title: "Home" }} />
      <Tabs.Screen name="transactions" options={{ title: "Txns" }} />
      <Tabs.Screen name="wealth"       options={{ title: "Assets" }} />
      <Tabs.Screen name="analytics"    options={{ title: "Insights" }} />
      <Tabs.Screen name="budget"       options={{ title: "Budget" }} />
      <Tabs.Screen name="settings"     options={{ title: "Settings" }} />
    </Tabs>
  );
}
