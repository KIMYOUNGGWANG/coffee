import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { LogOut, User, Bell, Shield } from "lucide-react-native";

export default function SettingsScreen() {
  async function handleSignOut() {
    router.replace('/auth');
  }

  return (
    <View className="flex-1 bg-background pt-16 px-4">
      <View className="mb-8">
        <Text className="text-white text-3xl font-serif font-black tracking-tight">설정</Text>
      </View>

      <View className="bg-surface rounded-3xl border border-white/5 overflow-hidden shadow-lg">
        <Pressable 
          className="flex-row items-center px-6 py-5 border-b border-white/5 active:bg-white/5"
          onPress={() => router.push('/settings/profile')}
        >
          <User color="#D4AF37" size={24} />
          <Text className="text-white font-bold text-lg ml-4">내 정보 관리</Text>
        </Pressable>
        <Pressable 
          className="flex-row items-center px-6 py-5 border-b border-white/5 active:bg-white/5"
          onPress={() => router.push('/settings/notifications')}
        >
          <Bell color="#D4AF37" size={24} />
          <Text className="text-white font-bold text-lg ml-4">알림 설정</Text>
        </Pressable>
        <Pressable 
          className="flex-row items-center px-6 py-5 border-b border-white/5 active:bg-white/5"
          onPress={() => router.push('/settings/privacy')}
        >
          <Shield color="#D4AF37" size={24} />
          <Text className="text-white font-bold text-lg ml-4">개인정보 처리방침</Text>
        </Pressable>
        <Pressable className="flex-row items-center px-6 py-5 active:bg-red-500/10" onPress={handleSignOut}>
          <LogOut color="#EF4444" size={24} />
          <Text className="text-red-500 font-bold text-lg ml-4">로그아웃</Text>
        </Pressable>
      </View>
    </View>
  );
}
