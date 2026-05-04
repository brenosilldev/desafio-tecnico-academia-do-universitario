# Desafio Técnico Full Stack — Academia do Universitário

Aplicação de **gestão de tarefas (To-Do)** com formulário de cadastro e quadro Kanban, desenvolvida como solução ao desafio técnico da [Academia do Universitário](https://www.academiadouniversitario.com.br/) para a vaga de Desenvolvedor(a) Full Stack Pleno (foco em backend).

> Para o enunciado original do desafio, veja [docs/CHALLENGE.md](./docs/CHALLENGE.md).

---

## Sumário

- [Visão geral](#visão-geral)
- [Stack utilizada](#stack-utilizada)
- [Como rodar](#como-rodar)
  - [Pré-requisitos](#pré-requisitos)
  - [Opção A — Instalação local (recomendado para dev)](#opção-a--instalação-local-recomendado-para-dev)
  - [Opção B — Containers com hot-reload](#opção-b--containers-com-hot-reload)
  - [Opção C — Containers em modo produção](#opção-c--containers-em-modo-produção)
- [Documentação da API (Swagger)](#documentação-da-api-swagger)
- [Como rodar os testes](#como-rodar-os-testes)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Documentação por módulo](#documentação-por-módulo)
- [Decisões técnicas](#decisões-técnicas)
- [Uso de IA](#uso-de-ia)

---

## Visão geral

A aplicação permite:

- **Criar tarefas** via formulário com `título` e `descrição` (status inicial automático: `A Fazer`).
- **Visualizar tarefas** em um quadro Kanban dividido por status (`A Fazer`, `Em Andamento`, `Concluído`).
- **Mover tarefas** entre colunas por **drag-and-drop** (HTML5 Drag API) ou pelo botão "avançar status" no card. Em ambos os fluxos é exibido um **modal de confirmação** com comentário obrigatório, registrando o motivo da transição.
- **Acompanhar métricas** em uma tela de Dashboard com gráficos (donut + barras) e taxa de conclusão.

---

## Stack utilizada

| Camada       | Tecnologia                                                            |
|--------------|-----------------------------------------------------------------------|
| Backend      | NestJS 11, Prisma ORM 6, PostgreSQL 16                                |
| Frontend     | Next.js 15 (App Router), TanStack Query 5                             |
| Estilo / UI  | Tailwind CSS 4, Radix UI, Lucide React, Framer Motion, Recharts       |
| Validação    | `class-validator` (backend), Zod + React Hook Form (frontend)         |
| Testes       | Jest + Supertest (unit / integração / e2e)                            |
| Documentação | Swagger / OpenAPI (`@nestjs/swagger`) — disponível no modo local      |
| Banco        | PostgreSQL via Docker Compose                                         |

---

## Como rodar

Há **três caminhos** para subir o projeto:

| Opção | Quando usar |
|-------|-------------|
| **A — Local (npm)** | Desenvolvimento ativo: hot-reload nativo, Swagger disponível, depuração simples |
| **B — Docker dev** | Ambiente containerizado com hot-reload (sem instalar Node localmente) |
| **C — Docker prod** | Validar a build final ou simular ambiente de produção |

### Pré-requisitos

- [Docker](https://www.docker.com/) e Docker Compose v2+
- **Apenas para a Opção A:** [Node.js](https://nodejs.org/) 20+ e npm 10+

---

### Opção A — Instalação local (recomendado para dev)

#### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/desafio-tecnico-academia-do-universitario.git
cd desafio-tecnico-academia-do-universitario
```

#### 2. Subir o banco de dados

```bash
docker compose up -d
```

Sobe **apenas** o container PostgreSQL 16 (`au_postgres`) na porta `5432`.

| Parâmetro      | Valor padrão |
|----------------|--------------|
| Usuário        | `postgres`   |
| Senha          | `postgres`   |
| Banco          | `au_tasks`   |
| Porta          | `5432`       |

#### 3. Configurar e iniciar o backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate deploy   # aplica as migrations
npx prisma db seed          # opcional — cria 6 tarefas de exemplo
npm run start:dev
```

O arquivo `.env` padrão já está configurado para o banco local:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/au_tasks"
PORT=3333
FRONTEND_URL=http://localhost:3000
```

#### 4. Configurar e iniciar o frontend

Em um novo terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

```env
NEXT_PUBLIC_API_URL=http://localhost:3333/api
```

#### URLs disponíveis

| Serviço          | URL                                     |
|------------------|-----------------------------------------|
| Frontend         | `http://localhost:3000`                 |
| Backend (API)    | `http://localhost:3333/api`             |
| **Swagger UI**   | **`http://localhost:3333/api/docs`**    |

> O Swagger está disponível **apenas no modo local**. No modo containerizado ele não é exposto para manter a imagem de produção limpa.

---

### Opção B — Containers com hot-reload

Sobe a stack completa (banco + backend + frontend) em modo desenvolvimento dentro do Docker. As alterações em `src/` de qualquer serviço são refletidas **sem rebuild**.

```bash
docker compose -f docker-compose.dev.yml up -d --build
```

| Container         | Serviço   | Porta  |
|-------------------|-----------|--------|
| `au_postgres_dev` | PostgreSQL| `5433` |
| `au_backend_dev`  | NestJS    | `3333` |
| `au_frontend_dev` | Next.js   | `3000` |

> A porta do banco em dev é `5433` para não conflitar com uma instância local na `5432`.

Para acompanhar os logs em tempo real:

```bash
docker compose -f docker-compose.dev.yml logs -f backend
docker compose -f docker-compose.dev.yml logs -f frontend
```

Para parar e remover tudo:

```bash
docker compose -f docker-compose.dev.yml down -v
```

**Quando é necessário rebuild** (mudanças fora de `src/`):

```bash
docker compose -f docker-compose.dev.yml up -d --build
```

---

### Opção C — Containers em modo produção

Sobe os três serviços com as imagens otimizadas para produção (multi-stage build).

#### 1. Subir a stack

```bash
docker compose --profile app up -d --build
```

O Docker Compose sobe os serviços em cadeia respeitando os healthchecks:

```
db (healthy) → backend (migrate + start) → frontend
```

#### 2. Verificar os containers

```bash
docker compose --profile app ps
```

#### 3. URLs disponíveis

| Serviço  | Container     | URL                         |
|----------|---------------|-----------------------------|
| Postgres | `au_postgres` | `localhost:5432`            |
| Backend  | `au_backend`  | `http://localhost:3333/api` |
| Frontend | `au_frontend` | `http://localhost:3000`     |

#### 4. Popular dados de exemplo (opcional)

```bash
docker compose exec backend npx prisma db seed
```

#### 5. Acompanhar logs

```bash
docker compose --profile app logs -f
docker compose --profile app logs -f backend   # só o backend
```

#### 6. Parar tudo

```bash
# Para os containers mas mantém o volume do banco
docker compose --profile app down

# Para e apaga o volume (banco zerado)
docker compose --profile app down -v
```

#### Variáveis de ambiente configuráveis

Todas têm valores padrão que funcionam sem nenhum `.env`. Defina-as antes do comando para sobrescrever:

| Variável               | Default                     | Descrição                                     |
|------------------------|-----------------------------|-----------------------------------------------|
| `POSTGRES_USER`        | `postgres`                  | Usuário do banco                              |
| `POSTGRES_PASSWORD`    | `postgres`                  | Senha do banco                                |
| `POSTGRES_DB`          | `au_tasks`                  | Nome do banco                                 |
| `POSTGRES_PORT`        | `5432`                      | Porta exposta do Postgres no host             |
| `BACKEND_PORT`         | `3333`                      | Porta exposta do backend no host              |
| `FRONTEND_PORT`        | `3000`                      | Porta exposta do frontend no host             |
| `FRONTEND_URL`         | `http://localhost:3000`     | CORS permitido pelo backend                   |
| `NEXT_PUBLIC_API_URL`  | `http://localhost:3333/api` | URL da API consumida pelo frontend            |

> `NEXT_PUBLIC_API_URL` é injetada no **build do frontend** via `ARG` no `Dockerfile`. Para apontar para outro endereço (ex.: servidor remoto), defina a variável **antes** do `up --build`:
>
> ```bash
> NEXT_PUBLIC_API_URL=http://meu-servidor.com:3333/api \
> docker compose --profile app up -d --build
> ```

---

## Documentação da API (Swagger)

O Swagger UI está disponível **apenas na Opção A (instalação local)** em:

```
http://localhost:3333/api/docs
```

Endpoints documentados:

| Método   | Rota              | Descrição                        |
|----------|-------------------|----------------------------------|
| `GET`    | `/api/tasks`      | Lista todas as tarefas           |
| `POST`   | `/api/tasks`      | Cria uma nova tarefa             |
| `PATCH`  | `/api/tasks/:id`  | Atualiza título, status ou posição |
| `DELETE` | `/api/tasks/:id`  | Remove uma tarefa                |

Os schemas de request/response (`CreateTaskDto`, `UpdateTaskDto`, `TaskResponseDto`) estão completamente anotados com exemplos e validações.

---

## Como rodar os testes

A suíte segue uma **pirâmide de testes** com três níveis no backend, totalizando **11 suítes / 148 testes**.

```bash
cd backend
```

| Comando                        | Escopo                                                                       |
|--------------------------------|------------------------------------------------------------------------------|
| `npm run test`                 | Roda toda a suíte (unit + integração + e2e)                                  |
| `npm run test:unit`            | Domínio, casos de uso, DTOs, controller e filtros (com mocks de repositório) |
| `npm run test:integration`     | `PrismaTaskRepository` — adapter contra `PrismaService` mockado              |
| `npm run test:e2e`             | API HTTP completa via Supertest, com `ValidationPipe` e filtro globais       |
| `npm run test:cov`             | Geração de cobertura em `backend/coverage/`                                  |

> Detalhes da estratégia, organização e exemplos: [`backend/__tests__/README.md`](./backend/__tests__/README.md).

---

## Estrutura do projeto

```
desafio-tecnico-academia-do-universitario/
├── docker-compose.yml             # PostgreSQL (default) + backend/frontend (profile "app")
├── docker-compose.dev.yml         # Stack completa em desenvolvimento (hot-reload)
├── docs/
│   ├── CHALLENGE.md               # Enunciado original do desafio
│   └── AI_USAGE.md                # Detalhes do uso de IA
├── backend/
│   ├── Dockerfile                 # Multi-stage: deps → build → runtime (NestJS + Prisma)
│   ├── Dockerfile.dev             # Imagem de dev com hot-reload
│   ├── .env.example
│   ├── prisma/
│   │   ├── schema.prisma          # Modelo Task + enum TaskStatus
│   │   ├── migrations/            # Migrations versionadas
│   │   └── seed.ts                # 6 tarefas de exemplo
│   ├── src/
│   │   ├── tasks/                 # Módulo principal (arquitetura hexagonal)
│   │   │   ├── domain/            # Entidade, enum e port (interface) do repositório
│   │   │   ├── application/       # Casos de uso + DTOs (com anotações Swagger)
│   │   │   ├── infrastructure/    # Adapter Prisma
│   │   │   ├── presentation/      # Controller HTTP (com anotações Swagger)
│   │   │   └── tasks.module.ts
│   │   ├── prisma/                # PrismaService + PrismaModule (Global)
│   │   ├── common/                # HttpExceptionFilter
│   │   ├── app.module.ts
│   │   └── main.ts                # Bootstrap (CORS, ValidationPipe, prefixo /api, Swagger)
│   └── __tests__/                 # Pirâmide de testes (organizada por módulo)
│       ├── tasks/
│       │   ├── domain/
│       │   ├── application/{dto,use-cases}/
│       │   ├── infrastructure/    # integração
│       │   ├── presentation/
│       │   └── e2e/
│       └── common/filters/
└── frontend/
    ├── Dockerfile                 # Multi-stage: deps → build → runtime (Next.js standalone)
    ├── Dockerfile.dev             # Imagem de dev com hot-reload
    ├── .env.example
    └── src/
        ├── app/                   # App Router
        │   ├── layout.tsx
        │   └── (board)/
        │       ├── layout.tsx     # Header sticky + container
        │       ├── page.tsx       # Quadro Kanban
        │       ├── dashboard/     # Métricas + gráficos
        │       └── novo-card/     # Formulário de criação
        ├── components/
        │   ├── board/             # BoardColumn, TaskCard, MoveTaskModal
        │   ├── dashboard/         # StatCard, charts, RecentCards
        │   ├── forms/             # CreateCardForm
        │   ├── layout/            # Header
        │   └── ui/                # Button, Badge, Dialog (Radix)
        ├── hooks/                 # useTasks, useCreateTask, useUpdateTask, useDeleteTask
        ├── lib/                   # api.ts (HTTP client), utils.ts
        ├── providers.tsx          # QueryClientProvider
        ├── types/                 # Task, TaskStatus, STATUS_CONFIG
        └── constants/             # Dados de exemplo (não usados em runtime)
```

---

## Documentação por módulo

Cada pasta significativa tem seu próprio `README.md` explicando responsabilidades, dependências e como o módulo se encaixa na arquitetura.

### Backend

- [`backend/README.md`](./backend/README.md) — visão geral do backend, scripts, configuração
- [`backend/src/tasks/README.md`](./backend/src/tasks/README.md) — arquitetura hexagonal do módulo `Tasks`
- [`backend/src/tasks/domain/README.md`](./backend/src/tasks/domain/README.md) — entidade, enum e contrato do repositório
- [`backend/src/tasks/application/README.md`](./backend/src/tasks/application/README.md) — casos de uso e DTOs
- [`backend/src/tasks/infrastructure/README.md`](./backend/src/tasks/infrastructure/README.md) — `PrismaTaskRepository`
- [`backend/src/tasks/presentation/README.md`](./backend/src/tasks/presentation/README.md) — controller HTTP REST
- [`backend/src/prisma/README.md`](./backend/src/prisma/README.md) — `PrismaModule` global
- [`backend/src/common/README.md`](./backend/src/common/README.md) — filtro global de exceções
- [`backend/__tests__/README.md`](./backend/__tests__/README.md) — pirâmide de testes (148 testes)

### Frontend

- [`frontend/README.md`](./frontend/README.md) — visão geral do frontend, scripts, rotas
- [`frontend/src/app/README.md`](./frontend/src/app/README.md) — App Router e route groups
- [`frontend/src/components/README.md`](./frontend/src/components/README.md) — taxonomia (board / dashboard / forms / layout / ui)
- [`frontend/src/lib/README.md`](./frontend/src/lib/README.md) — cliente HTTP e utilitários

### Outros

- [`docs/DOCKER.md`](./docs/DOCKER.md) — guia completo de Docker: todos os arquivos explicados, como rodar e conceitos
- [`docs/AI_USAGE.md`](./docs/AI_USAGE.md) — ferramentas, fluxo e prompts utilizados

---

## Decisões técnicas

### Backend — Arquitetura hexagonal (ports & adapters)

O módulo `tasks` segue separação estrita entre quatro camadas:

- **Domain** — `Task`, `TaskStatus`, interface `TaskRepository`. Sem dependência de NestJS, Prisma ou qualquer framework. A entidade tem comportamento (`changeStatus`, `update`, `reposition`), não é um anêmico DTO.
- **Application** — `CreateTaskUseCase`, `ListTasksUseCase`, `UpdateTaskUseCase`, `DeleteTaskUseCase`. Recebem o repositório por injeção via símbolo `TASK_REPOSITORY` (inversão de dependência). DTOs (`CreateTaskDto`, `UpdateTaskDto`, `TaskResponseDto`) também moram aqui.
- **Infrastructure** — `PrismaTaskRepository` implementa o port. É o único arquivo do módulo que conhece o Prisma.
- **Presentation** — `TasksController` expõe HTTP sob `/api/tasks` e delega 100% aos casos de uso.

A injeção do adapter é feita no `TasksModule`:

```ts
{ provide: TASK_REPOSITORY, useClass: PrismaTaskRepository }
```

Trocar PostgreSQL por outro banco significa apenas trocar essa linha — o domínio e os casos de uso permanecem intactos.

### Schema Prisma

Modelo `Task` com enum nativo `TaskStatus` (`TODO` / `IN_PROGRESS` / `DONE`) garantindo integridade no banco, e campo `position` (`Int @default(0)`) para preservar ordem dentro de cada coluna do Kanban. `cuid` para id (mais amigável que UUID em URLs).

### Frontend — TanStack Query

Toda comunicação com a API passa pelos hooks em `src/hooks/use-tasks.ts`:

- **`useTasks`** — `useQuery` com `staleTime: 30s`. Deriva no mesmo hook `stats` (totais por coluna + `completionRate`) e `getByStatus(status)`.
- **`useCreateTask`** — `useMutation` que invalida `['tasks']` em `onSuccess`.
- **`useUpdateTask`** — `useMutation` com **optimistic update** ao mudar status: o card "salta" de coluna instantaneamente em `onMutate`, e em caso de erro o cache é restaurado via `onError` (snapshot anterior). `onSettled` invalida para reconciliar com o servidor.
- **`useDeleteTask`** — `useMutation` com optimistic removal pelo mesmo padrão.

### Mapeamento de status (frontend ↔ backend)

O backend usa `TODO` / `IN_PROGRESS` / `DONE` (SCREAMING_SNAKE_CASE — convenção Prisma/SQL). O frontend usa `todo` / `in_progress` / `done` (lowercase — alinhado a `STATUS_CONFIG`). A conversão é centralizada em `frontend/src/lib/api.ts`, mantendo os tipos do frontend desacoplados do contrato HTTP.

### Modal de confirmação ao mover card

Toda transição de status (drag-and-drop ou botão "avançar") abre um modal exigindo um comentário. Isso:

- evita movimentações acidentais ao arrastar;
- documenta o porquê da mudança (mesmo que o backend hoje não persista o comentário, o gancho está pronto);
- melhora a acessibilidade — botão `Mover para…` no card cobre quem não consegue arrastar.

### Drag-and-drop sem dependência extra

Optei pela **HTML5 Drag and Drop API** nativa em vez de `react-dnd` ou `@dnd-kit`. A UX é simples (mover card entre colunas) e não justifica adicionar 30+ kB de dependência.

### Tratamento de erros

`HttpExceptionFilter` global converte qualquer exceção em uma resposta consistente:

```json
{
  "statusCode": 404,
  "message": "Tarefa com id \"abc\" não encontrada",
  "path": "/api/tasks/abc",
  "timestamp": "2026-05-03T13:38:01.234Z"
}
```

`ValidationPipe` global com `whitelist: true` e `transform: true` rejeita propriedades desconhecidas e converte tipos automaticamente.

### Trade-offs conscientes

| Decisão | Alternativa | Motivo |
|---------|-------------|--------|
| Modal de confirmação ao mover | Drag direto sem confirmação | Acessibilidade + rastreabilidade |
| HTML5 Drag API nativa | `@dnd-kit` | Sem dependência extra; UX simples |
| PostgreSQL via Docker | SQLite | Mais próximo de produção; sem limite de concorrência |
| Seed com 6 tarefas | Sem seed | Facilita avaliação sem precisar criar tarefas |
| Symbol `TASK_REPOSITORY` | Token string | Evita colisão silenciosa por typo |
| Use cases separados (1 por verbo) | Service único `TasksService` | SRP, testes isolados, mais fácil de evoluir |
| Swagger apenas no modo local | Swagger em todos os ambientes | Imagem de produção sem surface de exposição desnecessária |

### O que ficou de fora (e por quê)

- **Persistência do comentário de movimentação** — o gancho existe na UI e no payload `MovePayload`, mas não há tabela `task_movements` no schema. Foi um corte consciente para manter o escopo no que o desafio pede.
- **Autenticação** — fora do escopo.
- **Reordenação manual dentro da coluna** — o campo `position` existe e o backend aceita atualização, mas a UI hoje só move entre colunas (não reordena verticalmente).

---

## Uso de IA

**Ferramenta principal:** Claude Code (Anthropic) — modelos Claude Sonnet 4.6 / Claude Opus 4.7

A IA foi utilizada como **par de programação** ao longo do desenvolvimento, sempre com revisão crítica. Documentação completa do fluxo, ferramentas e prompts em [`docs/AI_USAGE.md`](./docs/AI_USAGE.md).

Resumo:

1. **Scaffolding** da arquitetura hexagonal — validar separação de camadas antes de implementar.
2. **Boilerplate** — DTOs, interfaces, mocks de repositório, esqueleto dos testes.
3. **Optimistic updates** com TanStack Query — implementar `onMutate`/`onError`/`onSettled` consistentemente.
4. **Reorganização de testes** por módulo, mantendo a pirâmide.
5. **Documentação** — geração inicial dos READMEs por módulo.
6. **Swagger** — configuração do `@nestjs/swagger` com anotações nos DTOs e controller.

Todas as decisões de arquitetura, modelagem do domínio e escolhas de bibliotecas foram conscientes; a IA acelerou execução, não substituiu o critério.
