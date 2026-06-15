import PublicCardPage from "@/components/public-card-page";

type PublicCardRouteProps = {
  readonly params: Promise<{ readonly token: string }>;
};

export default async function CardPublicPage({ params }: PublicCardRouteProps) {
  const { token } = await params;
  return <PublicCardPage token={token} />;
}
