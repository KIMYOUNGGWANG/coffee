import AsyncStorage from '@react-native-async-storage/async-storage';

export type RepurchaseStatus = 'yes' | 'maybe' | 'no';

export interface CoffeeNote {
  id: string;
  memory: string;
  coffeeName: string;
  roaster: string;
  rating: number;
  repurchase: RepurchaseStatus;
  createdAt: string;
}

export interface CoffeeNoteInput {
  memory: string;
  coffeeName: string;
  roaster: string;
  rating: number;
  repurchase: RepurchaseStatus;
}

const STORAGE_KEY = '@coffeedex/coffee-notes/v1';

function normalizeNote(input: CoffeeNoteInput): CoffeeNote {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    memory: input.memory.trim(),
    coffeeName: input.coffeeName.trim(),
    roaster: input.roaster.trim(),
    rating: input.rating,
    repurchase: input.repurchase,
    createdAt: new Date().toISOString(),
  };
}

function sortNotes(notes: CoffeeNote[]) {
  return notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function listCoffeeNotes(): Promise<CoffeeNote[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  const parsed = JSON.parse(raw) as CoffeeNote[];
  return sortNotes(parsed);
}

export async function getCoffeeNote(id: string): Promise<CoffeeNote | null> {
  const notes = await listCoffeeNotes();
  return notes.find((note) => note.id === id) ?? null;
}

export async function createCoffeeNote(input: CoffeeNoteInput): Promise<CoffeeNote> {
  const notes = await listCoffeeNotes();
  const note = normalizeNote(input);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([note, ...notes]));
  return note;
}

export async function updateCoffeeNote(id: string, input: CoffeeNoteInput): Promise<CoffeeNote> {
  const notes = await listCoffeeNotes();
  const existing = notes.find((note) => note.id === id);

  if (!existing) {
    throw new Error('note_not_found');
  }

  const updated: CoffeeNote = {
    ...existing,
    memory: input.memory.trim(),
    coffeeName: input.coffeeName.trim(),
    roaster: input.roaster.trim(),
    rating: input.rating,
    repurchase: input.repurchase,
  };

  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(notes.map((note) => (note.id === id ? updated : note))),
  );
  return updated;
}

export async function deleteCoffeeNote(id: string): Promise<void> {
  const notes = await listCoffeeNotes();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes.filter((note) => note.id !== id)));
}

export function getNoteTitle(note: CoffeeNote) {
  return note.coffeeName || '이름 없는 컵';
}

export function getNoteSubtitle(note: CoffeeNote) {
  return note.roaster || '로스터리 미정';
}

export function getRepurchaseLabel(status: RepurchaseStatus) {
  switch (status) {
    case 'yes':
      return '다시 살래요';
    case 'maybe':
      return '보류';
    case 'no':
      return '그냥 기록';
  }
}
