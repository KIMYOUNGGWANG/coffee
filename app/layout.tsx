import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { hyangmiBrand } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: `${hyangmiBrand.name} — ${hyangmiBrand.category}`,
  description: `${hyangmiBrand.englishTagline} Save coffee memories, review your taste map, and download digital artifacts.`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
