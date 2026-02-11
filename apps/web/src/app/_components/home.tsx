"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ListItem = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { items: number };
  owner?: { id: string; name: string | null; email: string };
};

type Tab = "owned" | "shared";

export default function HomeClient() {
  const [tab, setTab] = useState<Tab>("owned");
  const [ownedLists, setOwnedLists] = useState<ListItem[]>([]);
  const [sharedLists, setSharedLists] = useState<ListItem[]>([]);
  const [newListName, setNewListName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const searchParams = useSearchParams();

  const lists = useMemo(() => (tab === "owned" ? ownedLists : sharedLists), [tab, ownedLists, sharedLists]);

  const loadLists = async () => {
    try {
      setIsLoading(true);
      const [ownedResponse, sharedResponse] = await Promise.all([
        api.getLists(),
        api.getSharedLists(),
      ]);
      setOwnedLists(ownedResponse.lists);
      setSharedLists(sharedResponse.lists);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load lists");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLists();
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "shared") {
      setTab("shared");
      return;
    }
    setTab("owned");
  }, [searchParams]);

  useEffect(() => {
    if (!isModalOpen) return;
    setFormError(null);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
        setNewListName("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    inputRef.current?.focus();

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      setFormError("Informe o nome da lista.");
      return;
    }
    try {
      await api.createList(newListName.trim());
      setNewListName("");
      setIsModalOpen(false);
      setFormError(null);
      await loadLists();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create list");
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6">
      <div className="flex flex-col gap-4">
        {error && <p className="text-sm text-red-600">{error}</p>}

        {isLoading ? (
          <p>Carregando...</p>
        ) : lists.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma lista encontrada.</p>
        ) : (
          <div className="grid gap-3">
            {lists.map((list) => (
              <Link
                key={list.id}
                href={`/lists/${list.id}`}
                className="rounded border p-3 hover:bg-muted"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{list.name}</p>
                    {tab === "shared" && list.owner ? (
                      <p className="text-xs text-muted-foreground">Owner: {list.owner.email}</p>
                    ) : null}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {list._count?.items ?? 0} itens
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-20 right-6 z-50 h-12 w-12 rounded-full text-2xl shadow"
        aria-label="Criar lista"
      >
        +
      </Button>

      {isModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          onClick={() => {
            setIsModalOpen(false);
            setNewListName("");
          }}
        >
          <div
            className="w-full max-w-sm rounded-lg border bg-card p-4 text-foreground shadow"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="mb-2 text-lg font-medium">Nova lista</h2>
            <Input
              ref={inputRef}
              value={newListName}
              onChange={(event) => {
                setNewListName(event.target.value);
                setFormError(null);
              }}
              placeholder="Nome da lista"
              className="mb-4"
            />
            {formError ? <p className="mb-4 text-sm text-red-600">{formError}</p> : null}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setNewListName("");
                  setFormError(null);
                }}
                variant="outline"
              >
                Cancelar
              </Button>
              <Button type="button" onClick={handleCreateList}>
                Criar
              </Button>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}
