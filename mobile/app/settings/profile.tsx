import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const [nickname, setNickname] = useState('커피애호가');
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  return (
    <View className="flex-1 bg-background pt-14">
      <View className="flex-row items-center justify-between px-5 pb-4">
        <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-full border border-[#2A1A12]/10 bg-room-paper">
          <ArrowLeft color="#2A1A12" size={20} />
        </Pressable>
        <View className="rounded-full border border-[#2A1A12]/10 bg-room-paper px-3 py-2">
          <Text className="text-xs font-black text-room-cocoa">내 정보</Text>
        </View>
      </View>

      <View className="flex-1 px-5 pt-2">
        <Text className="mb-5 break-keep text-2xl font-extrabold leading-8 text-room-espresso">
          내 정보
        </Text>

        <View className="mb-4 rounded-[1.5rem] border border-[#2A1A12]/10 bg-room-paper p-5">
          <Text className="mb-2 text-sm font-black text-muted">이메일 계정</Text>
          <View className="rounded-2xl border border-[#2A1A12]/10 bg-background px-4 py-4">
            <Text className="font-bold text-room-espresso">test@coffeedex.app</Text>
          </View>
          <Text className="mt-2 text-xs font-bold text-muted">이메일은 변경할 수 없습니다.</Text>
        </View>

        <View className="mb-4 rounded-[1.5rem] border border-[#2A1A12]/10 bg-room-paper p-5">
          <Text className="mb-2 text-sm font-black text-muted">닉네임</Text>
          <TextInput
            className="min-h-14 rounded-2xl border border-[#2A1A12]/10 bg-background px-4 font-bold text-room-espresso"
            value={nickname}
            onChangeText={setNickname}
            placeholderTextColor="#8F7867"
          />
        </View>

        {savedMessage ? (
          <View className="mb-4 rounded-[1.5rem] border border-[#BD7650]/30 bg-room-paper p-4">
            <Text className="text-sm font-bold text-room-espresso">{savedMessage}</Text>
          </View>
        ) : null}

        <Pressable
          className="mt-3 min-h-14 flex-row items-center justify-center gap-2 rounded-full bg-room-soil"
          onPress={() => {
            setSavedMessage('이름을 저장했습니다.');
          }}
        >
          <Check color="#FFF8EC" size={20} />
          <Text className="text-lg font-extrabold text-room-paper">저장하기</Text>
        </Pressable>
      </View>
    </View>
  );
}
