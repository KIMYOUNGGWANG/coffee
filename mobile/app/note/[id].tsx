import React, { useState } from 'react';
import { ActivityIndicator, View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Calendar, Coffee, Pencil, Tag, Trash2, LockKeyhole } from 'lucide-react-native';
import { useCoffeeNote, useDeleteCoffeeNote } from '../../hooks/useCoffeeNotes';
import { getNoteSubtitle, getNoteTitle, getRepurchaseLabel } from '../../lib/coffee-notes';

export default function NoteDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const noteId = Array.isArray(id) ? id[0] : id;
  const { data: note, isLoading } = useCoffeeNote(noteId ?? '');
  const deleteNote = useDeleteCoffeeNote();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  async function handleDelete() {
    if (!noteId || deleteNote.isPending) {
      return;
    }

    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true);
      return;
    }

    await deleteNote.mutateAsync(noteId);
    router.replace('/(tabs)/passport');
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#BD7650" size="large" />
        <Text className="mt-3 text-sm font-bold text-muted">노트를 여는 중입니다.</Text>
      </View>
    );
  }

  if (!note) {
    return (
      <View className="flex-1 bg-background px-5 pt-16">
        <Pressable
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full border border-[#2A1A12]/10 bg-room-paper"
        >
          <ArrowLeft color="#2A1A12" size={20} />
        </Pressable>
        <View className="mt-10 rounded-[1.5rem] border border-[#2A1A12]/10 bg-room-paper p-6">
          <Text className="text-lg font-black text-room-espresso">노트를 찾지 못했습니다.</Text>
          <Text className="mt-2 text-sm font-semibold leading-6 text-muted">삭제됐거나 다른 기기에서 만든 노트일 수 있습니다.</Text>
        </View>
      </View>
    );
  }

  const createdAt = new Date(note.createdAt);
  const createdLabel = `${createdAt.getFullYear()}.${String(createdAt.getMonth() + 1).padStart(2, '0')}.${String(createdAt.getDate()).padStart(2, '0')}`;

  return (
    <View className="flex-1 bg-background pt-16">
      <View className="flex-row items-center justify-between px-5 pb-4">
        <Pressable
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full border border-[#2A1A12]/10 bg-room-paper"
        >
          <ArrowLeft color="#2A1A12" size={20} />
        </Pressable>
        <View className="rounded-full border border-[#2A1A12]/10 bg-room-paper px-3 py-2">
          <Text className="text-xs font-black text-room-cocoa">비공개 노트</Text>
        </View>
        <Pressable
          onPress={() => router.push(`/note/create?editId=${encodeURIComponent(note.id)}`)}
          className="h-11 w-11 items-center justify-center rounded-full border border-[#2A1A12]/10 bg-room-paper"
          accessibilityLabel="노트 수정"
        >
          <Pencil color="#493024" size={18} />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-5 pt-2" contentContainerClassName="pb-32">
        <View className="mb-8">
          <Text className="mb-2 text-xs font-black text-room-clay">{getNoteSubtitle(note)}</Text>
          <Text className="break-keep text-2xl font-extrabold leading-8 text-room-espresso">
            {getNoteTitle(note)}
          </Text>
          <View className="mt-4 flex-row items-center gap-2">
            <View className="rounded-full bg-room-soil px-3 py-2">
              <Text className="text-xs font-black text-room-paper">느낌 {note.rating}</Text>
            </View>
            <View className="rounded-full border border-[#2A1A12]/10 bg-room-paper px-3 py-2">
              <Text className="text-xs font-black text-room-cocoa">{getRepurchaseLabel(note.repurchase)}</Text>
            </View>
          </View>
        </View>

        <View className="mb-5 rounded-[1.5rem] border border-[#2A1A12]/10 bg-room-paper p-5">
          <View className="mb-4 flex-row items-center gap-2">
            <LockKeyhole color="#BD7650" size={18} />
            <Text className="text-sm font-black text-room-espresso">내 문장</Text>
          </View>
          <Text className="break-keep text-lg font-extrabold leading-7 text-room-espresso">
            {note.memory || '메모 없이 저장한 컵입니다.'}
          </Text>
        </View>

        <View className="mb-6 flex-row flex-wrap gap-2">
          {[getNoteTitle(note), getNoteSubtitle(note), getRepurchaseLabel(note.repurchase)].map((tag) => (
            <View key={tag} className="rounded-full border border-[#2A1A12]/10 bg-room-paper px-4 py-2">
              <Text className="font-bold text-room-espresso">{tag}</Text>
            </View>
          ))}
        </View>

        <View className="mb-8 rounded-[1.5rem] border border-[#2A1A12]/10 bg-room-paper p-6">
          <View className="mb-5 flex-row items-center border-b border-[#2A1A12]/10 pb-5">
            <Coffee color="#654D3D" size={20} />
            <View className="ml-4">
              <Text className="mb-1 text-xs font-bold text-muted">원두</Text>
              <Text className="font-bold text-room-espresso">{getNoteTitle(note)}</Text>
            </View>
          </View>
          <View className="mb-5 flex-row items-center border-b border-[#2A1A12]/10 pb-5">
            <Calendar color="#654D3D" size={20} />
            <View className="ml-4">
              <Text className="mb-1 text-xs font-bold text-muted">기록일</Text>
              <Text className="font-bold text-room-espresso">{createdLabel}</Text>
            </View>
          </View>
          <View className="flex-row items-center">
            <Tag color="#654D3D" size={20} />
            <View className="ml-4">
              <Text className="mb-1 text-xs font-bold text-muted">재구매 의사</Text>
              <Text className="font-bold text-room-clay">{getRepurchaseLabel(note.repurchase)}</Text>
            </View>
          </View>
        </View>

        <View className="mb-5 flex-row gap-3">
          <Pressable
            className="min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-full bg-room-soil px-5"
            onPress={() => router.push(`/note/create?editId=${encodeURIComponent(note.id)}`)}
          >
            <Pencil color="#FFF8EC" size={18} />
            <Text className="font-black text-room-paper">수정</Text>
          </Pressable>
          <Pressable
            className={`min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-full border px-5 ${
              isConfirmingDelete
                ? 'border-[#BD7650]/40 bg-room-paper'
                : 'border-[#2A1A12]/10 bg-room-paper'
            }`}
            onPress={handleDelete}
            disabled={deleteNote.isPending}
          >
            <Trash2 color="#BD7650" size={18} />
            <Text className="font-black text-room-clay">
              {deleteNote.isPending ? '삭제 중' : isConfirmingDelete ? '한 번 더' : '삭제'}
            </Text>
          </Pressable>
        </View>

        <Text className="mb-20 text-center text-xs font-bold text-muted">저장됨: {createdLabel}</Text>
      </ScrollView>
    </View>
  );
}
