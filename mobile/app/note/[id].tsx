import React, { useCallback, useState } from 'react';
import { ActivityIndicator, View, Text, ScrollView, Pressable } from 'react-native';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Archive, Calendar, LockKeyhole, Pencil, SlidersHorizontal, Trash2 } from 'lucide-react-native';
import { useCoffeeNote, useDeleteCoffeeNote } from '../../hooks/useCoffeeNotes';
import { getNoteSubtitle, getNoteTitle, getRepurchaseLabel } from '../../lib/coffee-notes';
import { ROOM_COLORS } from '../../lib/theme';

export default function NoteDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const noteId = Array.isArray(id) ? id[0] : id;
  const { data: note, isLoading } = useCoffeeNote(noteId ?? '');
  const deleteNote = useDeleteCoffeeNote();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setIsConfirmingDelete(false);
        setDeleteError(null);
      };
    }, []),
  );

  async function handleDelete() {
    if (!noteId || deleteNote.isPending) {
      return;
    }

    if (!isConfirmingDelete) {
      setDeleteError(null);
      setIsConfirmingDelete(true);
      return;
    }

    try {
      await deleteNote.mutateAsync(noteId);
      router.replace('/(tabs)/passport');
    } catch (error) {
      if (error instanceof Error) {
        setIsConfirmingDelete(false);
        setDeleteError('삭제하지 못했습니다. 다시 시도해 주세요.');
        return;
      }
      throw error;
    }
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={ROOM_COLORS.clay} size="large" />
        <Text className="mt-3 text-sm font-bold text-muted">노트를 여는 중입니다.</Text>
      </View>
    );
  }

  if (!note) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="w-full max-w-xl self-center px-5 pt-2">
          <Pressable
            onPress={() => router.back()}
            className="h-11 w-11 items-center justify-center rounded-full border border-room-espresso/10 bg-room-paper"
            accessibilityLabel="뒤로가기"
            accessibilityRole="button"
          >
            <ArrowLeft color={ROOM_COLORS.espresso} size={20} />
          </Pressable>
          <View className="mt-10 rounded-[1.5rem] border border-room-espresso/10 bg-room-paper p-6">
            <Text className="text-lg font-black text-room-espresso">노트를 찾지 못했습니다.</Text>
            <Text className="mt-2 text-sm font-semibold leading-6 text-muted">삭제됐거나 다른 기기에서 만든 노트일 수 있습니다.</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const createdAt = new Date(note.createdAt);
  const createdLabel = Number.isNaN(createdAt.getTime())
    ? '날짜 미정'
    : `${createdAt.getFullYear()}.${String(createdAt.getMonth() + 1).padStart(2, '0')}.${String(createdAt.getDate()).padStart(2, '0')}`;
  const deleteAccessibilityLabel = deleteNote.isPending
    ? '노트 삭제 중'
    : isConfirmingDelete
      ? '노트 삭제 확인'
      : '노트 삭제';

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="w-full max-w-xl self-center flex-row items-center px-5 pb-4 pt-2">
        <Pressable
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full border border-room-espresso/10 bg-room-paper"
          accessibilityLabel="뒤로가기"
          accessibilityRole="button"
        >
          <ArrowLeft color={ROOM_COLORS.espresso} size={20} />
        </Pressable>
        <View className="flex-1 items-center px-3">
          <Text className="text-base font-black text-room-espresso">Coffee Note</Text>
          <Text className="mt-0.5 text-[11px] font-bold text-room-clay">{createdLabel}</Text>
        </View>
        <Pressable
          onPress={() => router.push(`/note/create?editId=${encodeURIComponent(note.id)}`)}
          className="h-11 w-11 items-center justify-center rounded-full border border-room-espresso/10 bg-room-paper"
          accessibilityLabel="노트 수정"
          accessibilityRole="button"
        >
          <Pencil color={ROOM_COLORS.cocoa} size={18} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="w-full max-w-xl self-center pb-16 pt-2"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-5 items-center px-4">
          <Text className="break-keep text-center text-[26px] font-extrabold leading-8 text-room-espresso">
            {getNoteTitle(note)}
          </Text>
          <Text className="mt-2 break-keep text-center text-sm font-bold text-muted">{getNoteSubtitle(note)}</Text>
        </View>

        <View
          className="mb-5 min-h-64 items-center justify-center rounded-[2rem] border border-room-espresso/10 bg-room-paper px-6 py-9"
          testID="note-detail-hero"
        >
          <View className="mb-5 h-16 w-16 items-center justify-center rounded-full bg-room-linen">
            <SlidersHorizontal color={ROOM_COLORS.clay} size={30} />
          </View>
          <Text className="text-xs font-black tracking-[0.18em] text-room-clay">느낌</Text>
          <Text className="mt-2 text-5xl font-black tracking-tight text-room-espresso">{note.rating} / 5</Text>
          <Text className="mt-4 break-keep text-center text-sm font-semibold leading-6 text-room-cocoa">
            이 컵을 다시 떠올릴 때 가장 먼저 꺼낼 인상입니다.
          </Text>
        </View>

        <View
          className="mb-4 rounded-[1.5rem] border border-room-espresso/10 bg-room-paper p-5"
          testID="note-detail-memory"
        >
          <View className="mb-3 flex-row items-center gap-2">
            <LockKeyhole color={ROOM_COLORS.clay} size={18} />
            <Text className="text-sm font-black text-room-espresso">내 문장</Text>
          </View>
          <Text className="break-keep text-lg font-extrabold leading-8 text-room-espresso">
            {note.memory || '메모 없이 저장한 컵입니다.'}
          </Text>
        </View>

        <View className="mb-5 flex-row flex-wrap justify-center gap-2">
          {[getNoteTitle(note), '비공개 기록', `느낌 ${note.rating}`].map((tag) => (
            <View key={tag} className="min-h-11 justify-center rounded-full border border-room-espresso/10 bg-room-paper px-4">
              <Text className="font-bold text-room-espresso">{tag}</Text>
            </View>
          ))}
        </View>

        <View
          className="mb-7 flex-row rounded-[1.5rem] border border-room-espresso/10 bg-room-paper px-2 py-5"
          testID="note-detail-facts"
        >
          <View className="flex-1 items-center border-r border-room-espresso/10 px-2">
            <Archive color={ROOM_COLORS.cocoa} size={20} />
            <Text className="mt-3 text-xs font-black text-muted">로스터리</Text>
            <Text className="mt-1 break-keep text-center text-xs font-black leading-5 text-room-espresso">
              {getNoteSubtitle(note)}
            </Text>
          </View>
          <View className="flex-1 items-center border-r border-room-espresso/10 px-2">
            <Calendar color={ROOM_COLORS.cocoa} size={20} />
            <Text className="mt-3 text-xs font-black text-muted">기록일</Text>
            <Text className="mt-1 text-center text-xs font-black leading-5 text-room-espresso">
              {createdLabel}
            </Text>
          </View>
          <View className="flex-1 items-center px-2">
            <LockKeyhole color={ROOM_COLORS.clay} size={20} />
            <Text className="mt-3 text-xs font-black text-muted">재구매</Text>
            <Text className="mt-1 break-keep text-center text-xs font-black leading-5 text-room-clay">
              {getRepurchaseLabel(note.repurchase)}
            </Text>
          </View>
        </View>

        <View className="mb-6 flex-row gap-3">
          <Pressable
            className="min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-full bg-room-soil px-5"
            onPress={() => router.push(`/note/create?editId=${encodeURIComponent(note.id)}`)}
            accessibilityLabel="노트 수정"
            accessibilityRole="button"
          >
            <Pencil color={ROOM_COLORS.paper} size={18} />
            <Text className="font-black text-room-paper">수정</Text>
          </Pressable>
          <Pressable
            className={`min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-full border px-5 ${
              isConfirmingDelete
                ? 'border-room-clay/40 bg-room-paper'
                : 'border-room-espresso/10 bg-room-paper'
            }`}
            onPress={handleDelete}
            disabled={deleteNote.isPending}
            accessibilityLabel={deleteAccessibilityLabel}
            accessibilityHint={isConfirmingDelete ? '한 번 더 누르면 노트가 삭제됩니다.' : '삭제 확인 단계로 이동합니다.'}
            accessibilityRole="button"
            accessibilityState={{ disabled: deleteNote.isPending, busy: deleteNote.isPending }}
          >
            <Trash2 color={ROOM_COLORS.clay} size={18} />
            <Text className="font-black text-room-clay">
              {deleteNote.isPending ? '삭제 중' : isConfirmingDelete ? '한 번 더' : '삭제'}
            </Text>
          </Pressable>
        </View>

        {deleteError ? (
          <View
            className="mb-6 rounded-[1.25rem] border border-room-clay/30 bg-room-paper p-4"
            accessibilityLiveRegion="polite"
            testID="note-delete-error"
          >
            <Text className="break-keep text-sm font-bold text-room-espresso">{deleteError}</Text>
          </View>
        ) : null}

        <View className="mb-4 items-center">
          <Text className="text-center text-xs font-bold text-muted">저장됨: {createdLabel}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
