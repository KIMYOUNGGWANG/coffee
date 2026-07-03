import { useCoffeeNotes } from './useCoffeeNotes';
import { getNoteSubtitle, getNoteTitle, getRepurchaseLabel } from '../lib/coffee-notes';

export function useTastingCards() {
  const query = useCoffeeNotes();

  return {
    ...query,
    data: query.data?.map((note) => ({
      id: note.id,
      title: getNoteTitle(note),
      subtitle: getNoteSubtitle(note),
      rating: note.rating,
      repurchaseLabel: getRepurchaseLabel(note.repurchase),
      createdAt: note.createdAt,
    })),
  };
}
