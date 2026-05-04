# `tasks/infrastructure`

Camada de **adapters**. Implementa as interfaces (ports) declaradas em `domain/` usando tecnologias concretas.

Hoje contém um único adapter: `PrismaTaskRepository` (PostgreSQL via Prisma).

---

## `PrismaTaskRepository`

```ts
@Injectable()
export class PrismaTaskRepository implements TaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Task[]> { ... }
  async findById(id: string): Promise<Task | null> { ... }
  async findMaxPositionByStatus(status: TaskStatus): Promise<number> { ... }
  async create(data: CreateTaskData): Promise<Task> { ... }
  async update(id: string, data: UpdateTaskData): Promise<Task> { ... }
  async delete(id: string): Promise<void> { ... }

  private toEntity(record): Task { ... }
}
```

### Pontos importantes

#### 1. Mapeamento Prisma ↔ domínio

O método privado `toEntity(record)` converte o registro do Prisma na entidade `Task`. **Os casos de uso nunca veem o tipo do Prisma** — só veem `Task`.

```ts
private toEntity(record): Task {
  return new Task(
    record.id,
    record.title,
    record.description,
    record.status as unknown as TaskStatus,
    record.position,
    record.createdAt,
    record.updatedAt,
  );
}
```

#### 2. Ordenação determinística no `findAll`

```ts
orderBy: [{ status: 'asc' }, { position: 'asc' }, { createdAt: 'asc' }]
```

Garante que duas tarefas com mesma `position` no mesmo status mantenham ordem estável (`createdAt` como desempate).

#### 3. `findMaxPositionByStatus` usa agregação SQL

```ts
this.prisma.task.aggregate({
  where: { status },
  _max: { position: true },
})
```

Mais eficiente que `findMany + Math.max`. Quando não há registros, devolve `0` (`?? 0`) — o caso de uso então cria com `position = 1`.

#### 4. `update` só envia campos definidos

```ts
data: {
  ...(data.title !== undefined && { title: data.title }),
  ...(data.description !== undefined && { description: data.description }),
  ...(data.status !== undefined && { status: data.status as PrismaTaskStatus }),
  ...(data.position !== undefined && { position: data.position }),
}
```

Evita sobrescrever campos com `undefined` e permite que o `PATCH /tasks/:id` seja parcial de verdade. Os testes de integração validam isso explicitamente.

#### 5. Delete não devolve nada

Prisma's `delete` retorna o registro deletado, mas a interface do port é `Promise<void>` (não vazamos o detalhe).

---

## Regras desta camada

- ✅ Pode importar de `domain/` (implementa `TaskRepository`).
- ✅ Pode importar `@prisma/client` e o `PrismaService`.
- ❌ **Não** pode importar de `application/` ou `presentation/`.
- ❌ **Não** lança `HttpException` (essa tradução é da borda HTTP).
- ✅ É a **única** camada do módulo `tasks` que pode conhecer Prisma.

---

## Adicionando outros adapters

Para implementar, por exemplo, um repositório em memória para testes (alternativa ao mock atual):

```ts
// tasks/infrastructure/in-memory-task.repository.ts
@Injectable()
export class InMemoryTaskRepository implements TaskRepository {
  private store = new Map<string, Task>();
  // ... implementação
}
```

E no `TasksModule`:

```ts
{ provide: TASK_REPOSITORY, useClass: InMemoryTaskRepository }
```

Nenhum caso de uso muda.
