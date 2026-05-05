# syntax=docker/dockerfile:1.7
#
# Imagem multi-stage do frontend Next.js 16.
#
#   1) deps    -> instala dependências
#   2) build   -> compila Next em modo "standalone" (output isolado)
#   3) runtime -> imagem final só com o servidor standalone (sem node_modules)
#
# Requer "output: 'standalone'" no next.config.ts (Next gera .next/standalone
# pronto para rodar com `node server.js`).

# ---------- 1) Deps ----------
FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm ci

# ---------- 2) Build ----------
FROM node:20-alpine AS build
WORKDIR /app

RUN apk add --no-cache libc6-compat

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Garante que `public/` exista — o projeto não usa assets estáticos hoje,
# mas o COPY do estágio runtime aponta para ela. Sem isso o build falha com
# "/app/public not found".
RUN mkdir -p ./public

# NEXT_PUBLIC_* precisa estar disponível em build time porque é
# embutido no bundle do cliente.
ARG NEXT_PUBLIC_API_URL=http://localhost:3333/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# ---------- 3) Runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app

RUN apk add --no-cache tini \
    && addgroup --system --gid 1001 nodejs \
    && adduser  --system --uid 1001 --ingroup nodejs nextjs

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Garante que public/ existe mesmo que esteja vazia no build
RUN mkdir -p ./public

COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
