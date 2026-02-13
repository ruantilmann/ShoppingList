"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ListChecks, User, Users } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const isAccount = pathname === "/account";
  const isShared = pathname === "/" && tabParam === "shared";
  const isOwned = pathname === "/" && !isShared;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-around px-4 py-2">
        <Link href="/" className="flex-1">
          <Button
            type="button"
            variant={isOwned ? "secondary" : "ghost"}
            className="h-auto w-full flex-col gap-1 py-2"
            aria-current={isOwned ? "page" : undefined}
          >
            <ListChecks className="size-5" aria-hidden />
            <span className="text-[10px] font-medium">Minhas Listas</span>
          </Button>
        </Link>
        <Link href="/?tab=shared" className="mx-2 flex-1">
          <Button
            type="button"
            variant={isShared ? "secondary" : "ghost"}
            className="h-auto w-full flex-col gap-1 py-2"
            aria-current={isShared ? "page" : undefined}
          >
            <Users className="size-5" aria-hidden />
            <span className="text-[10px] font-medium">Compartilhadas</span>
          </Button>
        </Link>
        <Link href="/account" className="flex-1">
          <Button
            type="button"
            variant={isAccount ? "secondary" : "ghost"}
            className="h-auto w-full flex-col gap-1 py-2"
            aria-current={isAccount ? "page" : undefined}
          >
            <User className="size-5" aria-hidden />
            <span className="text-[10px] font-medium">Minha Conta</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
