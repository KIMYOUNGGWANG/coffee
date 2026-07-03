import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Archive, NotebookPen, PenLine } from "lucide-react-native";
import { useTastingCards } from "../../hooks/useTastingCards";
import { TastingCard } from "../../components/TastingCard";

export default function HomeScreen() {
  const { data: cards, isLoading, error } = useTastingCards();

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pb-36 pt-14">
      <View className="mb-6 flex-row items-center justify-between">
        <View>
          <Text className="text-xs font-bold text-muted">오늘</Text>
          <Text className="mt-1 text-[26px] font-bold text-room-espresso">마신 커피</Text>
        </View>
        <View className="h-10 w-10 items-center justify-center rounded-full border border-[#2A1A12]/15 bg-room-paper">
          <Text className="text-sm font-extrabold text-room-espresso">김</Text>
        </View>
      </View>

      {cards && cards.length > 0 ? (
        <View className="mb-4 rounded-[1.5rem] border border-[#2A1A12]/10 bg-room-paper p-4">
          <Text className="mb-3 text-xs font-bold text-muted">방금 남긴 컵</Text>
          <View className="flex-row items-center gap-3">
            <Image
              source={require("../../assets/coffee-room.png")}
              className="rounded-2xl"
              resizeMode="cover"
              style={{ height: 72, width: 72 }}
            />
            <View className="min-w-0 flex-1">
              <Text className="text-base font-bold text-room-espresso" numberOfLines={1}>{cards[0].title}</Text>
              <Text className="mt-1 text-sm font-semibold text-muted" numberOfLines={2}>
                {cards[0].subtitle} · {cards[0].repurchaseLabel}
              </Text>
            </View>
          </View>
        </View>
      ) : null}

      <View className="mb-5 gap-3">
        <Pressable
          onPress={() => router.push("/note/create")}
          className="min-h-14 flex-row items-center justify-between rounded-[1.35rem] bg-room-soil px-4"
        >
          <View className="flex-row items-center gap-3">
            <PenLine color="#FFF8EC" size={20} />
            <Text className="text-base font-bold text-room-paper">노트 쓰기</Text>
          </View>
          <Text className="text-sm font-bold text-room-paper/65">1분</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/(tabs)/passport")}
          className="min-h-14 flex-row items-center justify-between rounded-[1.35rem] border border-[#2A1A12]/10 bg-room-paper px-4"
        >
          <View className="flex-row items-center gap-3">
            <Archive color="#654D3D" size={20} />
            <Text className="text-base font-bold text-room-espresso">원두 서랍</Text>
          </View>
          <Text className="text-sm font-bold text-muted">{cards?.length ?? 0}개</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View className="items-center justify-center rounded-[1.5rem] bg-room-paper p-8">
          <ActivityIndicator color="#BD7650" size="large" />
          <Text className="mt-3 text-sm font-bold text-muted">노트를 불러오는 중입니다.</Text>
        </View>
      ) : error ? (
        <View className="rounded-[1.5rem] border border-[#BD7650]/20 bg-room-paper p-5">
          <Text className="text-sm font-black text-room-espresso">기록을 불러오지 못했습니다.</Text>
          <Text className="mt-2 text-xs font-semibold leading-5 text-muted">연결을 확인한 뒤 다시 열어주세요.</Text>
        </View>
      ) : (
        <View>
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-room-espresso">최근 노트</Text>
            <NotebookPen color="#8F7867" size={20} />
          </View>
          {cards && cards.length > 0 ? (
            cards.slice(0, 3).map((item) => (
              <TastingCard
                key={item.id}
                id={item.id}
                title={item.title}
                subtitle={item.subtitle}
                repurchaseLabel={item.repurchaseLabel}
              />
            ))
          ) : (
            <Pressable
              className="items-center justify-center rounded-[1.5rem] border border-[#2A1A12]/10 bg-room-paper p-8"
              onPress={() => router.push('/note/create')}
            >
              <Text className="text-center text-base font-black text-room-espresso">아직 노트가 없습니다.</Text>
              <Text className="mt-2 text-center text-sm font-bold text-muted">마신 커피를 짧게 적어보세요.</Text>
            </Pressable>
          )}
        </View>
      )}
    </ScrollView>
  );
}
