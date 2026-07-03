import React, { useState } from 'react';
import { View, Text, Pressable, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, Mail } from 'lucide-react-native';

export default function NotificationsScreen() {
  const router = useRouter();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  return (
    <View className="flex-1 bg-background pt-14">
      <View className="flex-row items-center justify-between px-5 pb-4">
        <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-full border border-[#2A1A12]/10 bg-room-paper">
          <ArrowLeft color="#2A1A12" size={20} />
        </Pressable>
        <View className="rounded-full border border-[#2A1A12]/10 bg-room-paper px-3 py-2">
          <Text className="text-xs font-black text-room-cocoa">조용한 알림</Text>
        </View>
      </View>

      <View className="flex-1 px-5 pt-2">
        <Text className="mb-5 break-keep text-2xl font-extrabold leading-8 text-room-espresso">
          알림
        </Text>

        <View className="mb-4 flex-row items-center justify-between rounded-[1.5rem] border border-[#2A1A12]/10 bg-room-paper p-5">
          <View className="min-w-0 flex-1 flex-row items-start gap-3">
            <Bell color="#BD7650" size={22} />
            <View className="min-w-0 flex-1">
              <Text className="mb-1 text-base font-black text-room-espresso">다시 살 원두</Text>
              <Text className="break-keep text-xs font-bold leading-5 text-muted">서랍에 남겨둔 원두를 가끔 알려줍니다.</Text>
            </View>
          </View>
          <Switch
            trackColor={{ false: '#E8D8C1', true: '#493024' }}
            thumbColor={'#FFF8EC'}
            onValueChange={setPushEnabled}
            value={pushEnabled}
          />
        </View>

        <View className="flex-row items-center justify-between rounded-[1.5rem] border border-[#2A1A12]/10 bg-room-paper p-5">
          <View className="min-w-0 flex-1 flex-row items-start gap-3">
            <Mail color="#BD7650" size={22} />
            <View className="min-w-0 flex-1">
              <Text className="mb-1 text-base font-black text-room-espresso">주간 노트</Text>
              <Text className="break-keep text-xs font-bold leading-5 text-muted">이번 주에 남긴 노트를 모아서 받습니다.</Text>
            </View>
          </View>
          <Switch
            trackColor={{ false: '#E8D8C1', true: '#493024' }}
            thumbColor={'#FFF8EC'}
            onValueChange={setWeeklyDigest}
            value={weeklyDigest}
          />
        </View>
      </View>
    </View>
  );
}
