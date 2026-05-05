# Frontend — Desafio AU

SPA em **Next.js 16** (App Router) consumindo a API do backend via **TanStack Query 5**.

> Para visão geral do projeto, ver o [README raiz](../README.md). Esta página é específica do frontend.

---

## Sumário

- [Quick start](#quick-start)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Scripts](#scripts)
- [Rotas](#rotas)
- [Estrutura](#estrutura)
- [Padrões usados](#padrões-usados)

---

## Quick start

```bash
# da raiz, com o backend já rodando em :3333
cd frontend
cp .env.example .env
npm install
npm run dev
```

App em `http://localhost:3000`. Turbopack habilitado por padrão.

---

## Variáveis de ambiente

| Variável                  | Default                          | Uso                                    |
|---------------------------|----------------------------------|----------------------------------------|
| `NEXT_PUBLIC_API_URL`     | `http://localhost:3333/api`      | Base do cliente HTTP em `lib/api.ts`   |

`NEXT_PUBLIC_*` é exposta para o bundle do cliente — só coloque aqui valores que podem ser públicos.

---

## Scripts

| Script              | Descrição                                  |
|---------------------|--------------------------------------------|
| `npm run dev`       | Dev server (Next + Turbopack) em `:3000`   |
| `npm run build`     | Build de produção                          |
| `npm run start`     | Sobe o build de produção                   |
| `npm run lint`      | ESLint (config Next.js)                    |
| `npm run type-check`| `tsc --noEmit`                             |

---

## Rotas

A app usa **App Router** com um único route group `(board)` que aplica o layout com header sticky.

| Rota              | Página                  | O que faz                                              |
|-------------------|-------------------------|--------------------------------------------------------|
| `/`               | `(board)/page.tsx`      | Quadro Kanban (3 colunas + drag-and-drop)              |
| `/novo-card`      | `(board)/novo-card/`    | Formulário de criação de tarefa                        |
| `/dashboard`      | `(board)/dashboard/`    | Métricas, donut + bar chart, taxa de conclusão         |

Todas as páginas vivem dentro do mesmo layout (`Header` sticky + container).

---

## Estrutura

```
frontend/src/
├── app/                            # App Router
│   ├── layout.tsx                  # <html>, <body>, <Providers/>
│   └── (board)/
│       ├── layout.tsx              # Header sticky + bg cinza claro
│       ├── page.tsx                # Quadro Kanban
│       ├── novo-card/page.tsx      # Formulário
│       └── dashboard/page.tsx      # Métricas
├── components/
│   ├── board/                      # BoardColumn, TaskCard, MoveTaskModal
│   ├── dashboard/                  # StatCard, StatusDonutChart, ColumnBarChart, RecentCards
│   ├── forms/                      # CreateCardForm
│   ├── layout/                     # Header
│   └── ui/                         # Button, Badge, Dialog (Radix)
├── hooks/
│   └── use-tasks.ts                # useTasks, useCreateTask, useUpdateTask, useDeleteTask
├── lib/
│   ├── api.ts                      # Cliente HTTP + mapeamento de status
│   └── utils.ts                    # cn() (clsx + tailwind-merge), formatDate()
├── types/
│   └── task.ts                     # Task, TaskStatus, MovePayload, STATUS_CONFIG
├── constants/
│   └── tasks.ts                    # INITIAL_TASKS (apenas como referência de design)
├── context/
│   └── tasks-context.tsx           # (legacy) Context antigo, substituído pelos hooks
├── providers.tsx                   # QueryClientProvider
└── styles/                         # Tailwind globals
```

Cada subpasta com lógica significativa tem seu próprio README:

- [`app/README.md`](./src/app/README.md)
- [`components/README.md`](./src/components/README.md)
- [`hooks/README.md`](./src/hooks/README.md)
- [`lib/README.md`](./src/lib/README.md)

---

## Padrões usados

### Server vs Client components

Tudo que precisa de hook (`useState`, `useQuery`, `useRouter`) está marcado com `'use client'`. Os layouts (`app/layout.tsx`, `app/(board)/layout.tsx`) são server components puros.

### TanStack Query

`Providers` cria um `QueryClient` único por sessão (`useState(() => new QueryClient(...))`):

```ts
new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
})
```

Toda I/O passa por hooks em `hooks/use-tasks.ts`. As páginas **nunca** chamam `fetch` direto.

### Optimistic updates

`useUpdateTask` e `useDeleteTask` implementam o padrão completo:

```ts
onMutate: async (vars) => {
  await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY })
  const previous = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY)
  queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, (old) => /* mutar otimisticamente */)
  return { previous }
},
onError: (_err, _vars, ctx) => {
  if (ctx?.previous) queryClient.setQueryData(TASKS_QUERY_KEY, ctx.previous)
},
onSettled: () => {
  queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY })
},
```

### Mapeamento de status

Backend usa `TODO`/`IN_PROGRESS`/`DONE` (Prisma enum). Frontend usa `todo`/`in_progress`/`done` (alinhado a `STATUS_CONFIG`). A conversão é centralizada em `lib/api.ts` — nenhum componente conhece o formato da API.

### Tailwind 4

Configurado via `@tailwindcss/postcss` (PostCSS). Cores principais usam tokens hex inline (consistentes com o Figma): laranja `#F97316`, verde `#22C55E`, cinzas Tailwind padrão. Nada de tema complexo — o design é simples.

### Formulários

`CreateCardForm` usa **React Hook Form + Zod resolver**:

```ts
const schema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
})
```

Validação client-side roda antes do submit; o backend revalida via `class-validator`.

### Acessibilidade

- `aria-label` / `aria-current` no header.
- `aria-invalid` + `aria-describedby` em campos com erro.
- Focus rings visíveis (Tailwind default).
- Labels associadas via `<label>` com `for` ou via `register` do RHF.

---

## Notas

- `frontend/src/context/tasks-context.tsx` e `frontend/src/constants/tasks.ts` são **legacy** — sobraram da fase em que o estado era client-side (antes da integração com a API). Não são importados em runtime; ficam como referência do mock inicial. Se quiser, podem ser removidos com segurança.
