import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background pt-16">
      <View className="px-4 pb-4 border-b border-white/5 flex-row items-center justify-between">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft color="#fff" size={24} />
        </Pressable>
        <Text className="text-white font-bold text-lg">개인정보 처리방침</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-4 pt-6">
        <Text className="text-white text-lg font-bold mb-4">제1조 (목적)</Text>
        <Text className="text-muted leading-6 mb-6">
          본 방침은 CoffeeDex(이하 "회사")가 제공하는 서비스와 관련하여 사용자 개인정보를 어떻게 수집, 이용, 보관, 파기하는지에 대한 안내를 목적으로 합니다.
        </Text>

        <Text className="text-white text-lg font-bold mb-4">제2조 (수집하는 개인정보)</Text>
        <Text className="text-muted leading-6 mb-6">
          회사는 원활한 테이스팅 노트 기록 및 데이터 백업을 위해 최소한의 정보(이메일, 프로필 이름)만을 수집합니다. 스마트 렌즈 사용 시 서버로 전송되는 이미지는 즉시 폐기되며 영구 저장되지 않습니다.
        </Text>

        <Text className="text-white text-lg font-bold mb-4">제3조 (개인정보의 파기)</Text>
        <Text className="text-muted leading-6 mb-12">
          회원 탈퇴 시 모든 개인정보 및 등록된 데이터(테이스팅 카드 등)는 지체 없이 파기되며 복구할 수 없습니다.
        </Text>
      </ScrollView>
    </View>
  );
}
