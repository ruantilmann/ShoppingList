import fastifyCors from "@fastify/cors";
import { auth } from "@ShoppingList/auth";
import prisma from "@ShoppingList/db";
import { env } from "@ShoppingList/env/server";
import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import { z } from "zod";

import { emailUtils, getAuthUser } from "./lib/auth";

const baseCorsConfig = {
  origin: env.CORS_ORIGIN,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  maxAge: 86400,
};

const fastify = Fastify({
  logger: true,
});

fastify.register(fastifyCors, baseCorsConfig);

const requireUser = async (request: FastifyRequest, reply: FastifyReply) => {
  const user = await getAuthUser(request);
  if (!user) {
    reply.status(401).send({ error: "Unauthorized" });
    return null;
  }
  return user;
};

const listAccessSchema = z.object({
  id: z.string().min(1),
});

const listItemParamsSchema = z.object({
  id: z.string().min(1),
  itemId: z.string().min(1),
});

const listCreateSchema = z.object({
  name: z.string().min(1).max(120),
});

const itemCreateSchema = z.object({
  name: z.string().min(1).max(200),
  quantity: z.coerce.number().finite().optional(),
  unit: z.string().max(40).optional(),
});

const itemUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  quantity: z.coerce.number().finite().optional().nullable(),
  unit: z.string().max(40).optional().nullable(),
});

const itemCheckSchema = z.object({
  checked: z.boolean(),
});

const shareCreateSchema = z.object({
  email: z.string().email(),
});

const isListOwner = (list: { ownerId: string }, userId: string) => list.ownerId === userId;

const getListWithAccess = async (listId: string, userId: string) => {
  const list = await prisma.shoppingList.findUnique({
    where: { id: listId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
    },
  });

  if (!list) return null;

  if (list.ownerId === userId) {
    return { list, role: "OWNER" };
  }

  const share = await prisma.listShare.findFirst({
    where: {
      listId,
      inviteeUserId: userId,
      status: "ACTIVE",
    },
  });

  if (!share) return null;

  return { list, role: "PARTICIPANT" };
};

fastify.route({
  method: ["GET", "POST"],
  url: "/api/auth/*",
  async handler(request, reply) {
    try {
      const url = new URL(request.url, `http://${request.headers.host}`);
      const headers = new Headers();
      Object.entries(request.headers).forEach(([key, value]) => {
        if (value) headers.append(key, value.toString());
      });
      const req = new Request(url.toString(), {
        method: request.method,
        headers,
        body: request.body ? JSON.stringify(request.body) : undefined,
      });
      const response = await auth.handler(req);
      reply.status(response.status);
      response.headers.forEach((value, key) => reply.header(key, value));
      reply.send(response.body ? await response.text() : null);
    } catch (error) {
      fastify.log.error({ err: error }, "Authentication Error:");
      reply.status(500).send({
        error: "Internal authentication error",
        code: "AUTH_FAILURE",
      });
    }
  },
});

fastify.get("/lists", async (request, reply) => {
  const user = await requireUser(request, reply);
  if (!user) return;

  const lists = await prisma.shoppingList.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { items: true } },
    },
  });

  reply.send({ lists });
});

fastify.get("/lists/shared", async (request, reply) => {
  const user = await requireUser(request, reply);
  if (!user) return;

  const lists = await prisma.shoppingList.findMany({
    where: {
      shares: { some: { inviteeUserId: user.id, status: "ACTIVE" } },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { items: true } },
    },
  });

  reply.send({ lists });
});

fastify.post("/lists", async (request, reply) => {
  const user = await requireUser(request, reply);
  if (!user) return;

  const parsed = listCreateSchema.safeParse(request.body);
  if (!parsed.success) {
    reply.status(400).send({ error: "Invalid payload" });
    return;
  }

  const list = await prisma.shoppingList.create({
    data: {
      name: parsed.data.name.trim(),
      ownerId: user.id,
    },
  });

  reply.status(201).send({ list });
});

fastify.get("/lists/:id", async (request, reply) => {
  const user = await requireUser(request, reply);
  if (!user) return;

  const parsedParams = listAccessSchema.safeParse(request.params);
  if (!parsedParams.success) {
    reply.status(400).send({ error: "Invalid list id" });
    return;
  }

  const access = await getListWithAccess(parsedParams.data.id, user.id);
  if (!access) {
    reply.status(404).send({ error: "List not found" });
    return;
  }

  const list = await prisma.shoppingList.findUnique({
    where: { id: access.list.id },
    include: {
      items: { orderBy: { createdAt: "asc" } },
      owner: { select: { id: true, name: true, email: true } },
    },
  });

  reply.send({
    list,
    role: access.role,
  });
});

