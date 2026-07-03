import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CoffeeNoteInput,
  createCoffeeNote,
  deleteCoffeeNote,
  getCoffeeNote,
  listCoffeeNotes,
  updateCoffeeNote,
} from '../lib/coffee-notes';

export const coffeeNotesQueryKey = ['coffee-notes'] as const;

export function useCoffeeNotes() {
  return useQuery({
    queryKey: coffeeNotesQueryKey,
    queryFn: listCoffeeNotes,
  });
}

export function useCoffeeNote(id: string) {
  return useQuery({
    queryKey: [...coffeeNotesQueryKey, id],
    queryFn: () => getCoffeeNote(id),
    enabled: Boolean(id),
  });
}

export function useCreateCoffeeNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CoffeeNoteInput) => createCoffeeNote(input),
    onSuccess: async (note) => {
      await queryClient.invalidateQueries({ queryKey: coffeeNotesQueryKey });
      queryClient.setQueryData([...coffeeNotesQueryKey, note.id], note);
    },
  });
}

export function useUpdateCoffeeNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CoffeeNoteInput }) => updateCoffeeNote(id, input),
    onSuccess: async (note) => {
      await queryClient.invalidateQueries({ queryKey: coffeeNotesQueryKey });
      queryClient.setQueryData([...coffeeNotesQueryKey, note.id], note);
    },
  });
}

export function useDeleteCoffeeNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCoffeeNote(id),
    onSuccess: async (_data, id) => {
      await queryClient.invalidateQueries({ queryKey: coffeeNotesQueryKey });
      queryClient.removeQueries({ queryKey: [...coffeeNotesQueryKey, id] });
    },
  });
}
