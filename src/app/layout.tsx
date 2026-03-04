import type { Metadata, Viewport } from "next";
import { Noto_Sans_Hebrew } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { PwaRegister } from "@/components/PwaRegister";

const notoSansHebrew = Noto_Sans_Hebrew({
  variable: "--font-noto-sans-hebrew",
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const FAVICON_URL =
  "https://cdn.shopify.com/s/files/1/0594/9839/7887/files/bb02cd6a669bc0af13867bc01d09091a.svg?v=1772032242";

export const metadata: Metadata = {
  title: "Red Hub — אדריכלים ומעצבים",
  description: "פורטל אדריכלים ומעצבים — השטיח האדום",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "Red Hub" },
  icons: {
    icon: [{ url: FAVICON_URL, type: "image/svg+xml" }],
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#C8102E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={notoSansHebrew.variable}>
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans antialiased">
        <Providers>
          <PwaRegister />
          {children}
        </Providers>
      </body>
    </html>
  );
}
