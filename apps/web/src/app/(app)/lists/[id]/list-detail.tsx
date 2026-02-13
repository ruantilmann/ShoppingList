"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { api } from "@/lib/api";

type ListItem = {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  checked: boolean;
};

type ShareItem = {
  id: string;
  inviteeEmail: string;
  status: "PENDING" | "ACTIVE";
  inviteeUser?: { id: string; name: string | null; email: string } | null;
};

type ListData = {
  id: string;
  name: string;
  ownerId: string;
  owner?: { id: string; name: string | null; email: string } | null;
  items: ListItem[];
};

export default function ListDetail({ listId }: { listId: string }) {
  const [list, setList] = useState<ListData | null>(null);
  const [role, setRole] = useState<"OWNER" | "PARTICIPANT" | null>(null);
  const [shares, setShares] = useState<ShareItem[]>([]);
  const [newItem, setNewItem] = useState({ name: "", quantity: "", unit: "" });
  const [newShareEmail, setNewShareEmail] = useState("");
  const [listName, setListName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState({ name: "", quantity: "", unit: "" });

  const isOwner = role === "OWNER";

  const items = useMemo(() => list?.items ?? [], [list]);

  const loadList = async () => {
    try {
      const response = await api.getList(listId);
      setList(response.list);
      setRole(response.role);
      setListName(response.list.name);
      setError(null);
      if (response.role === "OWNER") {
        const sharesResponse = await api.getShares(listId);
        setShares(sharesResponse.shares);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load list");
    }
  };

  const runAction = async (action: () => Promise<void>) => {
    try {
      await action();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    }
  };

  useEffect(() => {
    loadList();
  }, [listId]);

  const handleAddItem = async () => {
    if (!newItem.name.trim()) return;
    const quantityValue = newItem.quantity.trim() ? Number(newItem.quantity) : undefined;
    await runAction(async () => {
      await api.createItem(listId, {
        name: newItem.name.trim(),
        quantity: Number.isFinite(quantityValue) ? quantityValue : undefined,
        unit: newItem.unit.trim() || undefined,
      });
      setNewItem({ name: "", quantity: "", unit: "" });
      await loadList();
    });
  };

  const handleUpdateItem = async (itemId: string) => {
    const quantityValue = editingItem.quantity.trim() ? Number(editingItem.quantity) : null;
    await runAction(async () => {
      await api.updateItem(listId, itemId, {
        name: editingItem.name.trim(),
        quantity: Number.isFinite(quantityValue) ? quantityValue : null,
        unit: editingItem.unit.trim() || null,
      });
      setEditingItemId(null);
      setEditingItem({ name: "", quantity: "", unit: "" });
      await loadList();
    });
  };

  const handleToggleItem = async (itemId: string, checked: boolean) => {
    await runAction(async () => {
      await api.checkItem(listId, itemId, checked);
      await loadList();
    });
  };

  const handleDeleteItem = async (itemId: string) => {
    await runAction(async () => {
      await api.deleteItem(listId, itemId);
      await loadList();
    });
  };

  const handleRenameList = async () => {
    if (!listName.trim() || !list) return;
    await runAction(async () => {
      await api.updateList(list.id, listName.trim());
      await loadList();
    });
  };

  const handleDeleteList = async () => {
    if (!list) return;
    await runAction(async () => {
      await api.deleteList(list.id);
      window.location.href = "/";
    });
  };

  const handleShare = async () => {
    if (!newShareEmail.trim()) return;
    await runAction(async () => {
      await api.shareList(listId, newShareEmail.trim());
      setNewShareEmail("");
      await loadList();
    });
  };

  const handleRemoveShare = async (shareId: string) => {
    await runAction(async () => {
      await api.deleteShare(listId, shareId);
      await loadList();
    });
  };

  if (!list) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-6">
        {error ? <p className="text-sm text-red-600">{error}</p> : <p>Carregando...</p>}
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{list.name}</h1>
          {list.owner ? (
            <p className="text-xs text-muted-foreground">Owner: {list.owner.email}</p>
          ) : null}
        </div>
        <Link href="/" className="text-sm text-muted-foreground">
          Voltar
        </Link>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {isOwner ? (
        <div className="mb-6 flex flex-col gap-2 rounded border p-3">
          <p className="text-sm font-medium">Editar lista</p>
          <div className="flex gap-2">
            <input
              value={listName}
              onChange={(event) => setListName(event.target.value)}
              className="flex-1 rounded border px-3 py-2"
            />
            <button type="button" className="rounded border px-3 py-2" onClick={handleRenameList}>
              Salvar
            </button>
            <button type="button" className="rounded border px-3 py-2" onClick={handleDeleteList}>
              Excluir
            </button>
          </div>
        </div>
      ) : null}

      <section className="mb-6 rounded border p-3">
        <h2 className="mb-3 text-sm font-medium">Itens</h2>
        <div className="mb-4 grid gap-2 sm:grid-cols-4">
          <input
            value={newItem.name}
            onChange={(event) => setNewItem((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Item"
            className="rounded border px-3 py-2"
          />
          <input
            value={newItem.quantity}
            onChange={(event) => setNewItem((prev) => ({ ...prev, quantity: event.target.value }))}
            placeholder="Qtd"
            className="rounded border px-3 py-2"
          />
          <input
            value={newItem.unit}
            onChange={(event) => setNewItem((prev) => ({ ...prev, unit: event.target.value }))}
            placeholder="Unidade"
            className="rounded border px-3 py-2"
          />
          <button type="button" className="rounded border px-3 py-2" onClick={handleAddItem}>
            Adicionar
          </button>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum item ainda.</p>
        ) : (
          <div className="grid gap-2">
            {items.map((item) => (
              <div key={item.id} className="rounded border p-2">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(event) => handleToggleItem(item.id, event.target.checked)}
                  />
                  <span className={item.checked ? "line-through" : ""}>{item.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.quantity ?? "-"} {item.unit ?? ""}
                  </span>
                  <button
                    type="button"
                    className="ml-auto text-xs"
                    onClick={() => {
                      setEditingItemId(item.id);
                      setEditingItem({
                        name: item.name,
                        quantity: item.quantity?.toString() ?? "",
                        unit: item.unit ?? "",
                      });
                    }}
                  >
                    Editar
                  </button>
                  <button type="button" className="text-xs" onClick={() => handleDeleteItem(item.id)}>
                    Remover
                  </button>
                </div>

                {editingItemId === item.id ? (
                  <div className="mt-2 grid gap-2 sm:grid-cols-4">
                    <input
                      value={editingItem.name}
                      onChange={(event) => setEditingItem((prev) => ({ ...prev, name: event.target.value }))}
                      className="rounded border px-2 py-1"
                    />
                    <input
                      value={editingItem.quantity}
                      onChange={(event) => setEditingItem((prev) => ({ ...prev, quantity: event.target.value }))}
                      className="rounded border px-2 py-1"
                    />
                    <input
                      value={editingItem.unit}
                      onChange={(event) => setEditingItem((prev) => ({ ...prev, unit: event.target.value }))}
                      className="rounded border px-2 py-1"
                    />
                    <button type="button" className="rounded border px-2 py-1" onClick={() => handleUpdateItem(item.id)}>
                      Salvar
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      {isOwner ? (
        <section className="rounded border p-3">
          <h2 className="mb-3 text-sm font-medium">Compartilhamento</h2>
          <div className="mb-4 flex gap-2">
            <input
              value={newShareEmail}
              onChange={(event) => setNewShareEmail(event.target.value)}
              placeholder="Email do participante"
              className="flex-1 rounded border px-3 py-2"
            />
            <button type="button" className="rounded border px-3 py-2" onClick={handleShare}>
              Compartilhar
            </button>
          </div>
          {shares.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum compartilhamento.</p>
          ) : (
            <div className="grid gap-2">
              {shares.map((share) => (
                <div key={share.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                  <div>
                    <p>{share.inviteeUser?.email ?? share.inviteeEmail}</p>
                    <p className="text-xs text-muted-foreground">{share.status}</p>
                  </div>
                  <button type="button" className="text-xs" onClick={() => handleRemoveShare(share.id)}>
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
