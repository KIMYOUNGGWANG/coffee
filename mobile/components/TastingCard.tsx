import React from 'react';
import { Image, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';

interface TastingCardProps {
  id: string;
  title: string;
  subtitle: string;
  repurchaseLabel: string;
}

export function TastingCard({ id, title, subtitle, repurchaseLabel }: TastingCardProps) {
  return (
    <Pressable
      className="mb-3 w-full flex-row items-center gap-3 rounded-[1.25rem] border border-[#2A1A12]/10 bg-room-paper p-3 active:opacity-80"
      onPress={() => {
        router.push(`/note/${encodeURIComponent(id)}`);
      }}
    >
      <Image
        source={require("../assets/coffee-bag.png")}
        className="rounded-2xl"
        resizeMode="cover"
        style={{ height: 56, width: 56 }}
      />
      <View className="min-w-0 flex-1">
        <Text className="text-base font-extrabold text-room-espresso" numberOfLines={1}>{title}</Text>
        <Text className="mt-1 text-xs font-bold text-muted" numberOfLines={1}>{subtitle}</Text>
      </View>
      <View className="items-end">
        <Text className="text-xs font-black text-room-clay">{repurchaseLabel}</Text>
        <ChevronRight color="#8F7867" size={17} />
      </View>
    </Pressable>
  );
}
