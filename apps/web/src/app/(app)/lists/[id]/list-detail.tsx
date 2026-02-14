"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, Pencil, Plus, Share2, Trash2, X } from "lucide-react";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ListItem = {
  id: string;
  name: string;
  quantity: number | null;
  price: number | null;
  market: string | null;
  unitOfMeasure: UnitOfMeasure;
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

type UnitOfMeasure = "KG" | "ML" | "UN";

export default function ListDetail({ listId }: { listId: string }) {
  const [list, setList] = useState<ListData | null>(null);
  const [role, setRole] = useState<"OWNER" | "PARTICIPANT" | null>(null);
  const [shares, setShares] = useState<ShareItem[]>([]);
  const [newItem, setNewItem] = useState<{
    name: string;
    quantity: string;
    price: string;
    market: string;
    unitOfMeasure: UnitOfMeasure;
  }>({ name: "", quantity: "", price: "", market: "", unitOfMeasure: "UN" });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [newShareEmail, setNewShareEmail] = useState("");
  const [listName, setListName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<{
    name: string;
    quantity: string;
    price: string;
    market: string;
    unitOfMeasure: UnitOfMeasure;
  }>({ name: "", quantity: "", price: "", market: "", unitOfMeasure: "UN" });
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const addItemInputRef = useRef<HTMLInputElement | null>(null);
  const shareEmailInputRef = useRef<HTMLInputElement | null>(null);

  const isOwner = role === "OWNER";

  const items = useMemo(() => list?.items ?? [], [list]);

  const formatUnit = (unit: UnitOfMeasure) => {
    if (unit === "KG") return "kg";
    if (unit === "ML") return "ml";
    return "un";
  };

  const formatPrice = (price: number) => price.toFixed(2);

  const parsePriceInput = (value: string) => {
    const cleaned = value.replace(/[^0-9.,]/g, "");
    const normalized = cleaned.replace(",", ".");
    const [whole, decimal] = normalized.split(".");
    if (!decimal) return whole;
    return `${whole}.${decimal.replace(/\./g, "")}`;
  };

  const formatPriceInput = (value: string) => (value ? `R$ ${value}` : "R$ ");

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

  useEffect(() => {
    if (!isAddModalOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsAddModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    addItemInputRef.current?.focus();

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAddModalOpen]);

  useEffect(() => {
    if (!isShareModalOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsShareModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    shareEmailInputRef.current?.focus();

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isShareModalOpen]);

  const handleAddItem = async () => {
    if (!newItem.name.trim()) return;
    const quantityValue = newItem.quantity.trim() ? Number(newItem.quantity) : undefined;
    const priceValue = newItem.price.trim() ? Number(newItem.price) : undefined;
    await runAction(async () => {
      await api.createItem(listId, {
        name: newItem.name.trim(),
        quantity: Number.isFinite(quantityValue) ? quantityValue : undefined,
        price: Number.isFinite(priceValue) ? priceValue : undefined,
        market: newItem.market.trim() || undefined,
        unitOfMeasure: newItem.unitOfMeasure,
      });
      setNewItem({ name: "", quantity: "", price: "", market: "", unitOfMeasure: "UN" });
      setIsAddModalOpen(false);
      await loadList();
    });
  };

  const handleUpdateItem = async (itemId: string) => {
    const quantityValue = editingItem.quantity.trim() ? Number(editingItem.quantity) : null;
    const priceValue = editingItem.price.trim() ? Number(editingItem.price) : null;
    await runAction(async () => {
      await api.updateItem(listId, itemId, {
        name: editingItem.name.trim(),
        quantity: Number.isFinite(quantityValue) ? quantityValue : null,
        price: Number.isFinite(priceValue) ? priceValue : null,
        market: editingItem.market.trim() || null,
        unitOfMeasure: editingItem.unitOfMeasure,
      });
      setEditingItemId(null);
      setEditingItem({ name: "", quantity: "", price: "", market: "", unitOfMeasure: "UN" });
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
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  value={listName}
                  onChange={(event) => setListName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleRenameList().then(() => setIsEditingTitle(false));
                    }
                    if (event.key === "Escape") {
                      setListName(list.name);
                      setIsEditingTitle(false);
                    }
                  }}
                  className="h-9 text-base font-semibold"
                  aria-label="Editar nome da lista"
                />
                <Button
                  type="button"
                  onClick={() => handleRenameList().then(() => setIsEditingTitle(false))}
                  aria-label="Salvar nome da lista"
                  size="icon"
                >
                  <Check className="size-4" aria-hidden />
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setListName(list.name);
                    setIsEditingTitle(false);
                  }}
                  aria-label="Cancelar edicao do nome"
                  size="icon"
                  variant="outline"
                >
                  <X className="size-4" aria-hidden />
                </Button>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-semibold">{list.name}</h1>
                {isOwner ? (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={() => setIsEditingTitle(true)}
                      aria-label="Editar nome da lista"
                      size="icon"
                      variant="outline"
                    >
                      <Pencil className="size-4" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setIsShareModalOpen(true)}
                      aria-label="Compartilhar lista"
                      size="icon"
                      variant="outline"
                    >
                      <Share2 className="size-4" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      onClick={handleDeleteList}
                      aria-label="Excluir lista"
                      size="icon"
                      variant="outline"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </div>
          {list.owner ? (
            <p className="text-xs text-muted-foreground">Owner: {list.owner.email}</p>
          ) : null}
        </div>
        <Link href="/" className="text-sm text-muted-foreground">
          Voltar
        </Link>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      

      <section className="mb-6 rounded border p-3">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium">Itens</h2>
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
                  <div className="flex w-full flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                      # {item.quantity ?? "-"} {formatUnit(item.unitOfMeasure)}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                      {formatUnit(item.unitOfMeasure)}
                    </span>
                    {item.price != null ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        R$ {formatPrice(item.price)} / {formatUnit(item.unitOfMeasure)}
                      </span>
                    ) : null}
                    {item.market ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        {item.market}
                      </span>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    className="ml-auto"
                    onClick={() => {
                      setEditingItemId(item.id);
                      setEditingItem({
                        name: item.name,
                        quantity: item.quantity?.toString() ?? "",
                        price: item.price?.toString() ?? "",
                        market: item.market ?? "",
                        unitOfMeasure: item.unitOfMeasure,
                      });
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    Remover
                  </Button>
                </div>

                {editingItemId === item.id ? (
                  <div className="mt-2 grid gap-2 sm:grid-cols-6">
                    <Input
                      value={editingItem.name}
                      onChange={(event) => setEditingItem((prev) => ({ ...prev, name: event.target.value }))}
                    />
                    <Input
                      value={editingItem.quantity}
                      onChange={(event) => setEditingItem((prev) => ({ ...prev, quantity: event.target.value }))}
                    />
                    <Input
                      onChange={(event) =>
                        setEditingItem((prev) => ({
                          ...prev,
                          price: parsePriceInput(event.target.value),
                        }))
                      }
                      inputMode="decimal"
                      value={formatPriceInput(editingItem.price)}
                      aria-label="Preco"
                    />
                    <Input
                      value={editingItem.market}
                      onChange={(event) => setEditingItem((prev) => ({ ...prev, market: event.target.value }))}
                      placeholder="Mercado"
                    />
                    <select
                      value={editingItem.unitOfMeasure}
                      onChange={(event) =>
                        setEditingItem((prev) => ({
                          ...prev,
                          unitOfMeasure: event.target.value as UnitOfMeasure,
                        }))
                      }
                      className="h-9 rounded border bg-background px-3 text-sm"
                    >
                      <option value="UN">Unidade (un)</option>
                      <option value="KG">Quilograma (kg)</option>
                      <option value="ML">Mililitro (ml)</option>
                    </select>
                    <Button type="button" size="sm" onClick={() => handleUpdateItem(item.id)}>
                      Salvar
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <Button
        type="button"
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-20 right-6 z-50 h-12 w-12 rounded-full shadow-lg"
        aria-label="Adicionar item"
      >
        <Plus className="size-5" aria-hidden />
      </Button>

      {isAddModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-lg border bg-card p-4 text-foreground shadow"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="mb-3 text-lg font-medium">Adicionar item</h2>
            <div className="grid gap-3">
              <Input
                ref={addItemInputRef}
                value={newItem.name}
                onChange={(event) => setNewItem((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Item"
              />
              <select
                value={newItem.unitOfMeasure}
                onChange={(event) =>
                  setNewItem((prev) => ({
                    ...prev,
                    unitOfMeasure: event.target.value as UnitOfMeasure,
                  }))
                }
                className="h-9 rounded border bg-background px-3 text-sm"
              >
                <option value="UN">Unidade (un)</option>
                <option value="KG">Quilograma (kg)</option>
                <option value="ML">Mililitro (ml)</option>
              </select>
              <Input
                value={newItem.quantity}
                onChange={(event) => setNewItem((prev) => ({ ...prev, quantity: event.target.value }))}
                placeholder="Qtd"
              />
              <Input
                value={formatPriceInput(newItem.price)}
                onChange={(event) =>
                  setNewItem((prev) => ({
                    ...prev,
                    price: parsePriceInput(event.target.value),
                  }))
                }
                inputMode="decimal"
                aria-label="Preco"
              />
              <Input
                value={newItem.market}
                onChange={(event) => setNewItem((prev) => ({ ...prev, market: event.target.value }))}
                placeholder="Mercado"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleAddItem}>
                Adicionar
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isOwner && isShareModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          onClick={() => setIsShareModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-lg border bg-card p-4 text-foreground shadow"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="mb-3 text-lg font-medium">Compartilhar lista</h2>
            <div className="mb-4 flex gap-2">
              <Input
                ref={shareEmailInputRef}
                value={newShareEmail}
                onChange={(event) => setNewShareEmail(event.target.value)}
                placeholder="Email do participante"
                className="flex-1"
              />
              <Button type="button" onClick={handleShare}>
                Compartilhar
              </Button>
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
                    <Button type="button" size="xs" variant="ghost" onClick={() => handleRemoveShare(share.id)}>
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <Button type="button" variant="outline" onClick={() => setIsShareModalOpen(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
