"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

export default function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const isAccount = pathname === "/account";
  const isShared = pathname === "/" && tabParam === "shared";
  const isOwned = pathname === "/" && !isShared;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card">
      <div className="mx-auto flex max-w-3xl items-center justify-around px-4 py-2">
        <Link href="/" className="flex-1">
          <Button type="button" variant={isOwned ? "default" : "outline"} className="w-full">
            Minhas Listas
          </Button>
        </Link>
        <Link href="/?tab=shared" className="flex-1 mx-2">
          <Button type="button" variant={isShared ? "default" : "outline"} className="w-full">
            Compartilhadas
          </Button>
        </Link>
        <Link href="/account" className="flex-1">
          <Button type="button" variant={isAccount ? "default" : "outline"} className="w-full">
            Minha Conta
          </Button>
        </Link>
      </div>
    </div>
  );
}
