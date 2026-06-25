import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CorrectableCoffeeField,
  RepurchaseIntent,
  ScanSource,
} from "@/lib/coffee-memory";

type JsonRecord = Record<string, unknown>;

async function readJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.trim().length === 0) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" ? (value as JsonRecord) : null;
}

function getResponseData<TData>(json: unknown): TData | undefined {
  const record = asRecord(json);
  if (!record || !("data" in record)) {
    return undefined;
  }

  return record.data as TData;
}

function getResponseErrorMessage(json: unknown, fallbackMessage: string): string {
  const record = asRecord(json);
  const error = asRecord(record?.error);
  const message = error?.message;
  return typeof message === "string" && message.trim().length > 0 ? message : fallbackMessage;
}

function getStringField(json: unknown, fieldName: string): string | undefined {
  const record = asRecord(json);
  const value = record?.[fieldName];
  return typeof value === "string" ? value : undefined;
}

export interface TastingCardData {
  id: string;
  user_id: string;
  category: "coffee" | "beer" | "whiskey" | "wine";
  title: string;
  subtitle: string;
  image_url: string | null;
  badges: string[];
  metric1: number;
  metric2: number;
  metric3: number;
  metric4: number;
  metric5: number;
  metric6: number;
  tags: string[];
  ai_description: string;
  is_public?: boolean;
  public_share_token?: string;
  footer_meta: {
    origin?: string;
    date?: string;
    extraInfo?: string;
  };
  package_origin: string | null;
  package_process: string | null;
  repurchase_intent: RepurchaseIntent;
  repurchase_reasons: readonly string[];
  scan_source: ScanSource | null;
  scan_confidence: number | null;
  corrected_fields: readonly CorrectableCoffeeField[];
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateTastingCardInput = {
  readonly category: TastingCardData["category"];
  readonly title: string;
  readonly subtitle: string;
  readonly imageUrl: string | null;
  readonly badges: readonly string[];
  readonly metric1: number;
  readonly metric2: number;
  readonly metric3: number;
  readonly metric4: number;
  readonly metric5: number;
  readonly metric6: number;
  readonly tags: readonly string[];
  readonly aiDescription: string;
  readonly footerMeta: TastingCardData["footer_meta"];
  readonly packageOrigin?: string | null;
  readonly packageProcess?: string | null;
  readonly repurchaseIntent?: RepurchaseIntent;
  readonly repurchaseReasons?: readonly string[];
  readonly scanSource?: ScanSource | null;
  readonly scanConfidence?: number | null;
  readonly correctedFields?: readonly CorrectableCoffeeField[];
  readonly confirmed?: true;
};

export type UpdateTastingCardInput = {
  readonly title?: string;
  readonly subtitle?: string;
  readonly imageUrl?: string | null;
  readonly badges?: readonly string[];
  readonly metric1?: number;
  readonly metric2?: number;
  readonly metric3?: number;
  readonly metric4?: number;
  readonly metric5?: number;
  readonly metric6?: number;
  readonly tags?: readonly string[];
  readonly aiDescription?: string;
  readonly footerMeta?: TastingCardData["footer_meta"];
  readonly packageOrigin?: string | null;
  readonly packageProcess?: string | null;
  readonly repurchaseIntent?: RepurchaseIntent;
  readonly repurchaseReasons?: readonly string[];
  readonly scanSource?: ScanSource | null;
  readonly scanConfidence?: number | null;
  readonly correctedFields?: readonly CorrectableCoffeeField[];
  readonly confirmed?: true;
};

// Fetch all cards belonging to the logged-in user
export function useTastingCards() {
  return useQuery<TastingCardData[]>({
    queryKey: ["tasting-cards"],
    queryFn: async () => {
      const response = await fetch("/api/v1/cards");
      const json = await readJsonResponse(response);
      if (!response.ok) {
        throw new Error(getResponseErrorMessage(json, "카드를 가져오는 데 실패했습니다."));
      }
      return getResponseData<TastingCardData[]>(json) || [];
    },
  });
}

// Fetch a single tasting card details
export function useTastingCard(id: string) {
  return useQuery<TastingCardData>({
    queryKey: ["tasting-cards", id],
    queryFn: async () => {
      const response = await fetch(`/api/v1/cards/${id}`);
      const json = await readJsonResponse(response);
      if (!response.ok) {
        throw new Error(getResponseErrorMessage(json, "카드 상세 정보를 가져오는 데 실패했습니다."));
      }
      const data = getResponseData<TastingCardData>(json);
      if (!data) {
        throw new Error("카드 상세 응답이 비어 있습니다.");
      }
      return data;
    },
    enabled: !!id,
  });
}

// Create a new tasting card
export function useCreateTastingCard() {
  const queryClient = useQueryClient();

  return useMutation<TastingCardData, Error, CreateTastingCardInput>({
    mutationFn: async (newCard: CreateTastingCardInput) => {
      const response = await fetch("/api/v1/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCard),
      });

      const json = await readJsonResponse(response);
      if (!response.ok) {
        throw new Error(getResponseErrorMessage(json, "카드를 생성하는 데 실패했습니다."));
      }

      const data = getResponseData<TastingCardData>(json);
      if (!data) {
        throw new Error("생성된 카드 응답이 비어 있습니다.");
      }
      return data;
    },
    onSuccess: () => {
      // Invalidate the cache to refresh card list dashboard
      queryClient.invalidateQueries({ queryKey: ["tasting-cards"] });
    },
  });
}

