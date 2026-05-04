# `lib/`

Camada de **infra do frontend**: cliente HTTP da API e utilitários sem dependência de UI.

---

## `api.ts` — cliente HTTP

Encapsula `fetch` e centraliza:

- Base URL via `NEXT_PUBLIC_API_URL` (default `http://localhost:3333/api`).
- Tratamento padrão de erros HTTP (lê `body.message`, lança `Error`).
- Suporte a `204 No Content` (não tenta `res.json()`).
- **Mapeamento de status** entre backend (`TODO` / `IN_PROGRESS` / `DONE`) e frontend (`todo` / `in_progress` / `done`).
- **Mapeamento de campos** entre `BackendTask` (com `createdAt: string ISO`) e `Task` (com `createdAt: 'YYYY-MM-DD'`).

```ts
export const api = {
  tasks: {
    list:   () => Promise<Task[]>
    create: (title, description) => Promise<Task>
    update: (id, { status?, title?, description?, position? }) => Promise<Task>
    delete: (id) => Promise<void>
  }
}
```

### Por que centralizar o mapeamento aqui?

Os componentes / hooks da app só conhecem o tipo `Task` do frontend (lowercase, sem ISO). Se o contrato da API mudar (ex.: backend passar a usar `kebab-case`), só `api.ts` muda — nenhum componente é tocado.

### Por que `description: string` no front e `description: string | null` no back?

Conveniência de UI: textareas trabalham melhor com string vazia. O mapeamento converte `null → ''` na entrada.

### Function `request<T>` interno

Helper que injeta `Content-Type: application/json` e trata erros:

```ts
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { message?: string }).message ?? `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
```

A `Error` lançada chega no `useMutation` → `onError` do TanStack Query, que aciona o rollback do optimistic update.

---

## `utils.ts`

### `cn(...classes)`

```ts
cn('px-4 py-2', isActive && 'bg-orange-500')
```

Combinação de `clsx` (concat condicional) com `tailwind-merge` (resolve conflitos de classes Tailwind, p.ex. `px-4 px-6` → `px-6`).

### `formatDate(iso)`

Formata `'YYYY-MM-DD'` para `dd/mm/aaaa` em pt-BR. Usado no rodapé dos `TaskCard`.

---

## Regras desta camada

- ✅ Pode importar de `types/`.
- ✅ Pode usar `fetch`, `URL`, etc.
- ❌ **Não** importa de `components/`, `hooks/` ou `app/`.
- ❌ **Não** mantém estado (essa é responsabilidade dos hooks com TanStack Query).

---

## Quando adicionar coisas aqui

- ✅ Novo recurso da API (criar `api.comments`, `api.users`, etc., seguindo o mesmo padrão).
- ✅ Helpers puros sem dependência de React (`formatCurrency`, `slugify`, etc.).
- ❌ Helpers que usam hooks (vão em `hooks/`).
- ❌ Componentes (vão em `components/`).