fastify.patch("/lists/:id", async (request, reply) => {
  const user = await requireUser(request, reply);
  if (!user) return;

  const parsedParams = listAccessSchema.safeParse(request.params);
  const parsedBody = listCreateSchema.safeParse(request.body);
  if (!parsedParams.success || !parsedBody.success) {
    reply.status(400).send({ error: "Invalid payload" });
    return;
  }

  const list = await prisma.shoppingList.findUnique({
    where: { id: parsedParams.data.id },
  });

  if (!list) {
    reply.status(404).send({ error: "List not found" });
    return;
  }

  if (!isListOwner(list, user.id)) {
    reply.status(403).send({ error: "Forbidden" });
    return;
  }

  const updated = await prisma.shoppingList.update({
    where: { id: list.id },
    data: { name: parsedBody.data.name.trim() },
  });

  reply.send({ list: updated });
});

fastify.delete("/lists/:id", async (request, reply) => {
  const user = await requireUser(request, reply);
  if (!user) return;

  const parsedParams = listAccessSchema.safeParse(request.params);
  if (!parsedParams.success) {
    reply.status(400).send({ error: "Invalid list id" });
    return;
  }

  const list = await prisma.shoppingList.findUnique({
    where: { id: parsedParams.data.id },
  });

  if (!list) {
    reply.status(404).send({ error: "List not found" });
    return;
  }

  if (!isListOwner(list, user.id)) {
    reply.status(403).send({ error: "Forbidden" });
    return;
  }

  await prisma.shoppingList.delete({ where: { id: list.id } });
  reply.status(204).send();
});

fastify.post("/lists/:id/items", async (request, reply) => {
  const user = await requireUser(request, reply);
  if (!user) return;

  const parsedParams = listAccessSchema.safeParse(request.params);
  const parsedBody = itemCreateSchema.safeParse(request.body);
  if (!parsedParams.success || !parsedBody.success) {
    reply.status(400).send({ error: "Invalid payload" });
    return;
  }

  const access = await getListWithAccess(parsedParams.data.id, user.id);
  if (!access) {
    reply.status(404).send({ error: "List not found" });
    return;
  }

  const item = await prisma.shoppingItem.create({
    data: {
      listId: access.list.id,
      name: parsedBody.data.name.trim(),
      quantity: parsedBody.data.quantity ?? null,
      unit: parsedBody.data.unit?.trim() || null,
    },
  });

  reply.status(201).send({ item });
});

fastify.patch("/lists/:id/items/:itemId", async (request, reply) => {
  const user = await requireUser(request, reply);
  if (!user) return;

  const parsedParams = listItemParamsSchema.safeParse(request.params);
  const parsedBody = itemUpdateSchema.safeParse(request.body);
  if (!parsedParams.success || !parsedBody.success) {
    reply.status(400).send({ error: "Invalid payload" });
    return;
  }

  const access = await getListWithAccess(parsedParams.data.id, user.id);
  if (!access) {
    reply.status(404).send({ error: "List not found" });
    return;
  }

  const item = await prisma.shoppingItem.findFirst({
    where: { id: parsedParams.data.itemId, listId: access.list.id },
  });

  if (!item) {
    reply.status(404).send({ error: "Item not found" });
    return;
  }

  const updated = await prisma.shoppingItem.update({
    where: { id: item.id },
    data: {
      name: parsedBody.data.name?.trim() ?? undefined,
      quantity: parsedBody.data.quantity === undefined ? undefined : parsedBody.data.quantity,
      unit: parsedBody.data.unit === undefined ? undefined : parsedBody.data.unit?.trim() || null,
    },
  });

  reply.send({ item: updated });
});

fastify.patch("/lists/:id/items/:itemId/check", async (request, reply) => {
  const user = await requireUser(request, reply);
  if (!user) return;

  const parsedParams = listItemParamsSchema.safeParse(request.params);
  const parsedBody = itemCheckSchema.safeParse(request.body);
  if (!parsedParams.success || !parsedBody.success) {
    reply.status(400).send({ error: "Invalid payload" });
    return;
  }

  const access = await getListWithAccess(parsedParams.data.id, user.id);
  if (!access) {
    reply.status(404).send({ error: "List not found" });
    return;
  }

  const item = await prisma.shoppingItem.findFirst({
    where: { id: parsedParams.data.itemId, listId: access.list.id },
  });

  if (!item) {
    reply.status(404).send({ error: "Item not found" });
    return;
  }

  const updated = await prisma.shoppingItem.update({
    where: { id: item.id },
    data: { checked: parsedBody.data.checked },
  });

  reply.send({ item: updated });
});

