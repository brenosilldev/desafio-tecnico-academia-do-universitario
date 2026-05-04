# Backend — Desafio AU

API REST em **NestJS 11** + **Prisma 7** + **PostgreSQL 16** que serve o Kanban de tarefas.

> Para visão geral do projeto, ver o [README raiz](../README.md). Esta página é específica do backend.

---

## Sumário

- [Quick start](#quick-start)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Scripts disponíveis](#scripts-disponíveis)
- [Estrutura](#estrutura)
- [API REST](#api-rest)
- [Arquitetura](#arquitetura)
- [Banco de dados](#banco-de-dados)
- [Testes](#testes)
- [Tratamento de erros](#tratamento-de-erros)

---

## Quick start

```bash
# da raiz do repo:
docker compose up -d

cd backend
cp .env.example .env
npm install
npx prisma migrate deploy
npx prisma db seed     # opcional
npm run start:dev
```

Servidor sobe em `http://localhost:3333`. API REST em `http://localhost:3333/api/tasks`.

---

## Variáveis de ambiente

Copie `.env.example` para `.env`:

| Variável        | Default                                                      | Uso                              |
|-----------------|--------------------------------------------------------------|----------------------------------|
| `DATABASE_URL`  | `postgresql://postgres:postgres@localhost:5432/au_tasks`     | Conexão Prisma                   |
| `PORT`          | `3333`                                                       | Porta HTTP                       |
| `FRONTEND_URL`  | `http://localhost:3000`                                      | Origem permitida no CORS         |

---

## Scripts disponíveis

| Script                         | Descrição                                                     |
|--------------------------------|---------------------------------------------------------------|
| `npm run start`                | Sobe a aplicação                                              |
| `npm run start:dev`            | Sobe em modo watch                                            |
| `npm run start:prod`           | Sobe `dist/main.js` (após `npm run build`)                    |
| `npm run build`                | Compila TypeScript via Nest CLI                               |
| `npm run lint`                 | ESLint com `--fix`                                            |
| `npm run format`               | Prettier nos arquivos `.ts`                                   |
| `npm run test`                 | Roda toda a suíte (148 testes)                                |
| `npm run test:unit`            | Apenas testes unitários (mocks de repositório)                |
| `npm run test:integration`     | Apenas integração (`PrismaTaskRepository`)                    |
| `npm run test:e2e`             | Apenas e2e via Supertest (config `test/jest-e2e.json`)        |
| `npm run test:cov`             | Geração de cobertura em `coverage/`                           |
| `npm run prisma:migrate`       | Atalho para `prisma migrate dev`                              |
| `npm run prisma:generate`      | Atalho para `prisma generate`                                 |
| `npm run prisma:format`        | Formata `schema.prisma`                                       |

---

## Estrutura

```
backend/
├── prisma/
│   ├── schema.prisma           # Modelo Task + enum TaskStatus
│   ├── migrations/             # Migrations versionadas
│   └── seed.ts                 # 6 tarefas de exemplo
├── src/
│   ├── tasks/                  # Módulo principal — arquitetura hexagonal
│   │   ├── domain/             # Entidade, enum, port (interface)
│   │   ├── application/        # Casos de uso + DTOs
│   │   ├── infrastructure/     # Adapter Prisma
│   │   ├── presentation/       # Controller HTTP
│   │   └── tasks.module.ts
│   ├── prisma/                 # PrismaService + módulo @Global()
│   ├── common/                 # HttpExceptionFilter
│   ├── app.module.ts           # Composição de módulos
│   └── main.ts                 # CORS + ValidationPipe + filter + prefixo /api
├── __tests__/                  # Pirâmide de testes (organizada por módulo)
└── test/
    └── jest-e2e.json           # Config dedicada ao e2e
```

Cada subpasta tem seu próprio `README.md` — veja a [seção de Documentação por módulo](../README.md#documentação-por-módulo) no README raiz.

---

## API REST

Prefixo global: `/api`. Todas as rotas operam sobre `tasks`.

| Método | Rota              | Descrição                          | Status |
|--------|-------------------|------------------------------------|--------|
| GET    | `/api/tasks`      | Lista todas as tarefas             | 200    |
| POST   | `/api/tasks`      | Cria uma tarefa                    | 201    |
| PATCH  | `/api/tasks/:id`  | Atualiza campos parciais           | 200    |
| DELETE | `/api/tasks/:id`  | Remove uma tarefa                  | 204    |

### Exemplo — criar tarefa

```bash
curl -X POST http://localhost:3333/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Estudar Nest","description":"Cobrir filtros e pipes"}'
```

```json
{
  "id": "ckm9z3...",
  "title": "Estudar Nest",
  "description": "Cobrir filtros e pipes",
  "status": "TODO",
  "position": 1,
  "createdAt": "2026-05-03T13:38:01.234Z",
  "updatedAt": "2026-05-03T13:38:01.234Z"
}
```

### Exemplo — mover para "Em andamento"

```bash
curl -X PATCH http://localhost:3333/api/tasks/ckm9z3... \
  -H "Content-Type: application/json" \
  -d '{"status":"IN_PROGRESS"}'
```

### Resposta de erro padronizada

Todas as exceções passam pelo `HttpExceptionFilter` global e devolvem:

```json
{
  "statusCode": 404,
  "message": "Tarefa com id \"abc\" não encontrada",
  "path": "/api/tasks/abc",
  "timestamp": "2026-05-03T13:38:01.234Z"
}
```

`message` pode ser `string` ou `string[]` (no caso do `ValidationPipe` retornar múltiplos erros).

---

## Arquitetura

O módulo `tasks` segue **hexagonal (ports & adapters)**:

```
                   ┌──────────────────────┐
   HTTP  ─────────▶│   Presentation       │
                   │   TasksController    │
                   └──────────┬───────────┘
                              │  injeta use cases
                   ┌──────────▼───────────┐
                   │   Application        │
                   │   *UseCase + DTOs    │
                   └──────────┬───────────┘
                              │  depende da interface (port)
                   ┌──────────▼───────────┐
                   │   Domain             │
                   │   Task, TaskRepo IF  │
                   └──────────▲───────────┘
                              │  implementa
                   ┌──────────┴───────────┐
                   │   Infrastructure     │
                   │   PrismaTaskRepo     │
                   └──────────────────────┘
```

A inversão fica explícita no `TasksModule`:

```ts
{ provide: TASK_REPOSITORY, useClass: PrismaTaskRepository }
```

Para trocar PostgreSQL por outro store ou usar um repositório em memória nos testes, basta trocar o `useClass`.

---

## Banco de dados

Schema em `prisma/schema.prisma`:

```prisma
model Task {
  id          String     @id @default(cuid())
  title       String
  description String?
  status      TaskStatus @default(TODO)
  position    Int        @default(0)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@map("tasks")
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
}
```

- `cuid` (mais URL-friendly que UUID)
- Enum nativo do PostgreSQL via Prisma — garante integridade no banco
- `position` para preservar ordem dentro de cada coluna do Kanban
- `@@map("tasks")` mantém o nome da tabela em snake_case plural

### Seed

`npx prisma db seed` executa `prisma/seed.ts`, que limpa a tabela e cria 6 tarefas distribuídas entre os três status. Útil para a avaliação não precisar criar tarefas manualmente.

---

## Testes

**11 suítes / 148 testes**, distribuídos em três níveis. Detalhes em [`__tests__/README.md`](./__tests__/README.md).

```bash
npm test                  # tudo
npm run test:unit         # mocks de repositório
npm run test:integration  # adapter Prisma
npm run test:e2e          # API completa via Supertest
npm run test:cov          # com cobertura
```

---

## Tratamento de erros

- **`ValidationPipe` global** com `whitelist: true` e `transform: true` rejeita propriedades não declaradas e converte tipos primitivos automaticamente.
- **`HttpExceptionFilter` global** padroniza qualquer erro (HTTP ou genérico) no formato `{ statusCode, message, path, timestamp }`.
- **`NotFoundException`** lançada explicitamente nos use cases `UpdateTask` e `DeleteTask` quando o id não existe.
- Erros não-HTTP (ex.: bug interno) caem em `500` com mensagem padrão `"Erro interno no servidor"` e o stack original é logado pelo `Logger` do Nest.
