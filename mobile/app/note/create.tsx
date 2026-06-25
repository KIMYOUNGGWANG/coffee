import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Star, Check } from 'lucide-react-native';

export default function CreateNoteScreen() {
  const router = useRouter();
  const [coffeeName, setCoffeeName] = useState('');
  const [roaster, setRoaster] = useState('');
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState('');
  const [repurchase, setRepurchase] = useState<'yes' | 'maybe' | 'no' | null>(null);

  return (
    <View className="flex-1 bg-background pt-16">
      <View className="px-4 pb-4 border-b border-white/5 flex-row items-center justify-between">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft color="#fff" size={24} />
        </Pressable>
        <Text className="text-white font-bold text-lg">새 테이스팅 기록</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-4 pt-6">
        <View className="mb-6">
          <Text className="text-muted text-sm font-bold mb-2">원두 이름</Text>
          <TextInput
            className="bg-surface text-white px-5 py-4 rounded-xl border border-white/10 font-bold"
            placeholder="예: 코스타리카 볼칸 아술 게이샤"
            placeholderTextColor="#737373"
            value={coffeeName}
            onChangeText={setCoffeeName}
          />
        </View>

        <View className="mb-6">
          <Text className="text-muted text-sm font-bold mb-2">로스터리</Text>
          <TextInput
            className="bg-surface text-white px-5 py-4 rounded-xl border border-white/10 font-bold"
            placeholder="예: 프릳츠 커피 컴퍼니"
            placeholderTextColor="#737373"
            value={roaster}
            onChangeText={setRoaster}
          />
        </View>

        <View className="mb-8">
          <Text className="text-muted text-sm font-bold mb-3">별점</Text>
          <View className="flex-row gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => setRating(star)}>
                <Star
                  size={32}
                  color={rating >= star ? "#D4AF37" : "#333"}
                  fill={rating >= star ? "#D4AF37" : "transparent"}
                />
              </Pressable>
            ))}
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-muted text-sm font-bold mb-2">테이스팅 노트 (콤마로 구분)</Text>
          <TextInput
            className="bg-surface text-white px-5 py-4 rounded-xl border border-white/10 font-bold"
            placeholder="예: 베리류, 꿀, 부드러운 산미"
            placeholderTextColor="#737373"
            value={tags}
            onChangeText={setTags}
          />
        </View>

        <View className="mb-10">
          <Text className="text-muted text-sm font-bold mb-3">다시 구매하시겠습니까?</Text>
          <View className="flex-row gap-3">
            <Pressable 
              className={`flex-1 py-3 rounded-xl border items-center ${repurchase === 'yes' ? 'bg-primary-amber/20 border-primary-amber' : 'bg-surface border-white/10'}`}
              onPress={() => setRepurchase('yes')}
            >
              <Text className={repurchase === 'yes' ? 'text-primary-amber font-bold' : 'text-muted font-bold'}>👍 무조건</Text>
            </Pressable>
            <Pressable 
              className={`flex-1 py-3 rounded-xl border items-center ${repurchase === 'maybe' ? 'bg-white/20 border-white' : 'bg-surface border-white/10'}`}
              onPress={() => setRepurchase('maybe')}
            >
              <Text className={repurchase === 'maybe' ? 'text-white font-bold' : 'text-muted font-bold'}>🤔 고민됨</Text>
            </Pressable>
            <Pressable 
              className={`flex-1 py-3 rounded-xl border items-center ${repurchase === 'no' ? 'bg-red-500/20 border-red-500' : 'bg-surface border-white/10'}`}
              onPress={() => setRepurchase('no')}
            >
              <Text className={repurchase === 'no' ? 'text-red-500 font-bold' : 'text-muted font-bold'}>👎 아니요</Text>
            </Pressable>
          </View>
        </View>

      </ScrollView>

      <View className="p-4 border-t border-white/5 bg-background">
        <Pressable 
          className="bg-primary-amber py-4 rounded-xl items-center flex-row justify-center gap-2"
          onPress={() => {
            
            Alert.alert('저장 완료', '테이스팅 기록이 저장되었습니다.', [
              { text: '확인', onPress: () => router.replace('/(tabs)') }
            ]);
          }}
        >
          <Check color="#000" size={20} />
          <Text className="text-black font-extrabold text-lg">기록 저장하기</Text>
        </Pressable>
      </View>
    </View>
  );
}
