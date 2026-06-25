import { View, Text, ActivityIndicator, FlatList } from "react-native";
import { router } from "expo-router";
import { useTastingCards } from "../../hooks/useTastingCards";
import { TastingCard } from "../../components/TastingCard";

export default function HomeScreen() {
  const { data: cards, isLoading, error } = useTastingCards();

  return (
    <View className="flex-1 bg-background pt-16 px-4">
      <View className="mb-6">
        <Text className="text-white text-3xl font-serif font-black tracking-tight">당신의 테이스팅 진열장</Text>
        <Text className="text-primary-amber mt-1 text-sm font-bold">Ultra-Premium Collection</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#D4AF37" size="large" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-red-500">데이터를 불러오는 중 오류가 발생했습니다.</Text>
        </View>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TastingCard title={item.title} subtitle={item.subtitle} />
          )}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="mt-10 items-center justify-center p-8 bg-surface rounded-3xl border border-white/5">
              <Text className="text-muted text-center mb-2">아직 기록된 커피가 없습니다.</Text>
              <Text 
                className="text-primary-amber text-center font-bold"
                onPress={() => router.push('/note/create')}
              >+ 새로운 기록 추가하기</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
