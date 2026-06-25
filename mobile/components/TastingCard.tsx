import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  useSharedValue 
} from 'react-native-reanimated';

interface TastingCardProps {
  title: string;
  subtitle: string;
}

export function TastingCard({ title, subtitle }: TastingCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Pressable
      onPress={() => {
        router.push('/note/mock-1');
      }}
      onPressIn={() => { scale.value = withSpring(0.95); }}
      onPressOut={() => { scale.value = withSpring(1); }}
    >
      <Animated.View 
        className="w-full bg-[#111111] border border-white/10 rounded-[1.5rem] p-6 shadow-2xl mb-4"
        style={animatedStyle}
      >
        <Text className="text-primary-amber text-xs font-bold uppercase tracking-widest mb-1">{subtitle}</Text>
        <Text className="text-white text-2xl font-serif font-black">{title}</Text>
        
        <View className="mt-4 pt-4 border-t border-white/5 flex-row justify-between items-center">
          <Text className="text-muted text-sm">탭하여 상세 보기</Text>
          <View className="w-8 h-8 rounded-full bg-white/5 items-center justify-center">
            <Text className="text-primary-amber">→</Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}
