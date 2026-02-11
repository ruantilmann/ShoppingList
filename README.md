# ShoppingList

Lista de compras colaborativa com login Google, CRUD de listas/itens e compartilhamento por email.

## Stack
- Next.js (apps/web)
- Fastify (apps/server)
- Prisma + Postgres (packages/db)
- better-auth (packages/auth)
- Turborepo
- PWA

## Estrutura do Monorepo
```
apps/
  web/      Next.js
  server/   Fastify
packages/
  auth/     better-auth
  db/       Prisma + Docker
  env/      Validacao de env
```

## Fluxo Geral
1. Login Google
2. Home: "Minhas Listas" e "Listas Compartilhadas"
3. Lista: itens (CRUD + check)
4. Compartilhamento: owner convida por email
5. Convites pendentes sao aceitos no primeiro login do email

## Setup Local
1. Clonar o repositorio
2. Criar `.env` a partir de `.env.example`
   - `apps/server/.env`
   - `apps/web/.env`
3. Subir o banco
   ```bash
   npm run db:start
   ```
4. Rodar migrations
   ```bash
   npm run db:migrate
   ```
5. Rodar o projeto
   ```bash
   npm run dev
   ```

Web: http://localhost:3001
API: http://localhost:3000

## Scripts Principais
- `npm run dev`
- `npm run dev:web`
- `npm run dev:server`
- `npm run db:start`
- `npm run db:migrate`
- `npm run db:generate`
- `npm run db:studio`

## Observacoes
- Configure Google OAuth (Client ID/Secret) no `.env`.
- O email do Google e a chave unica de usuario.
- O owner e o unico que pode excluir lista e gerenciar compartilhamentos.
