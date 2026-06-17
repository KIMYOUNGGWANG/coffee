import QuizClient from "@/components/QuizClient";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <QuizClient token={token} />;
}
