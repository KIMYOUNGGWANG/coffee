import type { TastingCardData } from "@/hooks/useTastingCards";
import type { RepurchaseIntent } from "@/lib/coffee-memory";

export type RepurchaseFilter = RepurchaseIntent | "";

export type DashboardCardFilters = {
  readonly searchQuery: string;
  readonly selectedMethod: string;
  readonly selectedRoast: string;
  readonly selectedRepurchaseIntent: RepurchaseFilter;
  readonly minAcidity: number;
  readonly minSweetness: number;
  readonly minBody: number;
  readonly sortBy: string;
};

function normalizeSearchText(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("ko-KR").trim().replace(/\s+/g, " ");
}

function searchableText(card: TastingCardData): string {
  return normalizeSearchText([
    card.title,
    card.subtitle,
    card.package_origin ?? "",
    card.package_process ?? "",
    card.footer_meta.origin ?? "",
    card.footer_meta.extraInfo ?? "",
    card.ai_description,
    ...card.badges,
    ...card.tags,
    ...card.repurchase_reasons,
  ].join(" "));
}

function matchesCard(card: TastingCardData, filters: DashboardCardFilters): boolean {
  const queryTokens = normalizeSearchText(filters.searchQuery).split(" ").filter(Boolean);
  const cardText = searchableText(card);
  const badgesText = normalizeSearchText(card.badges.join(" "));
  const tagsText = normalizeSearchText(card.tags.join(" "));

  return (
    queryTokens.every((token) => cardText.includes(token))
    && (filters.selectedMethod === "" || badgesText.includes(normalizeSearchText(filters.selectedMethod)))
    && (filters.selectedRoast === ""
      || tagsText.includes(normalizeSearchText(filters.selectedRoast))
      || badgesText.includes(normalizeSearchText(filters.selectedRoast)))
    && (filters.selectedRepurchaseIntent === ""
      || card.repurchase_intent === filters.selectedRepurchaseIntent)
    && card.metric1 >= filters.minAcidity
    && card.metric2 >= filters.minSweetness
    && card.metric3 >= filters.minBody
  );
}

export function filterDashboardCards(
  cards: readonly TastingCardData[] | undefined,
  filters: DashboardCardFilters,
): readonly TastingCardData[] {
  if (!cards) return [];

  const repurchasePriority: Readonly<Record<RepurchaseIntent, number>> = {
    again: 0,
    maybe: 1,
    undecided: 2,
    no: 3,
  };

  return [...cards.filter((card) => matchesCard(card, filters))].sort((first, second) => {
    switch (filters.sortBy) {
      case "acidity_desc":
        return second.metric1 - first.metric1;
      case "sweetness_desc":
        return second.metric2 - first.metric2;
      case "body_desc":
        return second.metric3 - first.metric3;
      case "title_asc":
        return first.title.localeCompare(second.title, "ko-KR");
      case "repurchase":
        return repurchasePriority[first.repurchase_intent] - repurchasePriority[second.repurchase_intent];
      case "newest":
        return new Date(second.created_at).getTime() - new Date(first.created_at).getTime();
      default:
        return new Date(second.created_at).getTime() - new Date(first.created_at).getTime();
    }
  });
}
