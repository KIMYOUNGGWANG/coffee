import DashboardClient from "@/components/dashboard-client";
import { readActivationIntentFromRecord } from "@/lib/activation-intent";
import { readCheckoutIntentFromRecord, readCheckoutNoticeFromRecord } from "@/lib/checkout-return";

type DashboardPageProps = {
  readonly searchParams: Promise<Record<string, string | readonly string[] | undefined>>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedSearchParams = await searchParams;
  return (
    <DashboardClient
      initialActivationIntent={readActivationIntentFromRecord(resolvedSearchParams)}
      initialCheckoutIntent={readCheckoutIntentFromRecord(resolvedSearchParams)}
      initialCheckoutNotice={readCheckoutNoticeFromRecord(resolvedSearchParams)}
    />
  );
}