// Update an existing tasting card
export function useUpdateTastingCard() {
  const queryClient = useQueryClient();

  return useMutation<TastingCardData, Error, { readonly id: string; readonly fields: UpdateTastingCardInput }>({
    mutationFn: async ({ id, fields }) => {
      const response = await fetch(`/api/v1/cards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });

      const json = await readJsonResponse(response);
      if (!response.ok) {
        throw new Error(getResponseErrorMessage(json, "카드를 수정하는 데 실패했습니다."));
      }

      const data = getResponseData<TastingCardData>(json);
      if (!data) {
        throw new Error("수정된 카드 응답이 비어 있습니다.");
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasting-cards"] });
      queryClient.invalidateQueries({ queryKey: ["tasting-cards", data.id] });
    },
  });
}

// Delete a tasting card
export function useDeleteTastingCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/v1/cards/${id}`, {
        method: "DELETE",
      });

      const json = await readJsonResponse(response);
      if (!response.ok) {
        throw new Error(getResponseErrorMessage(json, "카드를 삭제하는 데 실패했습니다."));
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasting-cards"] });
    },
  });
}

// Pre-generate AI SCA Tasting Description Note
export function useGenerateAiNote() {
  return useMutation<
    { aiDescription: string },
    Error,
    { tags: string[]; rawNote?: string }
  >({
    mutationFn: async ({ tags, rawNote }) => {
      const response = await fetch("/api/v1/cards/ai-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags, rawNote }),
      });

      const json = await readJsonResponse(response);
      if (!response.ok) {
        throw new Error(getResponseErrorMessage(json, "AI 향미 노트를 생성하는 데 실패했습니다."));
      }

      const aiDescription = getStringField(json, "aiDescription");
      if (!aiDescription) {
        throw new Error("AI 향미 노트 응답이 비어 있습니다.");
      }
      return { aiDescription };
    },
  });
}

export interface UserProfileData {
  credits: number;
  has_pdf_access: boolean;
  is_premium: boolean;
  scans_used: number;
  monthly_scan_limit: number;
}

export function useUserProfile() {
  return useQuery<UserProfileData>({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const response = await fetch("/api/v1/profile");
      const json = await readJsonResponse(response);
      if (!response.ok) {
        if (response.status === 401) return { credits: 10, has_pdf_access: true, is_premium: true, scans_used: 0, monthly_scan_limit: 100 }; // TEMPORARY MOCK
        throw new Error(getResponseErrorMessage(json, "프로필 데이터를 가져오는 데 실패했습니다."));
      }
      const data = getResponseData<UserProfileData>(json);
      if (!data) {
        throw new Error("프로필 응답이 비어 있습니다.");
      }
      return data;
    },
  });
}

export interface BrewingNoteData {
  id: string;
  tasting_card_id: string;
  user_id: string;
  method: string;
  bean_amount: number;
  water_amount: number;
  grind_size: string | null;
  water_temp: number | null;
  brew_time: number | null;
  rating: number | null;
  memo: string | null;
  created_at: string;
}

// Fetch all brewing notes for a tasting card
export function useBrewingNotes(cardId: string) {
  return useQuery<BrewingNoteData[]>({
    queryKey: ["brewing-notes", cardId],
    queryFn: async () => {
      const response = await fetch(`/api/v1/cards/${cardId}/brewing-notes`);
      const json = await readJsonResponse(response);
      if (!response.ok) {
        throw new Error(getResponseErrorMessage(json, "추출 노트를 가져오는 데 실패했습니다."));
      }
      return getResponseData<BrewingNoteData[]>(json) || [];
    },
    enabled: !!cardId,
  });
}

