import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import { Providers } from "@/components/providers";
import { Analytics } from "@vercel/analytics/next";
import { coffeeDexBrand } from "@/lib/brand";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${coffeeDexBrand.name} — ${coffeeDexBrand.category}`,
  description: `${coffeeDexBrand.englishTagline} Save coffee memories, review your taste map, and download digital artifacts.`,
  icons: {
    icon: "/icon.svg",
  },
};

const shouldRenderVercelAnalytics = process.env.VERCEL === "1";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${playfair.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
        {shouldRenderVercelAnalytics && <Analytics />}
      </body>
    </html>
  );
}
