import { coffeeDexBrand } from "@/lib/brand";

export type MembershipRole = "owner" | "admin" | "member";
export type SubscriptionPlan = "free" | "premium";
export type SubscriptionStatus =
  | "inactive"
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused";
export type StarterStatus = "healthy" | "attention" | "manual";

export type StarterHealthResponse = {
  status: "ok";
  service: string;
  timestamp: string;
  mode: "starter";
};

export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  role: MembershipRole;
  memberCount: number;
  requiresOnboarding: boolean;
};

export type WorkspaceListResponse = {
  data: WorkspaceSummary[];
};

export type SubscriptionSummary = {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  isPremium: boolean;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  lastInvoiceStatus: string | null;
  updatedAt: string | null;
};

export type SubscriptionResponse = {
  data: SubscriptionSummary;
};

export type StarterSurface = {
  id: string;
  title: string;
  summary: string;
  status: StarterStatus;
};

export const starterServiceName = coffeeDexBrand.filenameSlug;

export const starterSurfaces: StarterSurface[] = [
  {
    id: "account",
    title: "CoffeeDex Account",
    summary: "Supabase-backed account access for a private tasting archive.",
    status: "healthy",
  },
  {
    id: "cards",
    title: "Tasting Cards",
    summary: "Korean specialty coffee cards with roaster, origin, process, and flavor notes.",
    status: "healthy",
  },
  {
    id: "scan",
    title: "AI-Assisted Scan Drafts",
    summary: "Bean package scans propose editable draft fields before the user saves a card.",
    status: "attention",
  },
  {
    id: "exports",
    title: "Share And PDF Exports",
    summary: "Digital story-card and PDF artifacts from the user's saved coffee memories.",
    status: "manual",
  },
];

export const starterWorkspaces: WorkspaceSummary[] = [
  {
    id: "ws_solo",
    name: "Seoul Home Cafe Archive",
    slug: "seoul-home-cafe",
    role: "owner",
    memberCount: 1,
    requiresOnboarding: false,
  },
  {
    id: "ws_growth",
    name: "Busan Roastery Notes",
    slug: "busan-roastery-notes",
    role: "admin",
    memberCount: 1,
    requiresOnboarding: true,
  },
  {
    id: "ws_support",
    name: "Jeju Brewing Log",
    slug: "jeju-brewing-log",
    role: "member",
    memberCount: 1,
    requiresOnboarding: false,
  },
];

export const starterSubscription: SubscriptionSummary = {
  plan: "free",
  status: "inactive",
  isPremium: false,
  stripeSubscriptionId: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  lastInvoiceStatus: null,
  updatedAt: null,
};

export const starterGoldenFlows = [
  "onboarding -> first Korean specialty coffee card",
  "package scan -> editable draft -> user-confirmed card",
  "raw taste memo -> assisted SCA-style note -> saved memory",
  "dashboard -> saved-record taste recap",
  "card detail -> story export image",
  "PDF access -> digital home-cafe archive export",
];