// Create a new brewing note
export function useCreateBrewingNote(cardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newNote: {
      method: string;
      beanAmount: number;
      waterAmount: number;
      grindSize?: string | null;
      waterTemp?: number | null;
      brewTime?: number | null;
      rating?: number | null;
      memo?: string | null;
    }) => {
      const response = await fetch(`/api/v1/cards/${cardId}/brewing-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNote),
      });

      const json = await readJsonResponse(response);
      if (!response.ok) {
        throw new Error(getResponseErrorMessage(json, "추출 노트를 추가하는 데 실패했습니다."));
      }

      const data = getResponseData<BrewingNoteData>(json);
      if (!data) {
        throw new Error("추출 노트 응답이 비어 있습니다.");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brewing-notes", cardId] });
      queryClient.invalidateQueries({ queryKey: ["tasting-cards"] });
      queryClient.invalidateQueries({ queryKey: ["tasting-cards", cardId] });
      queryClient.invalidateQueries({ queryKey: ["taste-analytics"] });
    },
  });
}

// Update an existing brewing note
export function useUpdateBrewingNote(cardId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    BrewingNoteData,
    Error,
    {
      id: string;
      fields: {
        method?: string;
        beanAmount?: number;
        waterAmount?: number;
        grindSize?: string | null;
        waterTemp?: number | null;
        brewTime?: number | null;
        rating?: number | null;
        memo?: string | null;
      };
    }
  >({
    mutationFn: async ({ id: noteId, fields }) => {
      const response = await fetch(`/api/v1/cards/${cardId}/brewing-notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });

      const json = await readJsonResponse(response);
      if (!response.ok) {
        throw new Error(getResponseErrorMessage(json, "추출 노트를 수정하는 데 실패했습니다."));
      }

      const data = getResponseData<BrewingNoteData>(json);
      if (!data) {
        throw new Error("수정된 추출 응답이 비어 있습니다.");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brewing-notes", cardId] });
      queryClient.invalidateQueries({ queryKey: ["tasting-cards"] });
      queryClient.invalidateQueries({ queryKey: ["tasting-cards", cardId] });
      queryClient.invalidateQueries({ queryKey: ["taste-analytics"] });
    },
  });
}

// Delete a brewing note
export function useDeleteBrewingNote(cardId: string) {
  const queryClient = useQueryClient();

  return useMutation<{ id: string; success: boolean }, Error, string>({
    mutationFn: async (noteId: string) => {
      const response = await fetch(`/api/v1/cards/${cardId}/brewing-notes/${noteId}`, {
        method: "DELETE",
      });

      const json = await readJsonResponse(response);
      if (!response.ok) {
        throw new Error(getResponseErrorMessage(json, "추출 노트를 삭제하는 데 실패했습니다."));
      }

      const data = getResponseData<{ id: string; success: boolean }>(json);
      if (!data) {
        throw new Error("삭제 결과가 비어 있습니다.");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brewing-notes", cardId] });
      queryClient.invalidateQueries({ queryKey: ["tasting-cards"] });
      queryClient.invalidateQueries({ queryKey: ["tasting-cards", cardId] });
      queryClient.invalidateQueries({ queryKey: ["taste-analytics"] });
    },
  });
}

export interface TasteAnalyticsData {
  averageAcidity: number;
  averageSweetness: number;
  averageBody: number;
  topTags: string[];
  totalCards: number;
  aiAnalysis: string;
  brewingStats?: {
    totalNotes: number;
    favoriteMethod: string;
    averageRating: number;
    bestTemp: number | null;
  };
}

// Fetch coffee flavor preference analytics
export function useTasteAnalytics() {
  return useQuery<TasteAnalyticsData>({
    queryKey: ["taste-analytics"],
    queryFn: async () => {
      const response = await fetch("/api/v1/profile/analytics");
      const json = await readJsonResponse(response);
      if (!response.ok) {
        if (response.status === 401) return { averageAcidity: 0, averageSweetness: 0, averageBody: 0, topTags: [], totalCards: 0, aiAnalysis: "데이터가 없습니다." }; // TEMPORARY MOCK
        throw new Error(getResponseErrorMessage(json, "분석 리포트를 불러오는 데 실패했습니다."));
      }
      const data = getResponseData<TasteAnalyticsData>(json);
      if (!data) {
        throw new Error("분석 리포트 응답이 비어 있습니다.");
      }
      return data;
    },
  });
}

export interface ScannedCoffeeData {
  title: string;
  subtitle: string;
  origin: string;
  process: string;
  tags: string[];
  metric1_acidity: number;
  metric2_sweetness: number;
  metric3_body: number;
  metric4_bitterness?: number;
  metric5_aroma?: number;
  metric6_aftertaste?: number;
}

// Mutation to scan coffee package image
export function useScanCoffeePackage() {
  const queryClient = useQueryClient();

  return useMutation<{ data: ScannedCoffeeData }, Error, { image: string }>({
    mutationFn: async ({ image }) => {
      const response = await fetch("/api/v1/cards/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });

      const json = await readJsonResponse(response);
      if (!response.ok) {
        throw new Error(getResponseErrorMessage(json, "원두 스캔에 실패했습니다."));
      }

      const data = getResponseData<ScannedCoffeeData>(json);
      if (!data) {
        throw new Error("원두 스캔 응답이 비어 있습니다.");
      }
      return { data };
    },
    onSuccess: () => {
      // Refresh profiles scan limits counter
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });
}
