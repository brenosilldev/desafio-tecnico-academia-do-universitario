# `components/`

Componentes React organizados por **domínio** (não por tipo). Cada subpasta agrupa componentes que pertencem a uma feature específica ou a uma camada visual.

---

## Taxonomia

```
components/
├── board/          # Quadro Kanban
│   ├── board-column.tsx        # Coluna com header, lista, drop zone, "Adicionar card"
│   ├── task-card.tsx           # Card individual (drag source, botão "avançar")
│   └── move-task-modal.tsx     # Modal de confirmação ao mover card
│
├── dashboard/      # Tela de métricas
│   ├── stat-card.tsx           # Cartão de KPI (ícone + valor + label)
│   ├── status-donut-chart.tsx  # Distribuição percentual por status (Recharts)
│   ├── column-bar-chart.tsx    # Contagem por coluna (Recharts)
│   └── recent-cards.tsx        # Lista compacta das últimas tarefas
│
├── forms/          # Formulários
│   └── create-card-form.tsx    # RHF + Zod, banner de status inicial
│
├── layout/         # Casca da app
│   └── header.tsx              # Logo "AU" + nav (Board / Novo Card / Dashboard)
│
└── ui/             # Primitivos genéricos (estilo do Figma)
    ├── button.tsx              # Variantes primary / ghost + loading state
    ├── badge.tsx               # Selo colorido (status)
    └── dialog.tsx              # Wrapper sobre @radix-ui/react-dialog
```

---

## Princípios

### Componentes de domínio (`board/`, `dashboard/`, `forms/`)

- Conhecem os tipos do produto (`Task`, `TaskStatus`, `STATUS_CONFIG`).
- Recebem callbacks por prop — **não** chamam hooks de I/O direto.
- Quem orquestra dados é a página (`app/(board)/page.tsx`, etc.).

### Componentes de UI (`ui/`)

- Sem dependência de domínio — só Radix + Tailwind + variantes.
- Reutilizáveis em qualquer feature.
- Tipados com `class-variance-authority` para variantes.

### Animações

- Cards usam `motion.div` com `layout` (Framer Motion) — animam transições entre colunas.
- `<AnimatePresence mode="popLayout">` em `BoardColumn` permite enter/exit suaves.
- Dashboard usa stagger animations no grid de KPIs.

### Drag-and-drop

Implementação nativa (HTML5 Drag and Drop API) sem dependência adicional:

- `TaskCard` é `draggable` e seta `dataTransfer` com `taskId` e `fromStatus`.
- `BoardColumn` trata `onDragOver`, `onDragLeave`, `onDrop`. Visual de "drag-over" muda a borda.
- Página chama `onDropFromDrag(taskId, from, to)` que abre o modal.

---

## Componentes principais — referência rápida

### `BoardColumn`

```tsx
<BoardColumn
  status={status}
  tasks={getByStatus(status)}
  isLoading={isLoading}
  onMove={(task, to) => openMoveModal(task, to)}
  onDropFromDrag={(taskId, from, to) => openMoveModal(...)}
  onAddCard={status === 'todo' ? () => router.push('/novo-card') : undefined}
/>
```

- Header com label + dot colorido + contador.
- Lista renderiza `<TaskCard>` ou skeletons enquanto `isLoading`.
- Botão "Adicionar card" só aparece na coluna `todo`.

### `TaskCard`

```tsx
<TaskCard task={task} onMove={(task, to) => ...} />
```

- Mostra título, descrição (truncada em 2 linhas), data e botão "avançar status".
- Botão só aparece no hover (acessível via teclado).
- Não aparece na coluna `done` (não há próximo status).

### `MoveTaskModal`

Modal Radix com:

- Card sendo movido.
- Badge "de" → "para" (com cores do `STATUS_CONFIG`).
- Textarea de comentário **obrigatório** (validação client-side).
- Cancelar / Confirmar.

### `CreateCardForm`

- Banner laranja informativo ("Status inicial: A Fazer").
- Inputs de título e descrição com contador de caracteres na descrição.
- Validação visual (borda vermelha + mensagem).
- Botão de submit com estado de loading.

### `StatCard`

Componente puro de apresentação. Recebe `icon`, `value`, `label`, `sublabel`, `iconBgColor`. Layout fixo (ícone em topo, número grande em baixo).

---

## Acessibilidade

- `aria-label` em botões sem texto visível ("Voltar", "Adicionar card").
- `aria-current="page"` no link ativo do header.
- `aria-invalid` + `aria-describedby` em todos os inputs com validação.
- `role="article"` no `TaskCard` com label do título.
- Focus rings nativos preservados (não escondemos com `outline-none` sem substituir).
