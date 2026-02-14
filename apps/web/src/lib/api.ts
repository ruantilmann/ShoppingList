import { env } from "@ShoppingList/env/web";

type ApiError = { error?: string };

const API_BASE = env.NEXT_PUBLIC_SERVER_URL;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.status === 204) {
    return null as T;
  }

  const data = (await response.json().catch(() => ({}))) as T & ApiError;

  if (!response.ok) {
    throw new Error(data?.error || "Request failed");
  }

  return data as T;
}

export const api = {
  getLists: () => request<{ lists: Array<any> }>("/lists"),
  getSharedLists: () => request<{ lists: Array<any> }>("/lists/shared"),
  createList: (name: string) =>
    request<{ list: any }>("/lists", { method: "POST", body: JSON.stringify({ name }) }),
  updateList: (id: string, name: string) =>
    request<{ list: any }>(`/lists/${id}`, { method: "PATCH", body: JSON.stringify({ name }) }),
  deleteList: (id: string) => request<void>(`/lists/${id}`, { method: "DELETE" }),
  getList: (id: string) => request<{ list: any; role: "OWNER" | "PARTICIPANT" }>(`/lists/${id}`),
  createItem: (
    listId: string,
    payload: {
      name: string;
      quantity?: number;
      price?: number;
      market?: string;
      unitOfMeasure: "KG" | "ML" | "UN";
    },
  ) =>
    request<{ item: any }>(`/lists/${listId}/items`, { method: "POST", body: JSON.stringify(payload) }),
  updateItem: (
    listId: string,
    itemId: string,
    payload: {
      name?: string;
      quantity?: number | null;
      price?: number | null;
      market?: string | null;
      unitOfMeasure?: "KG" | "ML" | "UN";
    },
  ) =>
    request<{ item: any }>(`/lists/${listId}/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  checkItem: (listId: string, itemId: string, checked: boolean) =>
    request<{ item: any }>(`/lists/${listId}/items/${itemId}/check`, {
      method: "PATCH",
      body: JSON.stringify({ checked }),
    }),
  deleteItem: (listId: string, itemId: string) =>
    request<void>(`/lists/${listId}/items/${itemId}`, { method: "DELETE" }),
  shareList: (listId: string, email: string) =>
    request<{ share: any }>(`/lists/${listId}/share`, {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  getShares: (listId: string) => request<{ shares: Array<any> }>(`/lists/${listId}/shares`),
  deleteShare: (listId: string, shareId: string) =>
    request<void>(`/lists/${listId}/shares/${shareId}`, { method: "DELETE" }),
};