fastify.delete("/lists/:id/items/:itemId", async (request, reply) => {
  const user = await requireUser(request, reply);
  if (!user) return;

  const parsedParams = listItemParamsSchema.safeParse(request.params);
  if (!parsedParams.success) {
    reply.status(400).send({ error: "Invalid payload" });
    return;
  }

  const access = await getListWithAccess(parsedParams.data.id, user.id);
  if (!access) {
    reply.status(404).send({ error: "List not found" });
    return;
  }

  const item = await prisma.shoppingItem.findFirst({
    where: { id: parsedParams.data.itemId, listId: access.list.id },
  });

  if (!item) {
    reply.status(404).send({ error: "Item not found" });
    return;
  }

  await prisma.shoppingItem.delete({ where: { id: item.id } });
  reply.status(204).send();
});

fastify.post("/lists/:id/share", async (request, reply) => {
  const user = await requireUser(request, reply);
  if (!user) return;

  const parsedParams = listAccessSchema.safeParse(request.params);
  const parsedBody = shareCreateSchema.safeParse(request.body);
  if (!parsedParams.success || !parsedBody.success) {
    reply.status(400).send({ error: "Invalid payload" });
    return;
  }

  const list = await prisma.shoppingList.findUnique({
    where: { id: parsedParams.data.id },
  });

  if (!list) {
    reply.status(404).send({ error: "List not found" });
    return;
  }

  if (!isListOwner(list, user.id)) {
    reply.status(403).send({ error: "Forbidden" });
    return;
  }

  const email = emailUtils.normalize(parsedBody.data.email);
  if (email === user.email) {
    reply.status(400).send({ error: "Owner already has access" });
    return;
  }

  const inviteeUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  const existing = await prisma.listShare.findUnique({
    where: { listId_inviteeEmail: { listId: list.id, inviteeEmail: email } },
  });

  if (existing) {
    const updated = await prisma.listShare.update({
      where: { id: existing.id },
      data: {
        inviteeUserId: inviteeUser?.id ?? existing.inviteeUserId,
        status: inviteeUser ? "ACTIVE" : existing.status,
      },
    });
    reply.send({ share: updated });
    return;
  }

  const share = await prisma.listShare.create({
    data: {
      listId: list.id,
      inviterId: user.id,
      inviteeEmail: email,
      inviteeUserId: inviteeUser?.id,
      role: "PARTICIPANT",
      status: inviteeUser ? "ACTIVE" : "PENDING",
    },
  });

  reply.status(201).send({ share });
});

fastify.get("/lists/:id/shares", async (request, reply) => {
  const user = await requireUser(request, reply);
  if (!user) return;

  const parsedParams = listAccessSchema.safeParse(request.params);
  if (!parsedParams.success) {
    reply.status(400).send({ error: "Invalid list id" });
    return;
  }

  const list = await prisma.shoppingList.findUnique({
    where: { id: parsedParams.data.id },
  });

  if (!list) {
    reply.status(404).send({ error: "List not found" });
    return;
  }

  if (!isListOwner(list, user.id)) {
    reply.status(403).send({ error: "Forbidden" });
    return;
  }

  const shares = await prisma.listShare.findMany({
    where: { listId: list.id },
    orderBy: { createdAt: "desc" },
    include: {
      inviteeUser: { select: { id: true, name: true, email: true } },
    },
  });

  reply.send({ shares });
});

fastify.delete("/lists/:id/shares/:shareId", async (request, reply) => {
  const user = await requireUser(request, reply);
  if (!user) return;

  const parsedParams = z
    .object({ id: z.string().min(1), shareId: z.string().min(1) })
    .safeParse(request.params);
  if (!parsedParams.success) {
    reply.status(400).send({ error: "Invalid payload" });
    return;
  }

  const list = await prisma.shoppingList.findUnique({
    where: { id: parsedParams.data.id },
  });

  if (!list) {
    reply.status(404).send({ error: "List not found" });
    return;
  }

  if (!isListOwner(list, user.id)) {
    reply.status(403).send({ error: "Forbidden" });
    return;
  }

  await prisma.listShare.delete({ where: { id: parsedParams.data.shareId } });
  reply.status(204).send();
});

fastify.get("/", async () => {
  return "OK";
});

fastify.listen({ port: 3000 }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log("Server running on port 3000");
});
