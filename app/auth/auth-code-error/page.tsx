import type { Metadata } from "next";
import { AuthCodeErrorClient } from "@/components/auth-code-error-client";

export const metadata: Metadata = {
  title: "CoffeeDex 로그인 오류",
  description: "Google OAuth callback failed.",
};

export default function AuthCodeErrorPage() {
  return <AuthCodeErrorClient />;
}
