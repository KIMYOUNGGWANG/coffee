import { useState } from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { LogOut, User, Bell, Shield, Eye, LockKeyhole } from "lucide-react-native";
import { supabase } from "../../lib/supabase";

export default function SettingsScreen() {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  async function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    setSignOutError(null);

    const { error } = await supabase.auth.signOut();

    if (error) {
      setSignOutError("로그아웃하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      setIsSigningOut(false);
      return;
    }

    router.replace('/auth');
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pb-40 pt-14">
      <View className="mb-5 flex-row items-center justify-between">
        <View>
          <Text className="text-xs font-bold text-muted">나</Text>
          <Text className="mt-1 text-2xl font-extrabold text-room-espresso">설정</Text>
        </View>
        <View className="h-10 w-10 items-center justify-center rounded-full border border-[#2A1A12]/15 bg-room-paper">
          <Text className="font-black text-room-espresso">향</Text>
        </View>
      </View>

      <View className="mb-4 rounded-[1.5rem] border border-[#2A1A12]/10 bg-room-paper p-5">
        <Text className="text-lg font-extrabold leading-7 text-room-espresso">
          내 기록은 기본으로 비공개
        </Text>
        <Text className="mt-2 text-sm font-semibold leading-6 text-muted">
          노트와 원두 서랍은 나에게 먼저 보입니다. 공유는 직접 고를 때만 켭니다.
        </Text>
      </View>

      <View className="mb-4 rounded-[1.5rem] bg-room-paper p-5">
        <View className="mb-4 flex-row items-center gap-2">
          <LockKeyhole color="#BD7650" size={18} />
          <Text className="text-sm font-black text-room-espresso">저장 방식</Text>
        </View>
        <View className="mt-4 gap-2">
          {[
            { label: "기본 저장: 비공개", icon: Shield },
            { label: "공유 전 확인", icon: Eye },
            { label: "내 기록 안에서 보기", icon: LockKeyhole },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <View key={item.label} className="min-h-11 flex-row items-center gap-3 rounded-2xl border border-[#2A1A12]/10 px-4">
                <Icon color="#654D3D" size={18} />
                <Text className="font-black text-room-espresso">{item.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View className="overflow-hidden rounded-[1.5rem] border border-[#2A1A12]/10 bg-room-paper">
        <Pressable 
          className="flex-row items-center border-b border-[#2A1A12]/10 px-5 py-3.5 active:bg-room-linen"
          onPress={() => router.push('/settings/profile')}
        >
          <User color="#BD7650" size={22} />
          <Text className="ml-4 text-base font-bold text-room-espresso">내 정보 관리</Text>
        </Pressable>
        <Pressable 
          className="flex-row items-center border-b border-[#2A1A12]/10 px-5 py-3.5 active:bg-room-linen"
          onPress={() => router.push('/settings/notifications')}
        >
          <Bell color="#BD7650" size={22} />
          <Text className="ml-4 text-base font-bold text-room-espresso">알림 설정</Text>
        </Pressable>
        <Pressable 
          className="flex-row items-center border-b border-[#2A1A12]/10 px-5 py-3.5 active:bg-room-linen"
          onPress={() => router.push('/settings/privacy')}
        >
          <Shield color="#BD7650" size={22} />
          <Text className="ml-4 text-base font-bold text-room-espresso">개인정보 처리방침</Text>
        </Pressable>
        <Pressable
          className={`flex-row items-center px-5 py-3.5 active:bg-room-linen ${isSigningOut ? "opacity-60" : "opacity-100"}`}
          onPress={handleSignOut}
          disabled={isSigningOut}
        >
          <LogOut color="#BD7650" size={22} />
          <Text className="ml-4 text-base font-bold text-room-espresso">
            {isSigningOut ? "로그아웃 중" : "로그아웃"}
          </Text>
        </Pressable>
      </View>

      {signOutError ? (
        <View className="mt-4 rounded-[1.5rem] border border-[#BD7650]/30 bg-room-paper/95 p-4">
          <Text className="break-keep text-sm font-bold leading-6 text-room-espresso">{signOutError}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
