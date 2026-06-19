import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { coffeeDexBrand } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: `${coffeeDexBrand.name} — ${coffeeDexBrand.category}`,
  description: `${coffeeDexBrand.englishTagline} Save coffee memories, review your taste map, and download digital artifacts.`,
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
