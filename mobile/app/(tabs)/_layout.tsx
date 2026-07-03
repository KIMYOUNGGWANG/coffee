import { Tabs } from "expo-router";
import { Coffee, NotebookPen, Archive, UserRound } from "lucide-react-native";
import { Platform } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          left: 14,
          right: 14,
          bottom: Platform.OS === "ios" ? 18 : 12,
          height: Platform.OS === 'ios' ? 72 : 66,
          backgroundColor: '#FFF8EC',
          borderTopColor: 'rgba(42,26,18,0.10)',
          borderWidth: 1,
          borderColor: 'rgba(42,26,18,0.12)',
          borderRadius: 28,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 10,
          boxShadow: '0 10px 24px rgba(42, 26, 18, 0.15)',
          elevation: 12,
        },
        tabBarActiveTintColor: '#2A1A12',
        tabBarInactiveTintColor: '#8F7867',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '800',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "룸",
          tabBarIcon: ({ color, size }) => <Coffee color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "노트",
          tabBarIcon: ({ color, size }) => <NotebookPen color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="passport"
        options={{
          title: "서랍",
          tabBarIcon: ({ color, size }) => <Archive color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "나",
          tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
