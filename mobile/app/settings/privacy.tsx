import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, LockKeyhole } from 'lucide-react-native';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background pt-14">
      <View className="flex-row items-center justify-between px-5 pb-4">
        <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-full border border-[#2A1A12]/10 bg-room-paper">
          <ArrowLeft color="#2A1A12" size={20} />
        </Pressable>
        <View className="rounded-full border border-[#2A1A12]/10 bg-room-paper px-3 py-2">
          <Text className="text-xs font-black text-room-cocoa">비공개 기본값</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-2" contentContainerClassName="pb-32">
        <View className="mb-5 rounded-[1.5rem] bg-room-soil p-5">
          <View className="mb-3 flex-row items-center gap-2">
            <LockKeyhole color="#FFF8EC" size={18} />
            <Text className="text-sm font-black text-room-paper">내 커피 기록은 나에게 먼저</Text>
          </View>
          <Text className="break-keep text-lg font-extrabold leading-7 text-room-paper">
            원두 사진과 노트는 저장 전 확인하고, 기본은 비공개입니다.
          </Text>
        </View>

        {[
          {
            title: "수집하는 정보",
            body: "계정과 기록 백업에 필요한 최소 정보만 사용합니다. 원두 사진은 노트 초안을 만들 때만 쓰고, 저장 전 직접 확인할 수 있어요.",
          },
          {
            title: "기록의 보관",
            body: "내 노트, 내 서랍, 다시 살 단서는 개인 공간 안에서 먼저 보여줍니다. 공유는 사용자가 선택한 뒤에만 이어집니다.",
          },
          {
            title: "삭제와 탈퇴",
            body: "계정을 삭제하면 연결된 개인정보와 저장 기록은 복구할 수 없도록 정리됩니다.",
          },
        ].map((item) => (
          <View key={item.title} className="mb-4 rounded-[1.5rem] border border-[#2A1A12]/10 bg-room-paper p-5">
            <Text className="mb-2 text-base font-black text-room-espresso">{item.title}</Text>
            <Text className="break-keep text-sm font-semibold leading-6 text-muted">{item.body}</Text>
          </View>
        ))}

      </ScrollView>
    </View>
  );
}
