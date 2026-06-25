import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Star, Share, MapPin, Coffee, Tag } from 'lucide-react-native';

export default function NoteDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  // Mock Data
  const note = {
    title: '에티오피아 예가체프 아리차',
    subtitle: '프릳츠 커피 컴퍼니',
    rating: 4.5,
    taste_notes: ['베리류', '꽃향', '밝은 산미'],
    date: '2023.10.15',
    repurchase: 'yes',
    process: '내추럴',
    origin: '에티오피아 예가체프'
  };

  return (
    <View className="flex-1 bg-background pt-16">
      <View className="px-4 pb-4 flex-row items-center justify-between">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2 bg-white/10 rounded-full">
          <ArrowLeft color="#fff" size={20} />
        </Pressable>
        <Pressable className="p-2 -mr-2 bg-white/10 rounded-full">
          <Share color="#D4AF37" size={20} />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-4 pt-2">
        <View className="mb-8">
          <Text className="text-primary-amber font-bold tracking-widest text-xs mb-2 uppercase">{note.subtitle}</Text>
          <Text className="text-white text-3xl font-serif font-black tracking-tight mb-4">{note.title}</Text>
          
          <View className="flex-row items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={20}
                color={note.rating >= star ? "#D4AF37" : "#333"}
                fill={note.rating >= star ? "#D4AF37" : "transparent"}
              />
            ))}
            <Text className="text-white font-bold ml-2 text-lg">{note.rating.toFixed(1)}</Text>
          </View>
        </View>

        <View className="flex-row flex-wrap gap-2 mb-8">
          {note.taste_notes.map((tag, idx) => (
            <View key={idx} className="bg-surface border border-white/10 px-4 py-2 rounded-full">
              <Text className="text-white font-bold">{tag}</Text>
            </View>
          ))}
        </View>

        <View className="bg-surface rounded-3xl border border-white/5 p-6 mb-8 shadow-lg">
          <View className="flex-row items-center mb-5 pb-5 border-b border-white/5">
            <MapPin color="#737373" size={20} />
            <View className="ml-4">
              <Text className="text-muted text-xs mb-1">원산지</Text>
              <Text className="text-white font-bold">{note.origin}</Text>
            </View>
          </View>
          <View className="flex-row items-center mb-5 pb-5 border-b border-white/5">
            <Coffee color="#737373" size={20} />
            <View className="ml-4">
              <Text className="text-muted text-xs mb-1">가공방식</Text>
              <Text className="text-white font-bold">{note.process}</Text>
            </View>
          </View>
          <View className="flex-row items-center">
            <Tag color="#737373" size={20} />
            <View className="ml-4">
              <Text className="text-muted text-xs mb-1">재구매 의사</Text>
              <Text className="text-primary-amber font-bold">👍 무조건 다시 구매</Text>
            </View>
          </View>
        </View>

        <Text className="text-muted text-center text-xs mb-10">기록일: {note.date}</Text>
      </ScrollView>
    </View>
  );
}
