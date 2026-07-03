import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Archive, Check, Coffee, PenLine, SlidersHorizontal } from 'lucide-react-native';
import { RepurchaseStatus } from '../../lib/coffee-notes';
import { useCoffeeNote, useCreateCoffeeNote, useUpdateCoffeeNote } from '../../hooks/useCoffeeNotes';

export default function CreateNoteScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams();
  const noteId = Array.isArray(editId) ? editId[0] : editId;
  const [coffeeName, setCoffeeName] = useState('');
  const [roaster, setRoaster] = useState('');
  const [rating, setRating] = useState(4);
  const [memory, setMemory] = useState('');
  const [repurchase, setRepurchase] = useState<RepurchaseStatus>('maybe');
  const [saveError, setSaveError] = useState<string | null>(null);
  const { data: editNote } = useCoffeeNote(noteId ?? '');
  const createNote = useCreateCoffeeNote();
  const updateNote = useUpdateCoffeeNote();
  const isEditing = Boolean(noteId);
  const isSaving = createNote.isPending || updateNote.isPending;
  const hasDraft = Boolean(coffeeName.trim() || roaster.trim() || memory.trim());

  useEffect(() => {
    if (!editNote) {
      return;
    }

    setCoffeeName(editNote.coffeeName);
    setRoaster(editNote.roaster);
    setRating(editNote.rating);
    setMemory(editNote.memory);
    setRepurchase(editNote.repurchase);
  }, [editNote]);

  async function handleSave() {
    if (!hasDraft || isSaving) {
      setSaveError('한 줄이라도 적어야 저장할 수 있습니다.');
      return;
    }

    setSaveError(null);
    try {
      const input = {
        memory,
        coffeeName,
        roaster,
        rating,
        repurchase,
      };
      const note = isEditing && noteId
        ? await updateNote.mutateAsync({ id: noteId, input })
        : await createNote.mutateAsync(input);
      router.replace(`/note/${encodeURIComponent(note.id)}`);
    } catch {
      setSaveError('저장하지 못했습니다. 다시 시도해 주세요.');
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-1 pt-14">
        <View className="flex-row items-center justify-between px-5 pb-3">
          <Pressable
            onPress={() => router.back()}
            className="h-11 w-11 items-center justify-center rounded-full border border-[#2A1A12]/10 bg-room-paper"
          >
            <ArrowLeft color="#2A1A12" size={20} />
          </Pressable>
          <View className="rounded-full border border-[#2A1A12]/10 bg-room-paper px-3 py-2">
            <Text className="text-xs font-black text-room-cocoa">{isEditing ? '노트 수정' : '새 노트'}</Text>
          </View>
        </View>

        <ScrollView className="flex-1 px-5" contentContainerClassName="pb-44 pt-2">
          <View className="mb-5">
            <Text className="break-keep text-[26px] font-bold leading-8 text-room-espresso">
              {isEditing ? '노트 수정' : '새 노트'}
            </Text>
            <Text className="mt-2 break-keep text-sm font-semibold leading-6 text-room-cocoa">
              {isEditing ? '바뀐 기억만 고쳐도 됩니다.' : '생각나는 말부터 적어도 됩니다.'}
            </Text>
          </View>

          <View className="mb-4 rounded-[1.5rem] border border-[#2A1A12]/10 bg-room-paper p-5">
            <View className="mb-4 flex-row items-center gap-2">
              <PenLine color="#BD7650" size={20} />
              <Text className="text-sm font-black text-room-espresso">메모</Text>
            </View>
            <TextInput
              className="min-h-32 rounded-[1.25rem] border border-[#2A1A12]/10 bg-background px-4 py-4 text-base font-semibold leading-7 text-room-espresso"
              placeholder="예: 식으니까 더 편했다."
              placeholderTextColor="#8F7867"
              value={memory}
              onChangeText={setMemory}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View className="mb-4 rounded-[1.5rem] border border-[#2A1A12]/10 bg-room-paper p-5">
            <View className="mb-4 flex-row items-center gap-2">
              <Coffee color="#BD7650" size={20} />
              <Text className="text-sm font-black text-room-espresso">이름</Text>
            </View>
            <View className="gap-3">
              <TextInput
                className="min-h-14 rounded-2xl border border-[#2A1A12]/10 bg-background px-4 font-bold text-room-espresso"
                placeholder="원두 이름"
                placeholderTextColor="#8F7867"
                value={coffeeName}
                onChangeText={setCoffeeName}
              />
              <TextInput
                className="min-h-14 rounded-2xl border border-[#2A1A12]/10 bg-background px-4 font-bold text-room-espresso"
                placeholder="로스터리"
                placeholderTextColor="#8F7867"
                value={roaster}
                onChangeText={setRoaster}
              />
            </View>
          </View>

          <View className="mb-4 rounded-[1.5rem] border border-[#2A1A12]/10 bg-room-paper p-5">
            <View className="mb-4 flex-row items-center gap-2">
              <SlidersHorizontal color="#BD7650" size={20} />
              <Text className="text-sm font-black text-room-espresso">느낌</Text>
            </View>
            <View className="flex-row gap-2">
              {[1, 2, 3, 4, 5].map((score) => (
                <Pressable
                  key={score}
                  onPress={() => setRating(score)}
                  className={`h-12 flex-1 items-center justify-center rounded-2xl border ${
                    rating >= score ? 'border-room-soil bg-room-soil' : 'border-[#2A1A12]/10 bg-background'
                  }`}
                >
                  <Text className={`font-black ${rating >= score ? 'text-room-paper' : 'text-muted'}`}>
                    {score}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text className="mt-3 text-xs font-bold text-muted">
              나중에 비교하려고 남기는 정도입니다.
            </Text>
          </View>

          <View className="mb-5 rounded-[1.5rem] bg-room-soil p-5">
            <View className="mb-4 flex-row items-center gap-2">
              <Archive color="#FFF8EC" size={20} />
              <Text className="text-sm font-black text-room-paper">다시 살까요?</Text>
            </View>
            <View className="gap-3">
              {[
                { value: 'yes' as const, label: '다시 살래요', detail: '다음에도 먼저 찾을 컵' },
                { value: 'maybe' as const, label: '고민 중', detail: '기억은 남기고 조금 더 보기' },
                { value: 'no' as const, label: '그냥 기록', detail: '오늘의 장면으로만 보관' },
              ].map((item) => (
                <Pressable
                  key={item.value}
                  className={`min-h-16 rounded-2xl border px-4 py-3 ${
                    repurchase === item.value
                      ? 'border-room-paper bg-room-paper'
                      : 'border-room-paper/20 bg-room-paper/10'
                  }`}
                  onPress={() => setRepurchase(item.value)}
                >
                  <Text className={`text-base font-black ${repurchase === item.value ? 'text-room-espresso' : 'text-room-paper'}`}>
                    {item.label}
                  </Text>
                  <Text className={`mt-1 text-xs font-bold ${repurchase === item.value ? 'text-muted' : 'text-room-paper/65'}`}>
                    {item.detail}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View className="mb-8 rounded-[1.5rem] border border-[#2A1A12]/10 bg-room-paper p-5">
            <Text className="text-xs font-black text-muted">미리보기</Text>
            <Text className="mt-2 break-keep text-lg font-bold leading-7 text-room-espresso">
              {memory || '아직 문장이 비어 있어요.'}
            </Text>
            <Text className="mt-3 text-sm font-bold text-muted">
              {[coffeeName || '이름 없는 컵', roaster || '로스터리 미정'].join(' · ')}
            </Text>
          </View>

          {saveError ? (
            <View className="mb-8 rounded-[1.25rem] border border-[#BD7650]/30 bg-room-paper p-4">
              <Text className="text-sm font-bold text-room-espresso">{saveError}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View className="border-t border-[#2A1A12]/10 bg-background px-5 pb-5 pt-3">
          <Pressable
            className={`min-h-14 flex-row items-center justify-center gap-2 rounded-full ${
              hasDraft ? 'bg-room-soil' : 'bg-room-cocoa'
            }`}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Check color="#FFF8EC" size={20} />
            <Text className="text-lg font-extrabold text-room-paper">
              {isSaving ? '저장 중' : '저장'}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
