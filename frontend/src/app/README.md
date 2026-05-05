# `app/` — App Router

Estrutura de rotas usando o **App Router** do Next.js. Cada arquivo `page.tsx` é uma rota; cada `layout.tsx` é um wrapper aplicado a todas as rotas filhas.

---

## Estrutura

```
app/
├── layout.tsx                  # Root layout — <html>, <body>, <Providers/>
└── (board)/                    # Route group (nome não aparece na URL)
    ├── layout.tsx              # Layout do board — Header sticky + bg cinza claro
    ├── page.tsx                # Rota: /          → Quadro Kanban
    ├── novo-card/
    │   └── page.tsx            # Rota: /novo-card → Formulário de criação
    └── dashboard/
        └── page.tsx            # Rota: /dashboard → Métricas + gráficos
```

---

## Layouts

### `app/layout.tsx` (root)

Server component. Define `<html lang="pt-BR">`, `<body>` e envolve tudo no `<Providers/>` (QueryClientProvider).

```tsx
export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

### `app/(board)/layout.tsx`

Server component. Aplica fundo `#F5F5F5`, `<Header>` sticky e um `<main>` flex.

```tsx
export default function BoardLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F5F5' }}>
      <Header />
      <main className="flex-1">{children}</main>
    </div>
  )
}
```

O `(board)` é um **route group**: agrupa rotas para compartilhar o layout sem afetar a URL.

---

## Páginas

### `/` — Quadro Kanban (`(board)/page.tsx`)

Client component (`'use client'`). Exibe três `<BoardColumn>` lado a lado:

- Lê dados via `useTasks()` (TanStack Query).
- Lê `getByStatus(status)` por coluna.
- Captura drop nativo HTML5 e clique no botão "avançar status" do card.
- Em ambos os casos abre o `<MoveTaskModal>` (comentário obrigatório) antes de chamar `useUpdateTask().mutate({ id, status })`.
- Exibe estado de loading (skeleton) e estado de erro (banner com URL da API).

### `/novo-card` — Formulário (`(board)/novo-card/page.tsx`)

Client component. Usa `useCreateTask()` e o componente `<CreateCardForm>`. Após sucesso, navega para `/`.

### `/dashboard` — Métricas (`(board)/dashboard/page.tsx`)

Client component. Lê `stats` do `useTasks()` e renderiza:

- 4 `<StatCard>` no topo (total, A Fazer, Em Andamento, Concluídos com `completionRate%`).
- `<StatusDonutChart>` — distribuição por status.
- `<ColumnBarChart>` — contagem por coluna.
- Taxa de conclusão com barra animada (Framer Motion).
- `<RecentCards>` — últimas tarefas criadas.

---

## Como adicionar uma nova rota

1. Crie a pasta dentro de `app/(board)/` (para herdar o layout do board) ou em `app/` direto (para layout próprio).
2. Adicione `page.tsx` exportando o componente.
3. Se a página precisar de hooks, marque com `'use client'` no topo.

Exemplo:

```
app/(board)/configuracoes/page.tsx   →  rota /configuracoes (com header)
```

---

## O que NÃO entra aqui

- Componentes reutilizáveis → `components/`
- Lógica de I/O → `hooks/use-tasks.ts`
- Cliente HTTP → `lib/api.ts`
