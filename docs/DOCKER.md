# Docker — Guia completo do projeto

Este documento explica **todos os arquivos Docker** do projeto, como usá-los e o **porquê de cada decisão**. O objetivo é servir tanto como referência rápida quanto como material de aprendizado.

---

## Sumário

- [Visão geral dos arquivos](#visão-geral-dos-arquivos)
- [Como rodar](#como-rodar)
  - [Opção 1 — Só o banco (dev local)](#opção-1--só-o-banco-dev-local)
  - [Opção 2 — Stack completa em produção](#opção-2--stack-completa-em-produção)
  - [Opção 3 — Stack completa em desenvolvimento (hot-reload)](#opção-3--stack-completa-em-desenvolvimento-hot-reload)
- [Aprendendo com cada arquivo](#aprendendo-com-cada-arquivo)
  - [docker-compose.yml](#docker-composeyml)
  - [docker-compose.dev.yml](#docker-composedevyml)
  - [backend/Dockerfile](#backendDockerfile)
  - [backend/Dockerfile.dev](#backendDockerfiledev)
  - [frontend/Dockerfile](#frontendDockerfile)
  - [frontend/Dockerfile.dev](#frontendDockerfiledev)
  - [.dockerignore](#dockerignore)
- [Conceitos Docker explicados](#conceitos-docker-explicados)
  - [Imagem vs Container](#imagem-vs-container)
  - [Multi-stage build](#multi-stage-build)
  - [Docker Compose](#docker-compose)
  - [Healthcheck](#healthcheck)
  - [Profiles](#profiles)
  - [Volumes](#volumes)
  - [Networks](#networks)
  - [Variáveis de ambiente e build args](#variáveis-de-ambiente-e-build-args)
  - [tini — o gerenciador de sinais](#tini--o-gerenciador-de-sinais)
  - [.dockerignore](#dockerignore-1)
- [Comandos úteis do dia a dia](#comandos-úteis-do-dia-a-dia)
- [Troubleshooting](#troubleshooting)

---

## Visão geral dos arquivos

```
raiz/
├── docker-compose.yml          # Produção: só banco (padrão) ou stack completa (--profile app)
├── docker-compose.dev.yml      # Desenvolvimento: stack completa com hot-reload
│
├── backend/
│   ├── Dockerfile              # Imagem de produção do backend (NestJS + Prisma)
│   ├── Dockerfile.dev          # Imagem de desenvolvimento do backend
│   └── .dockerignore           # Arquivos excluídos do contexto de build do backend
│
└── frontend/
    ├── Dockerfile              # Imagem de produção do frontend (Next.js standalone)
    ├── Dockerfile.dev          # Imagem de desenvolvimento do frontend
    └── .dockerignore           # Arquivos excluídos do contexto de build do frontend
```

---

## Como rodar

### Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (inclui Docker Compose v2)
- Para a Opção 1: Node.js 20+ e npm 10+

---

### Opção 1 — Só o banco (dev local)

**Quando usar:** você quer rodar backend e frontend direto no seu terminal com hot-reload nativo, e só precisa do PostgreSQL containerizado.

```bash
# Na raiz do projeto
docker compose up -d
```

Isso sobe **apenas** o container `au_postgres` (PostgreSQL 16) na porta `5432`.

Em seguida, em terminais separados:

```bash
# Terminal 1 — Backend
cd backend
cp .env.example .env       # só na primeira vez
npm install                 # só na primeira vez
npm run start:dev
```

```bash
# Terminal 2 — Frontend
cd frontend
cp .env.example .env       # só na primeira vez
npm install                 # só na primeira vez
npm run dev
```

| Serviço  | URL                          |
|----------|------------------------------|
| Backend  | http://localhost:3333/api    |
| Frontend | http://localhost:3000        |
| Banco    | localhost:5432               |

Para parar o banco:

```bash
docker compose down
```

---

### Opção 2 — Stack completa em produção

**Quando usar:** quer testar exatamente como a aplicação roda em produção, ou entregar para alguém sem Node.js instalado.

```bash
docker compose --profile app up -d --build
```

Os três serviços sobem em ordem: `db` → `backend` → `frontend`.

- O backend aguarda o banco estar **saudável** antes de iniciar.
- O frontend aguarda o backend estar **saudável** antes de iniciar.
- O backend roda `prisma migrate deploy` automaticamente no startup.

| Container      | Porta    | URL                        |
|----------------|----------|----------------------------|
| `au_postgres`  | 5432     | —                          |
| `au_backend`   | 3333     | http://localhost:3333/api  |
| `au_frontend`  | 3000     | http://localhost:3000      |

Para popular dados de exemplo:

```bash
docker compose exec backend npx prisma db seed
```

Para parar e apagar tudo (incluindo o volume do banco):

```bash
docker compose --profile app down -v
```

Para parar sem apagar os dados:

```bash
docker compose --profile app down
```

---

### Opção 3 — Stack completa em desenvolvimento (hot-reload)

**Quando usar:** quer tudo no Docker mas com hot-reload — salvar um arquivo em `src/` reflete imediatamente sem rebuildar a imagem.

```bash
docker compose -f docker-compose.dev.yml up -d --build
```

| Container         | Porta    | URL                        |
|-------------------|----------|----------------------------|
| `au_postgres_dev` | **5433** | —                          |
| `au_backend_dev`  | 3333     | http://localhost:3333/api  |
| `au_frontend_dev` | 3000     | http://localhost:3000      |

> O banco usa a porta **5433** no host (não 5432) para não conflitar com uma instância local ou com a Opção 2 rodando ao mesmo tempo.

Quando mudar `package.json`, `prisma/schema.prisma` ou arquivos de configuração, é necessário rebuildar:

```bash
docker compose -f docker-compose.dev.yml up -d --build
```

Para parar:

```bash
docker compose -f docker-compose.dev.yml down
```

---

## Aprendendo com cada arquivo

### `docker-compose.yml`

O arquivo principal de orquestração. Define **quais serviços existem, como se comunicam e em qual ordem sobem**.

```yaml
name: au-tasks        # Nome do projeto — prefixo dos recursos criados
```

#### Serviço `db`

```yaml
db:
  image: postgres:16-alpine   # Usa imagem pronta do Docker Hub (sem Dockerfile próprio)
  container_name: au_postgres # Nome fixo — facilita referências no terminal
  restart: unless-stopped     # Reinicia automaticamente se o container morrer

  environment:
    POSTGRES_USER: ${POSTGRES_USER:-postgres}   # ${VAR:-default} lê do .env ou usa o default
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
    POSTGRES_DB: ${POSTGRES_DB:-au_tasks}

  ports:
    - "${POSTGRES_PORT:-5432}:5432"   # "porta-do-host:porta-do-container"

  volumes:
    - au_postgres_data:/var/lib/postgresql/data   # Persiste os dados entre restarts

  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U postgres -d au_tasks"]
    interval: 5s     # Verifica a cada 5 segundos
    timeout: 5s      # Considera falha se demorar mais de 5s
    retries: 10      # Após 10 falhas consecutivas, marca como "unhealthy"
```

#### Serviço `backend`

```yaml
backend:
  build:
    context: ./backend       # Pasta usada como contexto de build (onde está o Dockerfile)
    dockerfile: Dockerfile   # Nome do Dockerfile a usar

  profiles: ["app", "full"]  # Só sobe se --profile app ou --profile full for passado

  depends_on:
    db:
      condition: service_healthy   # Espera o healthcheck do db passar antes de iniciar

  environment:
    DATABASE_URL: postgresql://postgres:postgres@db:5432/au_tasks?schema=public
    #                                                   ^^
    #                                     "db" é o nome do serviço — o Docker resolve
    #                                     automaticamente para o IP do container

  healthcheck:
    test: ["CMD-SHELL", "wget -qO /dev/null http://localhost:3333/api/tasks || exit 1"]
    start_period: 30s   # Aguarda 30s antes de começar a contar falhas (tempo para migrations)
```

#### Serviço `frontend`

```yaml
frontend:
  build:
    args:
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-http://localhost:3333/api}
      # ARG é passado para dentro do Dockerfile durante o BUILD
      # (diferente de environment, que é só em runtime)

  depends_on:
    backend:
      condition: service_healthy   # Espera o backend estar saudável
```

---

### `docker-compose.dev.yml`

Arquivo independente — **não é um override** do `docker-compose.yml`. Roda com:

```bash
docker compose -f docker-compose.dev.yml up -d --build
```

As diferenças em relação ao compose de produção:

| Aspecto | Produção | Desenvolvimento |
|---|---|---|
| Banco — porta host | 5432 | **5433** (evita conflito) |
| Backend — Dockerfile | `Dockerfile` (multi-stage otimizado) | `Dockerfile.dev` (simples, com devDeps) |
| Frontend — Dockerfile | `Dockerfile` (standalone buildado) | `Dockerfile.dev` (next dev) |
| Código-fonte | Baked na imagem | **Montado como volume** (hot-reload) |
| `NODE_ENV` | `production` | `development` |
| Profiles | Necessário `--profile app` | Todos os serviços sobem por padrão |

O ponto-chave é a montagem de volumes para hot-reload:

```yaml
volumes:
  - ./backend/src:/app/src    # Pasta do host → pasta no container
  #  ^^^^^^^^^^^^^  ^^^^^^^^
  #  caminho relativo         caminho absoluto no container
```

Quando você salva um arquivo em `backend/src/`, o NestJS watcher dentro do container detecta a mudança e recompila automaticamente.

---

### `backend/Dockerfile`

Imagem de **produção** do backend. Usa **multi-stage build** com 3 estágios.

```dockerfile
# syntax=docker/dockerfile:1.7
# ^ Habilita funcionalidades avançadas do BuildKit
```

#### Estágio 1 — `deps`

```dockerfile
FROM node:20-alpine AS deps
# alpine = variante mínima do Linux (~5MB vs ~200MB da versão completa)

RUN apk add --no-cache openssl libc6-compat
# openssl: necessário para o Prisma se comunicar com o banco via TLS
# libc6-compat: compatibilidade de biblioteca C para binários do Prisma

COPY package.json package-lock.json ./
RUN npm ci
# npm ci (clean install): mais rápido e determinístico que npm install
# Usa exatamente as versões do package-lock.json — sem surpresas
```

**Por que estágio separado?** O Docker cacheia cada instrução. Se `package.json` não mudou, esse estágio não roda de novo — build muito mais rápido.

#### Estágio 2 — `build`

```dockerfile
FROM node:20-alpine AS build

COPY --from=deps /app/node_modules ./node_modules
# Copia node_modules do estágio anterior — não baixa de novo

COPY . .
# Copia o código-fonte (exceto o que está no .dockerignore)

RUN ./node_modules/.bin/prisma generate --schema=./prisma/schema.prisma
# Gera o Prisma Client tipado a partir do schema
# Deve ser feito antes de compilar o TypeScript

RUN npm run build
# Compila TypeScript → JavaScript em dist/

RUN npm prune --omit=dev \
    && npm install --no-save --no-package-lock prisma@^6.5.0 dotenv@^16
# npm prune --omit=dev: remove devDependencies do node_modules
# Depois reinstala só o que o runtime precisa:
#   - prisma: CLI para rodar `prisma migrate deploy` no startup
#   - dotenv: lido pelo prisma.config.ts
```

#### Estágio 3 — `runtime`

```dockerfile
FROM node:20-alpine AS runtime
# Imagem limpa — não herda nada dos estágios anteriores

RUN apk add --no-cache openssl libc6-compat tini \
    && addgroup --system --gid 1001 nodejs \
    && adduser  --system --uid 1001 --ingroup nodejs nestjs
# tini: gerenciador de sinais (explicado mais abaixo)
# Criamos um usuário não-root "nestjs" por segurança

COPY --chown=nestjs:nodejs --from=build /app/node_modules ./node_modules
COPY --chown=nestjs:nodejs --from=build /app/dist         ./dist
# --chown: o arquivo pertence ao usuário nestjs, não ao root
# --from=build: busca do estágio de build, não do host

USER nestjs
# Roda como não-root — boa prática de segurança

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy ... && exec node dist/main"]
# ENTRYPOINT: comando fixo que sempre roda (tini)
# CMD: argumento passado para o ENTRYPOINT
# `exec node`: substitui o shell pelo processo node, tornando-o filho direto do tini
```

**Por que multi-stage?** A imagem final (`runtime`) não tem o compilador TypeScript, as devDependencies, o código-fonte TypeScript nem o cache do npm. O resultado é uma imagem muito menor e mais segura.

---

### `backend/Dockerfile.dev`

Imagem simplificada para **desenvolvimento**. Não tem multi-stage porque não precisamos otimizar tamanho — priorizamos velocidade de rebuild.

```dockerfile
FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci
# Instala TODAS as deps (incluindo devDependencies)
# TypeScript, ts-node, nest CLI — tudo necessário para --watch

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
# Copiamos configs e schema do Prisma, mas NÃO copiamos src/
# src/ será montado pelo docker-compose.dev.yml como volume

RUN ./node_modules/.bin/prisma generate --schema=./prisma/schema.prisma

CMD ["sh", "-c", "prisma migrate deploy && exec npm run start:dev"]
# npm run start:dev → nest start --watch
# O NestJS observa mudanças em src/ e recompila automaticamente
```

---

### `frontend/Dockerfile`

Imagem de **produção** do frontend. Usa o modo `standalone` do Next.js.

#### Estágio 2 — `build`

```dockerfile
ARG NEXT_PUBLIC_API_URL=http://localhost:3333/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
```

**Ponto importante:** variáveis `NEXT_PUBLIC_*` são **embutidas no bundle JavaScript** durante o build. O browser que executar o JS vai usar o valor que estava em `NEXT_PUBLIC_API_URL` no momento do `npm run build`, não o valor em runtime.

Por isso o Compose passa essa variável como `build arg`, não só como `environment`.

```dockerfile
RUN mkdir -p ./public
# Garante que o diretório public/ existe (mesmo que vazio)
# Necessário porque o estágio runtime tenta copiar esse diretório
```

#### Estágio 3 — `runtime`

```dockerfile
RUN mkdir -p ./public   # Garante existência mesmo com public vazio

COPY --from=build /app/public          ./public
COPY --from=build /app/.next/standalone ./
# Next.js standalone: um server.js autocontido com TUDO que precisa para rodar
# sem node_modules (graças ao output tracing do Next)

COPY --from=build /app/.next/static ./.next/static
# Arquivos estáticos (JS, CSS) servidos pelo server.js

CMD ["node", "server.js"]
# server.js foi gerado pelo Next.js em modo standalone
```

O modo standalone do Next.js analisa todas as importações em tempo de build e gera um `server.js` com apenas as dependências realmente usadas. A imagem final não tem `node_modules` — economiza centenas de MB.

Para ativá-lo, é necessário no `next.config.ts`:
```ts
export default { output: 'standalone' }
```

---

### `frontend/Dockerfile.dev`

```dockerfile
COPY next.config.ts tsconfig.json postcss.config.mjs components.json ./
RUN mkdir -p ./public
# Copiamos apenas os arquivos de configuração necessários para o Next.js
# src/ é montado como volume pelo compose

CMD ["npm", "run", "dev"]
# next dev --turbopack: servidor de desenvolvimento com HMR
# Em dev, NEXT_PUBLIC_* é lido do ambiente em runtime — não precisa de build arg
```

---

### `.dockerignore`

Funciona como `.gitignore`, mas para o **contexto de build do Docker**. Quando você roda `docker build`, o Docker empacota todos os arquivos da pasta (`context`) e os envia para o daemon — o `.dockerignore` exclui o que não é necessário.

**Backend `.dockerignore`** — o que é excluído e por quê:

| Padrão | Motivo |
|---|---|
| `node_modules` | Reinstalados dentro do container pelo `npm ci` |
| `dist` | Recompilado dentro do container pelo `npm run build` |
| `.env`, `.env.*` | Variáveis sensíveis — injetadas pelo Compose em runtime |
| `!.env.example` | Exceção: o arquivo de exemplo pode entrar (sem segredos) |
| `__tests__`, `__mocks__`, `*.spec.ts` | Testes não são necessários em produção |
| `Dockerfile`, `Dockerfile.dev` | O próprio Dockerfile não precisa estar dentro da imagem |
| `docker-compose*.yml` | Idem |
| `README.md` | Documentação não faz parte da imagem |

**Sem `.dockerignore`**, o `node_modules` do host (potencialmente GBs) seria enviado ao daemon e depois ignorado pelo `COPY`. O build seria muito mais lento.

---

## Conceitos Docker explicados

### Imagem vs Container

- **Imagem**: um "snapshot" imutável do sistema de arquivos. Criada pelo `docker build`. É o "molde".
- **Container**: uma instância em execução de uma imagem. Criado pelo `docker run` ou Docker Compose. É a "cópia viva".

Você pode ter uma imagem `au-tasks-backend:latest` e rodar 10 containers a partir dela.

### Multi-stage build

Permite ter **múltiplos `FROM`** no mesmo Dockerfile, cada um chamado de "estágio".

```dockerfile
FROM node:20 AS build    # Estágio 1 — tem compilador, devDeps
RUN npm ci && npm run build

FROM node:20-alpine AS runtime  # Estágio 2 — imagem limpa e pequena
COPY --from=build /app/dist ./dist  # Copia APENAS o necessário do estágio anterior
```

O resultado é que a imagem final (`runtime`) não carrega nenhuma ferramenta de build. Imagem menor = menos superfície de ataque, menor tempo de download em produção.

### Docker Compose

Ferramenta para definir e rodar **múltiplos containers** que formam uma aplicação. Em vez de rodar vários `docker run` manualmente, você descreve tudo em YAML.

**Hierarquia de um serviço:**

```yaml
services:
  nome-do-servico:
    image: ou build: ...    # De onde vem a imagem
    container_name: ...     # Nome do container criado
    restart: ...            # Política de reinício
    depends_on: ...         # Dependências
    environment: ...        # Variáveis de ambiente em runtime
    ports: ...              # Mapeamento de portas host:container
    volumes: ...            # Montagem de arquivos/diretórios
    networks: ...           # Redes às quais pertence
    healthcheck: ...        # Como verificar se está saudável
```

### Healthcheck

Mecanismo que verifica periodicamente se o serviço está **realmente funcionando**, não apenas em execução.

Estados possíveis de um container: `starting` → `healthy` ou `unhealthy`.

```yaml
healthcheck:
  test: ["CMD-SHELL", "wget -qO /dev/null http://localhost:3333/api/tasks || exit 1"]
  interval: 10s      # Com que frequência testar
  timeout: 5s        # Tempo máximo para a resposta
  retries: 10        # Quantas falhas consecutivas para considerar "unhealthy"
  start_period: 30s  # Período de graça inicial (não conta falhas durante ele)
```

Sem healthcheck, um `depends_on` com `condition: service_healthy` nunca seria satisfeito — o container dependente não subiria.

Com healthcheck, a ordem de startup é garantida: banco → backend (com migrations rodadas) → frontend.

### Profiles

Permitem definir serviços que **só sobem quando explicitamente solicitados**.

```yaml
backend:
  profiles: ["app", "full"]   # Só sobe com --profile app ou --profile full
```

```bash
docker compose up -d                    # Sobe só serviços sem profile (db)
docker compose --profile app up -d     # Sobe db + backend + frontend
```

Útil para ter um compose que serve tanto para dev local (só banco) quanto para produção (stack completa).

### Volumes

Persistem dados entre reinicializações do container. Sem volume, tudo dentro do container é descartado quando ele para.

**Volume nomeado** (para banco de dados):

```yaml
volumes:
  - au_postgres_data:/var/lib/postgresql/data
#   ^^^^^^^^^^^^^^^   ^^^^^^^^^^^^^^^^^^^^^^^^
#   nome do volume    caminho dentro do container
```

O Docker gerencia onde o volume fica no host. Os dados sobrevivem a `docker compose down` mas são apagados com `docker compose down -v`.

**Bind mount** (para hot-reload em dev):

```yaml
volumes:
  - ./backend/src:/app/src
#   ^^^^^^^^^^^^^^^  ^^^^^^^
#   caminho no host  caminho no container
```

Diferente do volume nomeado, o bind mount aponta para um diretório real do host. Qualquer mudança no host aparece instantaneamente no container.

### Networks

Por padrão, o Docker cria uma rede interna para cada Compose. Os serviços se comunicam pelo **nome do serviço** como hostname.

```yaml
networks:
  - au_network   # Todos os serviços nessa rede se "enxergam"
```

O backend usa `DATABASE_URL: postgresql://...@db:5432/...` — o `db` é resolvido para o IP do container PostgreSQL dentro da rede `au_network`.

**Por que os serviços não usam `localhost`?** Cada container tem seu próprio `localhost`. O `localhost` do backend é o próprio container do backend, não o do banco. A comunicação entre containers acontece via DNS interno da rede Docker.

### Variáveis de ambiente e build args

**`environment`** — injetada **em runtime** no container:

```yaml
environment:
  NODE_ENV: production
  PORT: 3333
  DATABASE_URL: postgresql://...
```

Acessível no código com `process.env.NODE_ENV`.

**`build.args`** — injetada **durante o build da imagem** (no `docker build`):

```yaml
build:
  args: 
```dockerfile
CMD ["sh", "-c", "prisma migrate deploy && exec node dist/main"]
#                                          ^^^^
#                          `exec` substitui o shell pelo node
#                          Após exec: tini → node (sem intermediário sh)
```

### `.dockerignore`

Evita enviar arquivos desnecessários para o daemon Docker durante o build. Funciona **antes** do `COPY` — o arquivo nem entra no contexto de build.

Regras importantes:
- `node_modules` — deve sempre ser ignorado; é reinstalado pelo `npm ci`
- `.env` — nunca deve entrar na imagem (vazamento de segredos)
- `!.env.example` — exceção explícita (o `!` nega o padrão anterior)
- `dist`, `build` — recompilados dentro do container

---

## Comandos úteis do dia a dia

```bash
# Ver containers em execução
docker ps

# Ver logs de um serviço
docker compose logs backend
docker compose logs -f backend    # -f = follow (tempo real)

# Entrar no shell de um container
docker compose exec backend sh
docker compose exec db psql -U postgres -d au_tasks

# Rodar um comando pontual num container em execução
docker compose exec backend npx prisma db seed
docker compose exec backend npx prisma migrate status

# Rebuildar só um serviço
docker compose --profile app up -d --build backend

# Ver quanto espaço as imagens ocupam
docker images

# Remover imagens não utilizadas
docker image prune

# Ver volumes existentes
docker volume ls

# Apagar tudo (containers parados, imagens sem tag, redes, cache de build)
docker system prune
docker system prune --volumes   # Inclui volumes também — CUIDADO: apaga dados
```

---

## Troubleshooting

### Porta já em uso

```
Error: bind: address already in use
```

Algum processo no host (ou outro container) está usando a porta. Soluções:

```bash
# Descobrir quem usa a porta 5432
sudo ss -tlnp | grep 5432

# Mudar a porta exposta sem alterar o código
POSTGRES_PORT=5433 docker compose up -d
```

O `docker-compose.dev.yml` já usa `5433` por padrão para evitar conflito com a instância de produção.

### Backend não inicia / migrations falham

```bash
# Ver o que aconteceu
docker compose logs backend

# Verificar status do banco
docker compose exec db pg_isready -U postgres -d au_tasks
```

Se o banco ainda não estava pronto, o healthcheck + `start_period: 30s` normalmente resolve. Se persistir, aumente `retries` no healthcheck.

### Hot-reload não funciona no dev

Em sistemas Linux, o inotify pode precisar de limite maior para observar muitos arquivos:

```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Imagem desatualizada após mudança de código

```bash
# Forçar rebuild sem cache
docker compose --profile app build --no-cache
docker compose --profile app up -d
```

### Variável NEXT_PUBLIC_API_URL não atualiza

Lembre: essa variável é embutida no bundle em **build time**. Mudar só o `environment` em runtime não tem efeito. É necessário rebuildar a imagem:

```bash
NEXT_PUBLIC_API_URL=http://novo-endereco:3333/api \
  docker compose --profile app up -d --build frontend
```
