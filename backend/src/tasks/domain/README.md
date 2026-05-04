# `tasks/domain`

Camada mais interna do módulo. **Não depende de nada**: nem do NestJS, nem do Prisma, nem de bibliotecas de validação. Modela conceitos de negócio puros.

---

## Conteúdo

| Arquivo                | Conteúdo                                                                |
|------------------------|-------------------------------------------------------------------------|
| `task.entity.ts`       | Classe `Task` com comportamento de negócio                              |
| `task.repository.ts`   | Interface `TaskRepository` (port) + símbolo `TASK_REPOSITORY` + tipos   |
| `task-status.enum.ts`  | Enum `TaskStatus` (`TODO` / `IN_PROGRESS` / `DONE`)                     |

---

## `Task` — entidade rica (não anêmica)

```ts
export class Task {
  constructor(
    public readonly id: string,
    public title: string,
    public description: string | null,
    public status: TaskStatus,
    public position: number,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  changeStatus(status: TaskStatus): void { ... }
  update(title: string, description: string | null): void { ... }
  reposition(position: number): void { ... }
}
```

- `id` e `createdAt` são `readonly` — invariantes da entidade.
- Métodos de negócio (`changeStatus`, `update`, `reposition`) atualizam `updatedAt`.
- **Sem decorators** (`@Entity`, `@Column`, etc.). A entidade não conhece a tabela.

### Por que esses métodos e não outros?

Coloquei na entidade só o que é **regra do agregado**: mudar status, editar texto, mudar posição. Validações de transição (ex.: "DONE não pode voltar para TODO") **não** estão presentes — o desafio não exige e o produto pode querer essa flexibilidade.

---

## `TaskRepository` — port

```ts
export const TASK_REPOSITORY = Symbol('TASK_REPOSITORY');

export interface TaskRepository {
  findAll(): Promise<Task[]>;
  findById(id: string): Promise<Task | null>;
  findMaxPositionByStatus(status: TaskStatus): Promise<number>;
  create(data: CreateTaskData): Promise<Task>;
  update(id: string, data: UpdateTaskData): Promise<Task>;
  delete(id: string): Promise<void>;
}
```

- O **símbolo** (`Symbol('TASK_REPOSITORY')`) evita colisões silenciosas que aconteceriam com tokens string. Quem injeta usa `@Inject(TASK_REPOSITORY)`.
- Tipos `CreateTaskData` e `UpdateTaskData` ficam aqui (e não em `application/dto/`) porque pertencem ao **contrato do port**, não à API HTTP.

---

## Regras desta camada

- ✅ Pode importar de **lib padrão do TypeScript** (Date, etc.).
- ❌ **Não** pode importar de `@nestjs/*`, `@prisma/client`, `class-validator`, `zod`, etc.
- ❌ **Não** pode importar de `application/`, `infrastructure/` ou `presentation/`.
- ❌ **Não** lança `HttpException` — quem traduz para HTTP é o controller / filter.

Se algo violar essas regras, é sinal de que pertence a outra camada.
