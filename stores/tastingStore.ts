import { create } from "zustand";

export interface TastingCardFormState {
  category: "coffee" | "beer" | "whiskey" | "wine";
  title: string;
  subtitle: string;
  imageUrl: string | null;
  badges: string[];
  metric1: number; // Coffee: Acidity (1-5)
  metric2: number; // Coffee: Sweetness (1-5)
  metric3: number; // Coffee: Body (1-5)
  tags: string[];
  rawNote: string;
  aiDescription: string;
  origin: string;
  date: string;
  extraInfo: string;
}

const initialFormState: TastingCardFormState = {
  category: "coffee",
  title: "",
  subtitle: "",
  imageUrl: null,
  badges: [],
  metric1: 3,
  metric2: 3,
  metric3: 3,
  tags: [],
  rawNote: "",
  aiDescription: "",
  origin: "",
  date: new Date().toISOString().split("T")[0],
  extraInfo: "",
};

interface TastingStore {
  // Wizard active step (e.g. 1: Basic info, 2: Taste metric sliders, 3: Tag selector, 4: Preview & AI Note)
  step: number;
  form: TastingCardFormState;
  isGeneratingAiNote: boolean;

  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateForm: (fields: Partial<TastingCardFormState>) => void;
  resetForm: () => void;
  setIsGeneratingAiNote: (isGenerating: boolean) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  addBadge: (badge: string) => void;
  removeBadge: (badge: string) => void;
}

export const useTastingStore = create<TastingStore>((set) => ({
  step: 1,
  form: initialFormState,
  isGeneratingAiNote: false,

  setStep: (step) => set({ step }),
  nextStep: () => set((state) => ({ step: Math.min(state.step + 1, 4) })),
  prevStep: () => set((state) => ({ step: Math.max(state.step - 1, 1) })),

  updateForm: (fields) =>
    set((state) => ({
      form: { ...state.form, ...fields },
    })),

  resetForm: () =>
    set({
      step: 1,
      form: {
        ...initialFormState,
        date: new Date().toISOString().split("T")[0],
      },
      isGeneratingAiNote: false,
    }),

  setIsGeneratingAiNote: (isGeneratingAiNote) => set({ isGeneratingAiNote }),

  addTag: (tag) =>
    set((state) => {
      if (state.form.tags.includes(tag)) return {};
      return { form: { ...state.form, tags: [...state.form.tags, tag] } };
    }),

  removeTag: (tag) =>
    set((state) => ({
      form: { ...state.form, tags: state.form.tags.filter((t) => t !== tag) },
    })),

  addBadge: (badge) =>
    set((state) => {
      if (state.form.badges.includes(badge)) return {};
      return { form: { ...state.form, badges: [...state.form.badges, badge] } };
    }),

  removeBadge: (badge) =>
    set((state) => ({
      form: { ...state.form, badges: state.form.badges.filter((b) => b !== badge) },
    })),
}));
