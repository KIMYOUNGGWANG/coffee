import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useTastingCards() {
  return useQuery({
    queryKey: ['tasting-cards'],
    queryFn: async () => {
      // 1. 안전하게 user 정보를 가져옵니다. 
      const { data, error: authError } = await supabase.auth.getUser();
      const user = data?.user;
      
      if (!user) {
        return [
          {
            id: 'mock-1',
            title: '에티오피아 예가체프 아리차',
            subtitle: '프릳츠 커피 컴퍼니',
            image_url: null,
            rating: 4.5,
            taste_notes: ['베리류', '꽃향', '밝은 산미'],
            created_at: new Date().toISOString(),
            repurchase_intent: 'will_buy',
            repurchase_reasons: [],
            corrected_fields: []
          },
          {
            id: 'mock-2',
            title: '콜롬비아 핀카 엘 파라이소 더블 무산소',
            subtitle: '모모스 커피',
            image_url: null,
            rating: 5.0,
            taste_notes: ['리치', '복숭아', '요거트'],
            created_at: new Date(Date.now() - 86400000).toISOString(),
            repurchase_intent: 'will_buy',
            repurchase_reasons: [],
            corrected_fields: []
          }
        ];
      }

      const { data: cardsData, error } = await supabase
        .from("tasting_cards")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw new Error(error.message)
      
      return (cardsData || []).map(row => ({
        ...row,
        title: row.coffee_name, // Mapping DB column to UI prop
        subtitle: row.roaster_name, // Mapping DB column to UI prop
        repurchase_intent: row.repurchase_intent || "undecided",
        repurchase_reasons: row.repurchase_reasons || [],
        corrected_fields: row.corrected_fields || [],
      }))
    }
  })
}
