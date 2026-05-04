# README Explicativo — Desafio Técnico AU

> Este documento é um guia de revisão completo do projeto. Explica o que foi construído, por que cada decisão foi tomada, como as peças se conectam e o que ficou de fora — em linguagem clara, sem omitir os detalhes técnicos.

---

## Índice

1. [O que foi construído](#1-o-que-foi-construído)
2. [Stack utilizada e por quê](#2-stack-utilizada-e-por-quê)
3. [Como o projeto está organizado](#3-como-o-projeto-está-organizado)
4. [Backend — camada por camada](#4-backend--camada-por-camada)
   - [Banco de dados](#41-banco-de-dados-prisma--postgresql)
   - [Domínio](#42-domínio-a-camada-mais-importante)
   - [Casos de uso](#43-casos-de-uso-application)
   - [Repositório Prisma](#44-repositório-prisma-infrastructure)
   - [Controller HTTP](#45-controller-http-presentation)
   - [Infraestrutura transversal](#46-infraestrutura-transversal-validação-e-erros)
5. [Frontend — parte por parte](#5-frontend--parte-por-parte)
   - [Cliente HTTP](#51-cliente-http-libapits)
   - [Hooks TanStack Query](#52-hooks-tanstack-query)
   - [Páginas](#53-páginas)
   - [Componentes](#54-componentes)
6. [Testes](#6-testes)
7. [Como rodar](#7-como-rodar)
8. [Docker](#8-docker)
9. [Uso de IA](#9-uso-de-ia)
10. [Decisões conscientes e trade-offs](#10-decisões-conscientes-e-trade-offs)
11. [O que ficou de fora e por quê](#11-o-que-ficou-de-fora-e-por-quê)
12. [Checklist completo do desafio](#12-checklist-completo-do-desafio)

---

## 1. O que foi construído

Uma aplicação web de **gestão de tarefas no estilo Kanban**, com:

- **Formulário de criação** de tarefa (título + descrição).
- **Quadro Kanban** com três colunas: `A Fazer`, `Em Andamento` e `Concluído`.
- **Movimentação de tarefas** entre colunas via drag-and-drop ou botão de avançar. Toda movimentação abre um modal de confirmação com campo de comentário obrigatório.
- **Dashboard** com gráficos (donut + barras) mostrando distribuição por status e taxa de conclusão.
- **API REST** no backend que persiste tudo no PostgreSQL.
- **Otimismo de UI**: quando o usuário move um card, ele salta de coluna instantaneamente na tela, sem esperar a resposta do servidor. Se o servidor retornar erro, o card volta ao lugar.

### O que o usuário vê

```
┌─────────────────────────────────────────────────────┐
│  Header: [Board]  [Dashboard]  [+ Novo Card]        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  A Fazer (2)    Em Andamento (3)    Concluído (1)   │
│  ┌──────────┐   ┌──────────┐        ┌──────────┐   │
│  │ Estudar  │   │ Revisar  │        │ Config.  │   │
│  │ NestJS   │   │ PRs      │        │ Docker   │   │
│  │ → avançar│   │ → avançar│        │ (done)   │   │
│  └──────────┘   └──────────┘        └──────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 2. Stack utilizada e por quê

### Backend

| Tecnologia | Versão | Papel |
|------------|--------|-------|
| **NestJS** | 11 | Framework Node.js com DI nativo, decorators e estrutura modular — obrigatório no desafio |
| **Prisma ORM** | 7 | Acesso ao banco com schema tipado, migrations e cliente gerado automaticamente — obrigatório |
| **PostgreSQL** | 16 | Banco relacional via Docker; suporta enum nativo (usado no `TaskStatus`) |
| **class-validator** | latest | Decorators de validação nos DTOs (`@IsString`, `@MaxLength`, `@IsEnum`, etc.) |
| **class-transformer** | latest | Converte tipos primitivos automaticamente (ex: string `"0"` → número `0`) |
| **Jest + Supertest** | 29 / 6 | Framework de testes; Supertest faz requisições HTTP reais para os testes e2e |

### Frontend

| Tecnologia | Versão | Papel |
|------------|--------|-------|
| **Next.js** | 16 | Framework React com App Router — obrigatório. Usado em modo SPA (sem SSR nas páginas de negócio) |
| **TanStack Query** | 5 | Gerenciamento de estado server-side: cache, invalidação, estados de loading/erro, optimistic updates — obrigatório |
| **Tailwind CSS** | 4 | Utilitários CSS — obrigatório |
| **React Hook Form + Zod** | latest | Formulários com validação client-side tipada |
| **Radix UI** | 1.x | Componentes acessíveis primitivos (Dialog/Modal) |
| **Framer Motion** | 11 | Animações de layout e stagger nos cards e estatísticas |
| **Recharts** | 2.10 | Gráficos (donut + barras) no dashboard |
| **Lucide React** | latest | Ícones SVG |

---

## 3. Como o projeto está organizado

```
desafio-tecnico-academia-do-universitario/
│
├── docker-compose.yml          ← banco + backend + frontend (via profiles)
├── docker-compose.dev.yml      ← versão de dev com hot-reload
│
├── docs/
│   ├── CHALLENGE.md            ← enunciado original do desafio
│   ├── AI_USAGE.md             ← documentação completa do uso de IA
│   └── DOCKER.md               ← guia de Docker
│
├── backend/                    ← API REST (NestJS + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma       ← definição do banco (modelo Task + enum)
│   │   ├── migrations/         ← histórico de alterações do banco (versionado)
│   │   └── seed.ts             ← script que cria 6 tarefas de exemplo
│   ├── src/
│   │   ├── tasks/              ← módulo principal (arquitetura hexagonal)
│   │   │   ├── domain/         ← entidade, enum e contrato do repositório
│   │   │   ├── application/    ← casos de uso e DTOs
│   │   │   ├── infrastructure/ ← implementação Prisma do repositório
│   │   │   └── presentation/   ← controller HTTP
│   │   ├── prisma/             ← serviço de conexão com o banco
│   │   ├── common/             ← filtro global de erros
│   │   └── main.ts             ← bootstrap da aplicação
│   └── __tests__/              ← todos os testes (148 no total)
│
└── frontend/                   ← SPA (Next.js + TanStack Query)
    └── src/
        ├── app/                ← páginas (Kanban, formulário, dashboard)
        ├── components/         ← componentes de UI
        ├── hooks/              ← toda integração com a API via TanStack Query
        ├── lib/                ← cliente HTTP centralizado
        └── types/              ← tipos TypeScript compartilhados
```

**Lógica geral:** o frontend nunca fala diretamente com o banco. Ele faz chamadas HTTP para o backend, que processa as regras de negócio e persiste no PostgreSQL. A separação é completa.

---

## 4. Backend — camada por camada

O backend segue **arquitetura hexagonal** (também chamada de Ports & Adapters). A ideia central é: o núcleo do sistema (regras de negócio) não depende de frameworks, bancos ou bibliotecas externas. Quem depende de quem:

```
HTTP (exterior)
    │
    ▼
[Presentation]   ← sabe NestJS, não sabe Prisma
    │
    ▼
[Application]    ← sabe a interface do repositório, não sabe NestJS nem Prisma
    │
    ▼
[Domain]         ← não sabe nada (puro TypeScript)
    ▲
    │
[Infrastructure] ← sabe Prisma, implementa a interface do Domain
```

Cada seta significa "depende de". O domínio não depende de ninguém — e isso é intencional.

---

### 4.1 Banco de dados (Prisma + PostgreSQL)

**Arquivo:** `backend/prisma/schema.prisma`

```prisma
model Task {
  id          String     @id @default(cuid())  ← ID único tipo "ckm9z3abc..."
  title       String                            ← obrigatório, máx 120 chars
  description String?                           ← opcional (? = nullable)
  status      TaskStatus @default(TODO)         ← enum nativo do PostgreSQL
  position    Int        @default(0)            ← ordem dentro da coluna
  createdAt   DateTime   @default(now())        ← preenchido automaticamente
  updatedAt   DateTime   @updatedAt             ← atualizado automaticamente

  @@map("tasks")                                ← nome da tabela no banco: "tasks"
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
}
```

**Por que `cuid`?** Mais amigável em URLs do que UUID (menor, começa sempre com letra).

**Por que `position`?** Garante uma ordem determinística dentro de cada coluna. Quando uma tarefa é criada, ela recebe `posição máxima atual + 1`, ficando sempre no final da coluna.

**Por que enum nativo?** O PostgreSQL valida o valor diretamente no banco — é impossível salvar um status inválido mesmo que a aplicação tente.

**Migrations:** cada alteração no schema gera um arquivo SQL versionado em `prisma/migrations/`. Isso garante que o banco em produção e em dev evolui de forma controlada.

**Seed:** `npx prisma db seed` executa `seed.ts`, que apaga a tabela e recria 6 tarefas distribuídas entre os três status. Útil para avaliação sem precisar criar tarefas manualmente.

---

### 4.2 Domínio — a camada mais importante

**Pasta:** `backend/src/tasks/domain/`

Esta é a camada que contém as regras de negócio. Ela tem zero dependência de NestJS, Prisma ou qualquer biblioteca externa.

#### Entidade `Task`

**Arquivo:** `domain/task.entity.ts`

```typescript
export class Task {
  constructor(
    public readonly id: string,       // readonly: não pode mudar após criação
    public title: string,
    public description: string | null,
    public status: TaskStatus,
    public position: number,
    public readonly createdAt: Date,  // readonly: não pode mudar após criação
    public updatedAt: Date,
  ) {}

  changeStatus(status: TaskStatus): void {
    this.status = status;
    this.updatedAt = new Date();  // sempre atualiza updatedAt quando algo muda
  }

  update(title: string, description: string | null): void {
    this.title = title;
    this.description = description;
    this.updatedAt = new Date();
  }

  reposition(position: number): void {
    this.position = position;
    this.updatedAt = new Date();
  }
}
```

A entidade é "rica" — ela tem comportamento (métodos), não é apenas um saco de dados. Isso segue o padrão **Rich Domain Model** em contraste com o **Anemic Domain Model** (onde a entidade seria só `{ id, title, status, ... }` sem métodos).

**Por que `id` e `createdAt` são `readonly`?** Porque esses campos nunca devem mudar após a criação. O TypeScript garante isso em tempo de compilação.

#### Interface do Repositório (Port)

**Arquivo:** `domain/task.repository.ts`

```typescript
export const TASK_REPOSITORY = Symbol('TASK_REPOSITORY');  // ← token de DI

export interface TaskRepository {
  findAll(): Promise<Task[]>;
  findById(id: string): Promise<Task | null>;
  findMaxPositionByStatus(status: TaskStatus): Promise<number>;
  create(data: CreateTaskData): Promise<Task>;
  update(id: string, data: UpdateTaskData): Promise<Task>;
  delete(id: string): Promise<void>;
}
```

Esta **interface** é um contrato. Ela diz "quem quiser ser um repositório de tarefas deve implementar esses métodos". O domínio não sabe se o banco é PostgreSQL, SQLite ou um array em memória — isso não é problema dele.

O `Symbol('TASK_REPOSITORY')` é o token de injeção de dependência. Usar `Symbol` em vez de uma string `"TASK_REPOSITORY"` evita colisões silenciosas por typo.

---

### 4.3 Casos de uso (Application)

**Pasta:** `backend/src/tasks/application/`

Cada operação tem seu próprio arquivo. Isso é o **princípio da responsabilidade única** (SRP) na prática.

#### DTOs — contratos de entrada e saída

DTOs (Data Transfer Objects) definem o formato dos dados que entram e saem da API.

**`CreateTaskDto`** — o que o frontend manda ao criar uma tarefa:
```typescript
export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title: string;          // obrigatório, máx 120 chars

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;   // opcional, máx 500 chars

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;    // opcional; padrão é TODO
}
```

Os decorators (`@IsString`, `@IsNotEmpty`, etc.) são processados pelo `ValidationPipe` do NestJS. Se algum não passar, o NestJS retorna `400 Bad Request` automaticamente com os erros, sem chegar nos casos de uso.

**`TaskResponseDto`** — o que a API devolve:
```typescript
export class TaskResponseDto {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  position: number;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(task: Task): TaskResponseDto {
    // mapeia a entidade interna para o formato público da API
  }
}
```

O método `fromEntity` é importante: ele impede que detalhes internos da entidade vazem para a API. Se a entidade mudar internamente, o DTO permanece estável.

#### Casos de uso

**`CreateTaskUseCase`:**
```typescript
async execute(dto: CreateTaskDto): Promise<TaskResponseDto> {
  const status = dto.status ?? TaskStatus.TODO;
  const maxPosition = await this.taskRepository.findMaxPositionByStatus(status);
  const task = await this.taskRepository.create({
    title: dto.title,
    description: dto.description ?? null,
    status,
    position: maxPosition + 1,   // ← sempre vai para o final da coluna
  });
  return TaskResponseDto.fromEntity(task);
}
```

Fluxo: recebe o DTO validado → descobre qual é a maior posição atual na coluna de destino → cria a tarefa com `posição = máximo + 1` → retorna o DTO de resposta.

**`UpdateTaskUseCase`:**
```typescript
async execute(id: string, dto: UpdateTaskDto): Promise<TaskResponseDto> {
  const existing = await this.taskRepository.findById(id);
  if (!existing) {
    throw new NotFoundException(`Tarefa com id "${id}" não encontrada`);
  }
  const task = await this.taskRepository.update(id, { ...dto });
  return TaskResponseDto.fromEntity(task);
}
```

Antes de atualizar, verifica se a tarefa existe. Se não existir, lança `NotFoundException` (que se torna um 404 automaticamente). **A verificação de existência fica nos casos de uso, não no controller.** O controller não tem condicional nenhum.

**`DeleteTaskUseCase`** e **`ListTasksUseCase`** seguem a mesma lógica.

---

### 4.4 Repositório Prisma (Infrastructure)

**Arquivo:** `backend/src/tasks/infrastructure/prisma-task.repository.ts`

Esta é a implementação concreta da interface `TaskRepository` usando o Prisma. É o **único arquivo do backend que conhece o Prisma**.

```typescript
@Injectable()
export class PrismaTaskRepository implements TaskRepository {

  async findAll(): Promise<Task[]> {
    const records = await this.prisma.task.findMany({
      orderBy: [
        { status: 'asc' },      // ← agrupa por status
        { position: 'asc' },    // ← dentro do status, ordena por position
        { createdAt: 'asc' },   // ← desempate por data de criação
      ],
    });
    return records.map(this.toEntity);
  }

  async findMaxPositionByStatus(status: TaskStatus): Promise<number> {
    const result = await this.prisma.task.aggregate({
      where: { status: status as PrismaTaskStatus },
      _max: { position: true },
    });
    return result._max.position ?? 0;  // ← se não houver tarefa, retorna 0
  }

  async update(id: string, data: UpdateTaskData): Promise<Task> {
    const record = await this.prisma.task.update({
      where: { id },
      data: {
        // só inclui campos que foram explicitamente passados
        // evita sobrescrever campos com undefined
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status as PrismaTaskStatus }),
        ...(data.position !== undefined && { position: data.position }),
      },
    });
    return this.toEntity(record);
  }

  private toEntity(record: PrismaTask): Task {
    return new Task(
      record.id,
      record.title,
      record.description,
      record.status as TaskStatus,  // converte enum do Prisma para enum do domínio
      record.position,
      record.createdAt,
      record.updatedAt,
    );
  }
}
```

**Por que o UPDATE parcial é importante?** O Prisma não tem `undefined` — se você passar `{ description: undefined }`, ele **apaga** a descrição. O código usa spread condicional para incluir apenas os campos que realmente foram enviados.

**Por que `_max.position` em vez de `ORDER BY position DESC LIMIT 1`?** A agregação SQL é mais eficiente: não carrega registros inteiros, apenas calcula o máximo diretamente no banco.

---

### 4.5 Controller HTTP (Presentation)

**Arquivo:** `backend/src/tasks/presentation/tasks.controller.ts`

```typescript
@Controller('tasks')
export class TasksController {
  constructor(
    private readonly createTask: CreateTaskUseCase,
    private readonly listTasks: ListTasksUseCase,
    private readonly updateTask: UpdateTaskUseCase,
    private readonly deleteTask: DeleteTaskUseCase,
  ) {}

  @Get()
  async findAll(): Promise<TaskResponseDto[]> {
    return this.listTasks.execute();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)                    // ← responde 201, não 200
  async create(@Body() dto: CreateTaskDto): Promise<TaskResponseDto> {
    return this.createTask.execute(dto);
  }

  @Patch(':id')                                    // ← PATCH = atualização parcial
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    return this.updateTask.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)                 // ← responde 204, sem body
  async remove(@Param('id') id: string): Promise<void> {
    return this.deleteTask.execute(id);
  }
}
```

O controller tem **zero lógica de negócio**. Ele só recebe a requisição HTTP e delega para o caso de uso correto. Qualquer `if`, cálculo ou regra aqui seria uma violação da arquitetura.

**Por que `PATCH` em vez de `PUT`?** `PATCH` significa atualização parcial — você pode mandar só `{ status: "IN_PROGRESS" }` sem precisar repetir título e descrição. `PUT` substituiria o recurso inteiro.

**Rotas resultantes** (com prefixo `/api` configurado no `main.ts`):

| Método | URL | Status de sucesso |
|--------|-----|-------------------|
| GET | `/api/tasks` | 200 |
| POST | `/api/tasks` | 201 |
| PATCH | `/api/tasks/:id` | 200 |
| DELETE | `/api/tasks/:id` | 204 |

---

### 4.6 Infraestrutura transversal (validação e erros)

**Arquivo:** `backend/src/main.ts` — onde o NestJS é configurado globalmente:

```typescript
app.enableCors({ origin: process.env.FRONTEND_URL });  // só aceita requisições do frontend
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,      // remove campos não declarados no DTO silenciosamente
  transform: true,      // converte tipos (ex: "0" → 0)
}));
app.useGlobalFilters(new HttpExceptionFilter());         // padroniza todos os erros
app.setGlobalPrefix('api');                              // todas as rotas ficam em /api/...
```

**`HttpExceptionFilter`** — toda exceção (seja um 404, um 400 de validação ou um bug inesperado) vira este formato:

```json
{
  "statusCode": 404,
  "message": "Tarefa com id \"abc\" não encontrada",
  "path": "/api/tasks/abc",
  "timestamp": "2026-05-03T13:38:01.234Z"
}
```

`message` pode ser `string` (erro simples) ou `string[]` (múltiplos erros de validação). Bugs internos viram `500` com mensagem em português e o stack trace é logado no servidor.

---

## 5. Frontend — parte por parte

O frontend é uma SPA (Single Page Application) em Next.js. As páginas não fazem SSR — tudo é renderizado no cliente. A comunicação com o backend passa sempre pelos hooks do TanStack Query.

**Fluxo de dados:**

```
Página (React) → Hook (TanStack Query) → api.ts (fetch) → Backend REST
```

---

### 5.1 Cliente HTTP (`lib/api.ts`)

**Arquivo:** `frontend/src/lib/api.ts`

Este arquivo centraliza todas as chamadas HTTP. As páginas e componentes nunca usam `fetch` diretamente.

```typescript
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333/api'

// mapeamento bidirecional de status
// backend usa SCREAMING_SNAKE_CASE (convenção SQL/Prisma)
// frontend usa lowercase (alinhado com STATUS_CONFIG e tipos TypeScript)
const statusToFrontend = { TODO: 'todo', IN_PROGRESS: 'in_progress', DONE: 'done' }
const statusToBackend  = { todo: 'TODO', in_progress: 'IN_PROGRESS', done: 'DONE' }

// helper genérico: lança erro se HTTP não-OK, retorna o JSON tipado
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message ?? `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T  // DELETE não tem body
  return res.json()
}

export const api = {
  tasks: {
    list: ()                           => request('/tasks').then(items => items.map(mapTask)),
    create: (title, description)       => request('/tasks', { method: 'POST', body: JSON.stringify({ title, description }) }).then(mapTask),
    update: (id, data)                 => request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ status: statusToBackend[data.status] }) }).then(mapTask),
    delete: (id)                       => request(`/tasks/${id}`, { method: 'DELETE' }),
  },
}
```

**Por que centralizar?** Se a URL do backend mudar, ou o formato de status mudar, só este arquivo precisa ser alterado. Nenhum componente precisa saber que o backend chama de `IN_PROGRESS` e o frontend chama de `in_progress`.

---

### 5.2 Hooks TanStack Query

**Arquivo:** `frontend/src/hooks/use-tasks.ts`

O TanStack Query gerencia o cache dos dados do servidor. Em vez de guardar tarefas no `useState`, os hooks consultam (e cachiam) a API.

#### `useTasks` — busca e deriva estatísticas

```typescript
export function useTasks() {
  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ['tasks'],    // chave única do cache
    queryFn: api.tasks.list,
    staleTime: 30_000,      // dados ficam "frescos" por 30s sem rebuscar
  })

  const stats = {
    total: data.length,
    todo: data.filter(t => t.status === 'todo').length,
    inProgress: data.filter(t => t.status === 'in_progress').length,
    done: data.filter(t => t.status === 'done').length,
    completionRate: data.length > 0
      ? Math.round((data.filter(t => t.status === 'done').length / data.length) * 100)
      : 0,
  }

  return {
    tasks: data,
    stats,
    isLoading,
    isError,
    error,
    getByStatus: (status) => data.filter(t => t.status === status),
  }
}
```

As estatísticas são **derivadas em memória** do array já carregado — não há endpoints separados de analytics no backend. Se as tarefas já estão em cache, calcular `data.filter(...)` é instantâneo.

#### `useUpdateTask` — com optimistic update

Este é o hook mais elaborado. Quando o usuário move um card, a UI deve responder imediatamente — não pode ficar esperando a API:

```typescript
export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }) => api.tasks.update(id, data),

    // 1. ANTES de mandar para o servidor:
    onMutate: async ({ id, status }) => {
      // Cancela qualquer refetch que possa sobrescrever o update otimista
      await queryClient.cancelQueries({ queryKey: ['tasks'] })

      // Salva o estado atual (para rollback se der erro)
      const previous = queryClient.getQueryData(['tasks'])

      // Atualiza o cache localmente (o card "salta" de coluna aqui)
      queryClient.setQueryData(['tasks'], (old) =>
        old?.map(t => t.id === id ? { ...t, status } : t) ?? []
      )

      return { previous }  // retorna snapshot para o onError
    },

    // 2. SE o servidor retornar erro:
    onError: (_err, _vars, ctx) => {
      // Restaura o cache para o estado antes do update
      if (ctx?.previous) queryClient.setQueryData(['tasks'], ctx.previous)
    },

    // 3. SEMPRE ao final (sucesso ou erro):
    onSettled: () => {
      // Invalida o cache para buscar o estado real do servidor
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
```

**Como fica do ponto de vista do usuário:**
1. Arrasta o card → ele salta de coluna **imediatamente** (otimismo).
2. A API processa em background.
3. Se sucesso: a invalidação confirma o que já está na tela.
4. Se erro: o card volta silenciosamente ao lugar original.

`useDeleteTask` segue o mesmo padrão — o card desaparece da lista imediatamente, e volta se o servidor rejeitar.

---

### 5.3 Páginas

#### `/` — Quadro Kanban

**Arquivo:** `frontend/src/app/(board)/page.tsx`

Renderiza as três colunas e gerencia os dois fluxos de movimentação:

- **Drag-and-drop:** `onDragStart` no card armazena o ID no `dataTransfer`. `onDrop` na coluna lê esse ID e abre o modal de confirmação.
- **Botão avançar:** o card tem um botão que diretamente abre o modal.

```typescript
const COLUMNS: TaskStatus[] = ['todo', 'in_progress', 'done']

export default function BoardPage() {
  const { tasks, getByStatus, stats, isLoading } = useTasks()
  const updateTask = useUpdateTask()
  const [moveModal, setMoveModal] = useState(null)

  function handleDrop(taskId, from, to) {
    const task = tasks.find(t => t.id === taskId)
    if (task) setMoveModal({ task, to })  // abre modal, não move direto
  }

  function handleMoveConfirm(payload) {
    updateTask.mutate({ id: payload.taskId, status: payload.to })
    setMoveModal(null)
  }

  return (
    <div>
      {COLUMNS.map(status => (
        <BoardColumn
          key={status}
          status={status}
          tasks={getByStatus(status)}
          isLoading={isLoading}
          onMove={handleMoveClick}
          onDropFromDrag={handleDrop}
        />
      ))}
      <MoveTaskModal
        open={moveModal !== null}
        onConfirm={handleMoveConfirm}
        ...
      />
    </div>
  )
}
```

#### `/novo-card` — Criar tarefa

**Arquivo:** `frontend/src/app/(board)/novo-card/page.tsx`

Página simples que renderiza o `CreateCardForm` e, ao submeter com sucesso, navega de volta para o board:

```typescript
async function handleSubmit(title, description) {
  await createTask.mutateAsync({ title, description })
  router.push('/')  // só navega se a API retornar sucesso
}
```

#### `/dashboard` — Métricas

**Arquivo:** `frontend/src/app/(board)/dashboard/page.tsx`

Reutiliza o mesmo `useTasks()` que o board — os dados já estão em cache, não faz nova requisição. Exibe:

- 4 cards de estatística (total, a fazer, em andamento, concluídos com %)
- Gráfico donut com distribuição percentual por status
- Gráfico de barras com contagem por status
- Barra de progresso animada com taxa de conclusão
- Lista das últimas tarefas cadastradas

---

### 5.4 Componentes

**Organização em `frontend/src/components/`:**

```
components/
├── board/
│   ├── board-column.tsx     ← coluna do Kanban (header + lista de cards + drop zone)
│   ├── task-card.tsx        ← card individual (draggable + botão avançar)
│   └── move-task-modal.tsx  ← modal de confirmação ao mover
├── dashboard/
│   ├── stat-card.tsx        ← card de estatística (ícone + número + label)
│   ├── status-donut-chart.tsx ← gráfico donut (Recharts)
│   ├── column-bar-chart.tsx   ← gráfico de barras (Recharts)
│   └── recent-cards.tsx       ← lista das últimas tarefas
├── forms/
│   └── create-card-form.tsx ← formulário com React Hook Form + Zod
├── layout/
│   └── header.tsx           ← nav sticky com links e botão "+ Novo Card"
└── ui/
    ├── button.tsx           ← componente de botão reutilizável
    ├── badge.tsx            ← badge colorido de status
    └── dialog.tsx           ← wrapper do Radix Dialog
```

**`TaskCard`** — os cards são `draggable` e incluem acessibilidade:

```typescript
<motion.div
  layout                          // ← Framer Motion anima quando o card muda de posição
  draggable                       // ← nativo HTML5
  onDragStart={(e) => {
    e.dataTransfer.setData('taskId', task.id)
    e.dataTransfer.setData('fromStatus', task.status)
  }}
  role="article"
  aria-label={`Tarefa: ${task.title}`}
>
```

**`STATUS_CONFIG`** — objeto centralizado em `types/task.ts` que define cores, labels e classes de badge para cada status. Nenhum componente tem `if status === 'todo' ? 'gray' : 'orange'` — tudo vem deste objeto:

```typescript
export const STATUS_CONFIG = {
  todo:        { label: 'A Fazer',       dotColor: '#9CA3AF', badgeClass: 'bg-gray-100 text-gray-600' },
  in_progress: { label: 'Em Andamento',  dotColor: '#F97316', badgeClass: 'bg-orange-100 text-orange-600' },
  done:        { label: 'Concluído',     dotColor: '#22C55E', badgeClass: 'bg-green-100 text-green-600' },
}
```

---

## 6. Testes

### Visão geral — pirâmide de testes

```
              ┌──────────┐
              │   E2E    │  1 suíte, 25 specs
              │          │  HTTP completo via Supertest
              └────┬─────┘
                   │
            ┌──────┴──────┐
            │  Integração  │  1 suíte, 30 specs
            │              │  adapter Prisma com PrismaService mockado
            └──────┬───────┘
                   │
        ┌──────────┴──────────┐
        │      Unitários       │  9 suítes, ~93 specs
        │                      │  domain, DTOs, use cases, controller, filter
        └──────────────────────┘

        Total: 11 suítes / 148 testes
```

**Importante:** nenhum teste precisa de banco real. O `PrismaService` é mockado em todos os níveis.

---

### Unitários — o que cada suíte cobre

**`task.entity.spec.ts` (18 specs)**
- Todos os campos são atribuídos corretamente pelo construtor
- `id` e `createdAt` continuam iguais após chamar `changeStatus`, `update` e `reposition`
- Cada método atualiza `updatedAt` e não mexe nos outros campos

**`create-task.dto.spec.ts`**
- `title` vazio → erro de validação
- `title` com 121 chars → erro
- `status` com valor inválido → erro
- Campos válidos → sem erro

**`create-task.use-case.spec.ts`**
- Chama `findMaxPositionByStatus` antes de `create`
- A posição criada é `maxPosition + 1`
- Se não há tarefa na coluna, position = 1 (pois `findMax` retorna 0)
- Retorna `TaskResponseDto` (não a entidade bruta)

**`update-task.use-case.spec.ts`**
- Lança `NotFoundException` se o id não existe
- Chama o repositório com os dados corretos
- Retorna `TaskResponseDto` atualizado

**`tasks.controller.spec.ts` (13 specs)**
- `findAll()` chama `listTasks.execute()` e retorna o resultado
- `create(dto)` chama `createTask.execute(dto)` e retorna o resultado
- `update(id, dto)` chama `updateTask.execute(id, dto)`
- `remove(id)` chama `deleteTask.execute(id)`
- Propaga exceções sem modificar (o controller não encapsula erros)

**`http-exception.filter.spec.ts` (12 specs)**
- `NotFoundException` → 404
- `BadRequestException` → 400
- Erros internos (qualquer `Error`) → 500 com mensagem em português
- A resposta sempre tem `statusCode`, `message`, `path`, `timestamp`

---

### Integração — `PrismaTaskRepository`

**`prisma-task.repository.spec.ts` (30 specs)**

Testa o adapter Prisma injetando um `PrismaService` mockado com `jest.fn()`. Verifica:

- O payload exato enviado ao `prisma.task.findMany` (orderBy correto)
- O payload exato enviado ao `prisma.task.aggregate` (where + _max.position)
- O mapeamento de registro do Prisma para a entidade `Task`
- O UPDATE parcial (campos `undefined` não são incluídos no payload)
- Que `findMaxPositionByStatus` retorna `0` quando não há tarefas (resultado `null` da aggregate)

---

### E2E — API HTTP completa

**`tasks.e2e-spec.ts` (25 specs)**

Cria uma aplicação NestJS completa em memória (com `ValidationPipe`, `HttpExceptionFilter` e prefixo `/api` — idêntico ao ambiente real) e faz requisições HTTP reais via Supertest.

Cobre:
- `GET /api/tasks` → 200 com array
- `POST /api/tasks` → 201 com tarefa criada
- `POST /api/tasks` com title vazio → 400 com mensagem de erro estruturada
- `POST /api/tasks` com title > 120 chars → 400
- `PATCH /api/tasks/:id` → 200 com tarefa atualizada
- `PATCH /api/tasks/id-que-nao-existe` → 404 com mensagem contendo o id
- `PATCH /api/tasks/:id` com position negativa → 400
- `DELETE /api/tasks/:id` → 204 sem body
- `DELETE /api/tasks/id-que-nao-existe` → 404
- Fluxo completo: criar → mover para IN_PROGRESS → mover para DONE

---

### Como rodar os testes

```bash
cd backend

npm test                   # roda tudo (148 testes)
npm run test:unit          # só unitários
npm run test:integration   # só integração
npm run test:e2e           # só e2e
npm run test:cov           # tudo + relatório de cobertura em coverage/
```

---

## 7. Como rodar

### Pré-requisitos

- [Docker](https://www.docker.com/) e Docker Compose v2+
- [Node.js](https://nodejs.org/) 20+ e npm 10+ (para modo dev)

### Opção A — Modo dev (recomendado)

Só o banco fica no Docker; backend e frontend rodam diretamente na máquina com hot reload.

```bash
# 1. Subir só o banco
docker compose up -d

# 2. Backend (em um terminal)
cd backend
cp .env.example .env
npm install
npx prisma migrate deploy   # cria as tabelas
npx prisma db seed           # opcional: 6 tarefas de exemplo
npm run start:dev

# 3. Frontend (em outro terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
```

| Serviço | URL |
|---------|-----|
| Frontend | `http://localhost:3000` |
| API | `http://localhost:3333/api/tasks` |

**Variáveis de ambiente:**

```env
# backend/.env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/au_tasks"
PORT=3333
FRONTEND_URL=http://localhost:3000

# frontend/.env
NEXT_PUBLIC_API_URL=http://localhost:3333/api
```

### Opção B — Tudo no Docker

```bash
docker compose --profile app up -d --build
```

Sobe banco + backend + frontend em containers. O backend aguarda o banco estar saudável (healthcheck) e roda as migrations antes de iniciar.

Para popular dados de exemplo:

```bash
docker compose exec backend npx prisma db seed
```

Para derrubar tudo e limpar o banco:

```bash
docker compose --profile app down -v
```

---

## 8. Docker

### Arquivos envolvidos

| Arquivo | Propósito |
|---------|-----------|
| `docker-compose.yml` | Banco sem profile (sobe sempre) + backend/frontend com profile `app` |
| `docker-compose.dev.yml` | Stack completa com hot-reload (volumes de código montados) |
| `backend/Dockerfile` | Multi-stage: instala deps → compila TypeScript → imagem mínima de produção |
| `frontend/Dockerfile` | Multi-stage: instala deps → build Next.js standalone → imagem mínima |
| `backend/Dockerfile.dev` | Imagem de dev com `npm run start:dev` |
| `frontend/Dockerfile.dev` | Imagem de dev com `npm run dev` (Turbopack) |

### Por que multi-stage Dockerfile?

O build de produção tem duas etapas:

1. **Builder** — imagem completa com Node + todas as dependências de dev + compilação TypeScript
2. **Runtime** — imagem mínima com apenas o que roda em produção (sem `devDependencies`, sem código-fonte `.ts`)

Resultado: imagem de produção muito menor (~200MB vs ~800MB).

### Healthchecks

O banco tem healthcheck configurado (`pg_isready` a cada 5s). O backend só sobe quando o banco estiver saudável — evita erros de conexão na inicialização.

---

## 9. Uso de IA

**Ferramentas:** Claude Code (Anthropic) como par de programação principal, com modelos Claude Sonnet 4.6 e Claude Opus 4.7. GitHub Copilot para autocompletar pontual.

**Como foi usado — três regras:**

1. **Decisão técnica primeiro, código depois.** Arquitetura hexagonal, modal de confirmação, optimistic updates — todas decisões tomadas antes de pedir código. A IA implementou; não escolheu.
2. **Revisão linha a linha.** Nada entrou em commit sem leitura. Os testes foram a âncora.
3. **Prompts com contexto explícito.** Em vez de "escreva meu backend", cada prompt abria um arquivo específico e pedia mudanças pontuais.

**Onde a IA ajudou:**

- Boilerplate repetitivo: DTOs, mocks tipados de repositório, esqueleto dos casos de uso
- Padrão canônico de optimistic updates com TanStack Query (`onMutate`/`onError`/`onSettled`)
- Geração dos casos de teste unitários e de integração
- Reorganização dos testes de `{unit,integration,e2e}/` para estrutura por módulo
- Rascunho inicial dos READMEs por módulo (revisados manualmente)

**O que NÃO foi feito por IA:**

- Decisão de usar arquitetura hexagonal vs MVC padrão
- Modelagem do schema Prisma (campo `position`, enum nativo, `cuid`)
- Decisão de exigir comentário ao mover card
- Drag-and-drop nativo vs `@dnd-kit`
- Layout final do Kanban e Dashboard (refinado sobre o Figma)
- Critério do que entrava no escopo (ex: deixar `task_movements` de fora)

**Exemplos de prompts:**

```
Estou modelando a entidade Task para um Kanban com NestJS seguindo
arquitetura hexagonal. A entidade vive no domínio e não pode depender
do Prisma. Quais métodos de negócio fazem sentido na entidade vs. nos
casos de uso? O changeStatus deveria validar transições de estado?
```

```
Tenho um Kanban em Next.js com TanStack Query. Quando o usuário muda
o status de uma tarefa via modal, quero que o card mude de coluna
imediatamente e reverta se a API retornar erro. Me mostre como
implementar com useMutation, onMutate, onError e onSettled.
```

Documentação completa em [`docs/AI_USAGE.md`](./docs/AI_USAGE.md).

---

## 10. Decisões conscientes e trade-offs

### Arquitetura hexagonal no backend

**Alternativa:** MVC padrão do NestJS (`TasksController` + `TasksService` + Prisma direto no service).

**Por que hexagonal?** Testabilidade: casos de uso são testados com mocks de repositório, zero banco. Trocabilidade: mudar o banco é trocar uma linha no módulo. Clareza: cada arquivo tem uma responsabilidade precisa.

**Trade-off:** mais arquivos, mais estrutura. Para um projeto pequeno é "over-engineering" — mas demonstra capacidade de organizar código em escala.

### Modal de confirmação ao mover card

**Alternativa:** drag direto muda o status sem confirmação.

**Por que modal?** Evita movimentações acidentais ao arrastar. Documenta o motivo da transição. Cobre acessibilidade — quem não consegue arrastar usa o botão "avançar".

### HTML5 Drag API nativa (sem `@dnd-kit`)

**Alternativa:** `@dnd-kit` ou `react-dnd` — bibliotecas especializadas em drag.

**Por que nativa?** O UX do desafio é simples: mover entre três colunas. Não justifica 30+ kB de dependência. A desvantagem é que a experiência em mobile é pior (touch events são diferentes de mouse events na API nativa).

### Use cases separados (um por verbo)

**Alternativa:** `TasksService` único com `create`, `update`, `delete`, `findAll` como métodos.

**Por que separados?** SRP — cada arquivo tem uma razão para mudar. Testes isolados — testar `CreateTaskUseCase` não exige mockar `delete`. Evolução — adicionar `ArchiveTaskUseCase` é um arquivo novo, não mexer num service gigante.

### `Symbol` para o token de injeção

**Alternativa:** string `'TASK_REPOSITORY'`.

**Por que Symbol?** Símbolos são únicos por definição — impossível ter colisão acidental. Uma string pode ser duplicada por typo em qualquer lugar do código, causando um bug silencioso.

### Tabela resumo

| Decisão | Alternativa | Motivo |
|---------|-------------|--------|
| Hexagonal | MVC NestJS padrão | Testabilidade, trocabilidade |
| Modal ao mover | Drag sem confirmação | Acessibilidade, rastreabilidade |
| HTML5 Drag nativo | `@dnd-kit` | Sem dependência extra, UX simples |
| Use cases separados | `TasksService` único | SRP, testes isolados |
| `Symbol` no token de DI | String | Evita colisão por typo |
| `cuid` para IDs | UUID | Mais amigável em URLs |
| Enum nativo PostgreSQL | Enum TypeScript apenas | Integridade garantida no banco |
| Seed com 6 tarefas | Sem seed | Facilita avaliação |
| `staleTime: 30s` no TanStack | Sem staleTime (refetch agressivo) | Evita requisições desnecessárias |

---

## 11. O que ficou de fora e por quê

### Persistência do comentário de movimentação

O modal exige um comentário ao mover um card (`MovePayload.comment` existe no tipo TypeScript), mas não há tabela `task_movements` no banco. O backend não recebe esse campo.

**Por quê?** O desafio não pede auditoria de movimentações. Criar a tabela, migration, DTO e caso de uso para persistir o comentário estava além do escopo. O gancho está na UI caso seja necessário evoluir.

### Reordenação vertical dentro da coluna

O campo `position` existe e o backend aceita `PATCH /api/tasks/:id` com `{ position: N }`. Mas o frontend não implementa drag para reordenar cards dentro da mesma coluna — apenas move entre colunas.

**Por quê?** A reordenação dentro de coluna (com atualização de posições de todos os cards afetados) teria complexidade significativa no frontend e exigiria lógica adicional no backend. O desafio pede movimentação entre colunas; a reordenação é um extra não solicitado.

### Testes de frontend

Não há testes com Vitest + React Testing Library.

**Por quê?** O desafio menciona a pirâmide de testes mas não especifica frontend. O backend tem 148 testes cobrindo todas as camadas. Testes de componentes React foram um corte consciente de escopo.

### Autenticação

**Por quê?** Explicitamente fora do escopo do desafio.

---

## 12. Checklist completo do desafio

### Requisitos obrigatórios

- [x] **Cadastro de tarefa** — `/novo-card` com título e descrição, validação Zod + class-validator
- [x] **Quadro Kanban** — três colunas (`A Fazer`, `Em Andamento`, `Concluído`)
- [x] **Mudança de status** — drag-and-drop nativo + botão avançar, ambos com modal de confirmação
- [x] **Persistência via API** — estado no PostgreSQL, nunca só no frontend
- [x] **NestJS** — versão 11
- [x] **Prisma ORM** — versão 7, schema com migrations versionadas
- [x] **Next.js 15+** — versão 16, App Router, modo SPA (sem SSR nas páginas de negócio)
- [x] **Tailwind CSS** — versão 4
- [x] **TanStack Query** — versão 5, com cache, invalidação e optimistic updates

### Diferenciais (todos entregues)

- [x] **Uso de IA documentado** — `docs/AI_USAGE.md` com ferramentas, fluxo e 6 prompts reais
- [x] **Gráfico de distribuição** — dashboard com donut chart + bar chart (Recharts)
- [x] **Arquitetura hexagonal** — domain / application / infrastructure / presentation
- [x] **Pirâmide de testes** — 148 testes em 3 níveis (unitários, integração, e2e)

### Critérios de avaliação (backend)

- [x] Modelagem do domínio com Prisma (enum nativo, `position`, `cuid`)
- [x] Organização em camadas (controllers, serviços/use-cases, repositório, domínio)
- [x] Qualidade de código (nomes descritivos, coesão, SRP)
- [x] Tratamento de erros e validação de entrada (`ValidationPipe`, `HttpExceptionFilter`, DTOs)
- [x] Testes com presença, qualidade e cobertura proporcional ao escopo

### Critérios de avaliação (frontend)

- [x] TanStack Query correto (cache, invalidação, estados de loading/erro, optimistic updates)
- [x] Estrutura de componentes e estilo com Tailwind
- [x] Fidelidade ao layout do Figma
- [x] Feedback visual ao mudar status (modal, animações, optimistic update)

### Critérios transversais

- [x] README de entrega com: como rodar, como testar, decisões técnicas, uso de IA
- [x] Uso consciente de IA (documentado com prompts reais e o que não foi feito por IA)
- [x] Commits com histórico que conta a história do desenvolvimento
