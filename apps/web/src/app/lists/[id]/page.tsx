import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authClient } from "@/lib/auth-client";

import ListDetail from "./list-detail";

export default async function ListPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
      throw: true,
    },
  });

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  return <ListDetail listId={id} />;
}
