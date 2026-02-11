import type { Metadata } from "next";

import { Geist, Geist_Mono } from "next/font/google";

import "../index.css";
import Providers from "@/components/providers";
import BottomNav from "@/components/bottom-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ShoppingList",
  description: "ShoppingList",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <div className="min-h-svh">
            <header className="border-b bg-card px-4 py-3">
              <div className="mx-auto max-w-3xl text-center text-lg font-semibold">ShoppingList</div>
            </header>
            <main className="pb-24">{children}</main>
            <BottomNav />
          </div>
        </Providers>
      </body>
    </html>
  );
}
