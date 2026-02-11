"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import Link from "next/link";

export default function AccountClient() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-6 pb-24">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-6 pb-24">
        <p className="text-sm text-muted-foreground">Nao autenticado.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6 pb-24">
      <h1 className="mb-4 text-2xl font-semibold">Minha Conta</h1>
      <div className="rounded-lg border bg-card p-4 text-foreground shadow">
        <p className="text-sm font-medium">{session.user.name}</p>
        <p className="text-sm text-muted-foreground">{session.user.email}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm font-medium">Tema</span>
          <ModeToggle />
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            onClick={() =>
              authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    window.location.href = "/login";
                  },
                },
              })
            }
          >
            Sair
          </Button>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-around px-4 py-2">
          <Link href="/" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Minhas Listas
            </Button>
          </Link>
          <Link href="/?tab=shared" className="flex-1 mx-2">
            <Button type="button" variant="outline" className="w-full">
              Compartilhadas
            </Button>
          </Link>
          <Button type="button" variant="default" className="flex-1">
            Minha Conta
          </Button>
        </div>
      </div>
    </div>
  );
}
