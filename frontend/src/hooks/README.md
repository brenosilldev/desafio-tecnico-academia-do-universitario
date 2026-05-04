# `hooks/`

Hooks customizados que encapsulam toda a I/O com a API. Componentes da app **não** chamam `fetch` nem `api.tasks.*` direto — passam pelos hooks daqui.

---

## `use-tasks.ts`

Quatro hooks construídos sobre **TanStack Query**:

| Hook              | Tipo                  | O que faz                                                    |
|-------------------|-----------------------|--------------------------------------------------------------|
| `useTasks()`      | `useQuery`            | Lista todas as tarefas + deriva `stats` e `getByStatus`      |
| `useCreateTask()` | `useMutation`         | Cria tarefa, invalida cache em `onSuccess`                   |
| `useUpdateTask()` | `useMutation`         | Atualiza com **optimistic update** (status muda já na UI)    |
| `useDeleteTask()` | `useMutation`         | Remove com **optimistic delete** + rollback em erro          |

`TASKS_QUERY_KEY = ['tasks'] as const` é exportado para invalidações externas (raras).

---

## `useTasks()`

```ts
const { tasks, stats, isLoading, isError, error, getByStatus } = useTasks()
```

Configuração:

- **`queryKey`**: `['tasks']`
- **`queryFn`**: `api.tasks.list`
- **`staleTime`**: `30_000` (30 s) — evita refetch agressivo quando o usuário troca de aba

`stats` é derivado em memória a cada render (barato — array de até dezenas de items):

```ts
{
  total: number,
  todo: number,
  inProgress: number,
  done: number,
  completionRate: number,   // arredondado, 0-100
}
```

`getByStatus(status)` é uma closure simples — usado pelas colunas do Kanban.

---

## `useCreateTask()`

```ts
const createTask = useCreateTask()
await createTask.mutateAsync({ title, description })
```

- Apenas invalida `['tasks']` em `onSuccess`. Não faz optimistic update — o id é gerado no servidor.
- O componente que chama (`CreateCardForm`) usa `mutateAsync` para `await` antes de navegar.

---

## `useUpdateTask()`

Padrão completo de optimistic update:

```ts
onMutate: async ({ id, status }) => {
  if (!status) return                                        // só otimiza para mudança de status
  await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY })
  const previous = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY)
  queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, (old) =>
    old?.map((t) => (t.id === id ? { ...t, status } : t)) ?? [],
  )
  return { previous }
},
onError: (_err, _vars, ctx) => {
  if (ctx?.previous) queryClient.setQueryData(TASKS_QUERY_KEY, ctx.previous)
},
onSettled: () => {
  queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY })
},
```

### Por quê só otimizar mudança de status?

Mudança de status é a única ação **visivelmente lenta** ao usuário (o card "salta" de coluna). Edição de title/description é feita em telas dedicadas onde `await mutateAsync` + spinner é uma UX ok. Manter o escopo do otimismo evita complexidade desnecessária.

### Por que `cancelQueries` antes?

Se um refetch estiver em vôo enquanto a gente atualiza otimisticamente, ele pode sobrescrever o estado otimista quando responder. Cancelando, garantimos que só a resposta da nossa mutation reconcilia.

### Por que `onSettled` invalida em vez de `onSuccess`?

Mesmo em sucesso, queremos que a próxima query traga dados frescos do servidor — a invalidação dispara uma refetch reconciliando timestamps (`updatedAt`) e ordem.

---

## `useDeleteTask()`

Mesmo padrão do `useUpdateTask`, mas o snapshot otimista filtra o item:

```ts
queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, (old) =>
  old?.filter((t) => t.id !== id) ?? [],
)
```

---

## Decisões

### Por que tudo em um arquivo?

A app só tem **um recurso** (tasks). Quebrar em arquivos separados (`use-tasks-list.ts`, `use-create-task.ts`, etc.) seria over-engineering. Quando aparecer o segundo recurso (ex.: `comments`), aí sim divide-se em pastas (`hooks/tasks/`, `hooks/comments/`).

### Por que `useQueryClient()` dentro de cada hook?

Mais simples e localizado. O cliente é o mesmo (vem do `Providers`) e React Query reusa via context.

### Por que não usar `select` para derivar `stats`?

`select` é ótimo quando o retorno é grande e queremos memoizar. Aqui o array é pequeno, e `stats` é usado em duas telas (Board e Dashboard) — derivar inline mantém o hook simples.

---

## Quando adicionar hooks aqui

- ✅ Qualquer chamada nova à API
- ✅ Qualquer derivação que precise compartilhar entre componentes (`useTasksByDate`, etc.)
- ❌ State puramente local de componente — `useState` no próprio componente
- ❌ Hooks de UI (`useDisclosure`, etc.) — são responsabilidade do componente
