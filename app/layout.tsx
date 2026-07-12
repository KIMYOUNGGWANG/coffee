import type { Metadata } from "next";
import Script from "next/script";
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
      <head>
        {process.env.NODE_ENV === "development" && (
          <Script
            src="https://unpkg.com/react-scan/dist/auto.global.js"
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}

        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body className={`${playfair.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
        {shouldRenderVercelAnalytics && <Analytics />}
      </body>
    </html>
  );
}
