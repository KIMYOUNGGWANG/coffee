import React, { useState } from 'react';
import { View, Text, Pressable, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

export default function NotificationsScreen() {
  const router = useRouter();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  return (
    <View className="flex-1 bg-background pt-16">
      <View className="px-4 pb-4 border-b border-white/5 flex-row items-center justify-between">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft color="#fff" size={24} />
        </Pressable>
        <Text className="text-white font-bold text-lg">알림 설정</Text>
        <View className="w-10" />
      </View>

      <View className="flex-1 px-4 pt-6">
        <View className="bg-surface rounded-3xl border border-white/5 overflow-hidden shadow-lg p-6 mb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-white font-bold text-lg mb-1">마케팅 및 추천 알림</Text>
            <Text className="text-muted text-xs">내 취향에 맞는 새로운 원두 추천받기</Text>
          </View>
          <Switch
            trackColor={{ false: '#333', true: '#D4AF37' }}
            thumbColor={'#fff'}
            onValueChange={setPushEnabled}
            value={pushEnabled}
          />
        </View>

        <View className="bg-surface rounded-3xl border border-white/5 overflow-hidden shadow-lg p-6 flex-row items-center justify-between">
          <View>
            <Text className="text-white font-bold text-lg mb-1">주간 테이스팅 요약</Text>
            <Text className="text-muted text-xs">이번 주 내가 마신 커피 리포트 받기</Text>
          </View>
          <Switch
            trackColor={{ false: '#333', true: '#D4AF37' }}
            thumbColor={'#fff'}
            onValueChange={setWeeklyDigest}
            value={weeklyDigest}
          />
        </View>
      </View>
    </View>
  );
}
