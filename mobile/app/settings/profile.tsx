import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const [nickname, setNickname] = useState('커피애호가');

  return (
    <View className="flex-1 bg-background pt-16">
      <View className="px-4 pb-4 border-b border-white/5 flex-row items-center justify-between">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft color="#fff" size={24} />
        </Pressable>
        <Text className="text-white font-bold text-lg">내 정보 관리</Text>
        <View className="w-10" />
      </View>

      <View className="flex-1 px-4 pt-6">
        <View className="mb-6">
          <Text className="text-muted text-sm font-bold mb-2">이메일 계정</Text>
          <View className="bg-surface px-5 py-4 rounded-xl border border-white/10 opacity-50">
            <Text className="text-white font-bold">test@coffeedex.app</Text>
          </View>
          <Text className="text-xs text-muted mt-2">이메일은 변경할 수 없습니다.</Text>
        </View>

        <View className="mb-6">
          <Text className="text-muted text-sm font-bold mb-2">닉네임</Text>
          <TextInput
            className="bg-surface text-white px-5 py-4 rounded-xl border border-white/10 font-bold"
            value={nickname}
            onChangeText={setNickname}
          />
        </View>

        <Pressable 
          className="mt-8 bg-primary-amber py-4 rounded-xl items-center flex-row justify-center gap-2"
          onPress={() => {
            
            Alert.alert('저장 완료', '회원 정보가 수정되었습니다.', [
              { text: '확인', onPress: () => router.back() }
            ]);
          }}
        >
          <Check color="#000" size={20} />
          <Text className="text-black font-extrabold text-lg">저장하기</Text>
        </Pressable>
      </View>
    </View>
  );
}
