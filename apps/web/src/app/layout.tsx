import type { Metadata } from "next";

import { Geist, Geist_Mono } from "next/font/google";
import { ShoppingCart } from "lucide-react";

import "../index.css";
import Providers from "@/components/providers";

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
            <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
              <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
                <div className="flex size-10 items-center justify-center rounded-full border bg-background">
                  <ShoppingCart className="size-5" aria-hidden />
                </div>
                <div>
                  <p className="text-base font-semibold">ShoppingList</p>
                  <p className="text-xs text-muted-foreground">Organize suas compras em segundos</p>
                </div>
              </div>
            </header>
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
