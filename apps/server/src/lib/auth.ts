import type { FastifyRequest } from "fastify";

import { auth } from "@ShoppingList/auth";
import prisma from "@ShoppingList/db";

type HeadersInitLike = Record<string, string | string[] | undefined>;

export type AuthUser = {
  id: string;
  email: string;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

async function acceptPendingInvites(user: AuthUser) {
  await prisma.listShare.updateMany({
    where: {
      inviteeEmail: user.email,
      status: "PENDING",
    },
    data: {
      inviteeUserId: user.id,
      status: "ACTIVE",
    },
  });
}

export async function getAuthUser(request: FastifyRequest): Promise<AuthUser | null> {
  const session = await auth.api.getSession({
    headers: request.headers as HeadersInitLike,
  });

  if (!session?.user?.id || !session.user.email) {
    return null;
  }

  const user = {
    id: session.user.id,
    email: normalizeEmail(session.user.email),
  };

  await acceptPendingInvites(user);

  return user;
}

export const emailUtils = {
  normalize: normalizeEmail,
};
