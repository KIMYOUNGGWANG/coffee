import { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Archive, LockKeyhole, PenLine, Star } from "lucide-react-native";
import { useCoffeeNotes } from "../../hooks/useCoffeeNotes";
import { getNoteSubtitle, getNoteTitle, getRepurchaseLabel, RepurchaseStatus } from "../../lib/coffee-notes";

type DrawerFilter = 'all' | RepurchaseStatus;

const drawerFilters: { value: DrawerFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'yes', label: '다시 살래요' },
  { value: 'maybe', label: '보류' },
  { value: 'no', label: '그냥 기록' },
];

export default function PassportScreen() {
  const { data: notes } = useCoffeeNotes();
  const [filter, setFilter] = useState<DrawerFilter>('all');
  const savedNotes = notes ?? [];
  const visibleNotes = filter === 'all'
    ? savedNotes
    : savedNotes.filter((note) => note.repurchase === filter);
  const rebuyCount = savedNotes.filter((note) => note.repurchase === 'yes').length;
  const latestCue = savedNotes.find((note) => note.memory.trim())?.memory.trim();
  const monthlySummary = savedNotes.length === 0
    ? '첫 노트를 남기면 여기에 요약됩니다.'
    : rebuyCount > 0
      ? `${rebuyCount}개는 다시 살 원두로 남겼어요.`
      : '다시 살 원두는 아직 없어요.';

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pb-32 pt-16">
      <View className="mb-5 flex-row items-center justify-between">
        <View className="h-10 w-10 items-center justify-center rounded-full border border-[#2A1A12]/20 bg-room-paper">
          <Text className="font-black text-room-espresso">향</Text>
        </View>
        <View className="rounded-full border border-[#2A1A12]/10 bg-room-paper px-3 py-2">
          <Text className="text-xs font-black text-room-cocoa">원두 서랍 {savedNotes.length}개</Text>
        </View>
      </View>

      <Text className="mb-4 text-[26px] font-bold leading-8 text-room-espresso">
        원두 서랍
      </Text>

      {savedNotes.length > 0 ? (
        <ScrollView
          className="mb-4 -mx-5"
          contentContainerClassName="gap-2 px-5"
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {drawerFilters.map((item) => {
            const active = filter === item.value;
            return (
              <Pressable
                key={item.value}
                className={`min-h-11 justify-center rounded-full border px-4 ${
                  active ? 'border-room-soil bg-room-soil' : 'border-[#2A1A12]/10 bg-room-paper'
                }`}
                onPress={() => setFilter(item.value)}
              >
                <Text className={`text-sm font-black ${active ? 'text-room-paper' : 'text-room-espresso'}`}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      {visibleNotes.length > 0 ? (
        <View className="mb-5 gap-3">
          {visibleNotes.map((note, index) => (
            <Pressable
              key={note.id}
              className="flex-row items-center gap-3 rounded-[1.35rem] border border-[#2A1A12]/10 bg-room-paper p-3"
              onPress={() => router.push(`/note/${encodeURIComponent(note.id)}`)}
            >
              <Image
                source={index % 2 === 0 ? require("../../assets/coffee-bag.png") : require("../../assets/coffee-room.png")}
                className="rounded-2xl"
                resizeMode="cover"
                style={{ height: 56, width: 56 }}
              />
              <View className="min-w-0 flex-1">
                <Text className="text-base font-bold text-room-espresso" numberOfLines={1}>{getNoteTitle(note)}</Text>
                <Text className="mt-1 text-xs font-bold text-muted" numberOfLines={1}>{getNoteSubtitle(note)}</Text>
              </View>
              <Text className="text-xs font-black text-room-clay">{getRepurchaseLabel(note.repurchase)}</Text>
            </Pressable>
          ))}
        </View>
      ) : savedNotes.length > 0 ? (
        <View className="mb-5 rounded-[1.5rem] border border-[#2A1A12]/10 bg-room-paper p-6">
          <Text className="text-sm font-black text-room-espresso">이 상태의 원두는 없습니다.</Text>
          <Text className="mt-2 break-keep text-sm font-semibold leading-6 text-muted">
            다른 필터를 눌러보세요.
          </Text>
        </View>
      ) : (
        <Pressable
          className="mb-5 rounded-[1.5rem] border border-[#2A1A12]/10 bg-room-paper p-6"
          onPress={() => router.push('/note/create')}
        >
          <View className="mb-3 flex-row items-center gap-2">
            <PenLine color="#BD7650" size={18} />
            <Text className="text-sm font-black text-room-espresso">아직 비어 있어요</Text>
          </View>
          <Text className="break-keep text-sm font-semibold leading-6 text-muted">
            오늘 마신 커피를 저장하면 이곳에 원두가 쌓입니다.
          </Text>
        </Pressable>
      )}

      <View className="rounded-[1.5rem] bg-room-soil p-5">
        <View className="mb-3 flex-row items-center gap-2">
          <LockKeyhole color="#FFF8EC" size={18} />
          <Text className="text-sm font-black text-room-paper">내 서랍은 기본 비공개</Text>
        </View>
        <Text className="text-sm font-semibold leading-6 text-room-paper/75">
          원두와 메모는 기본으로 비공개입니다. 공유는 필요할 때만 켭니다.
        </Text>
      </View>

      <View className="mt-5 rounded-[1.5rem] border border-[#2A1A12]/10 bg-room-paper p-5">
        <View className="mb-4 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Archive color="#BD7650" size={19} />
          <Text className="text-sm font-black text-room-espresso">이번 달 메모</Text>
          </View>
          <Star color="#BD7650" size={18} />
        </View>
        <Text className="text-lg font-bold leading-7 text-room-espresso">
          {monthlySummary}
        </Text>
        {latestCue ? (
          <Text className="mt-2 text-sm font-semibold leading-6 text-muted" numberOfLines={2}>{latestCue}</Text>
        ) : null}
      </View>
    </ScrollView>
  );
}
