# syntax=docker/dockerfile:1.7
#
# Imagem multi-stage do backend NestJS + Prisma.
#
#   1) deps    -> instala todas as dependências (inclui dev) no cache
#   2) build   -> gera o cliente Prisma e compila TypeScript -> dist/
#   3) runtime -> imagem final que roda migrations e sobe a API
#
# A CLI do Prisma vive em devDependencies, mas precisamos dela em runtime
# para `prisma migrate deploy`. Copiamos node_modules do estágio de build,
# prunamos as devDeps e reinstalamos apenas prisma + dotenv (o mínimo para
# migrate deploy + prisma.config.ts).

# ---------- 1) Deps ----------
FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY package.json package-lock.json ./
RUN npm ci

# ---------- 2) Build ----------
FROM node:20-alpine AS build
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN ./node_modules/.bin/prisma generate --schema=./prisma/schema.prisma
RUN npm run build

# Mantemos @prisma/client + deps de runtime, mais:
#  - prisma (CLI)  -> roda `migrate deploy` no startup
#  - dotenv        -> exigido pelo prisma.config.ts
# ts-node/tsconfig-paths/typescript só são necessários para `prisma db seed`,
# que não é executado no container de produção.
RUN npm prune --omit=dev \
    && npm install --no-save --no-package-lock \
        prisma@^6.5.0 dotenv@^16

# ---------- 3) Runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat tini \
    && addgroup --system --gid 1001 nodejs \
    && adduser  --system --uid 1001 --ingroup nodejs nestjs

ENV NODE_ENV=production \
    PORT=3333

COPY --chown=nestjs:nodejs --from=build /app/node_modules     ./node_modules
COPY --chown=nestjs:nodejs --from=build /app/dist             ./dist
COPY --chown=nestjs:nodejs --from=build /app/prisma           ./prisma
COPY --chown=nestjs:nodejs --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --chown=nestjs:nodejs --from=build /app/tsconfig.json    ./tsconfig.json
COPY --chown=nestjs:nodejs --from=build /app/package.json     ./

USER nestjs

EXPOSE 3333

# tini garante handling correto de sinais (SIGTERM, SIGINT).
# `exec node` substitui o shell pelo processo node, tornando-o filho direto
# do tini — SIGTERM chega ao node sem intermediários.
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy --schema=./prisma/schema.prisma && exec node dist/main"]
