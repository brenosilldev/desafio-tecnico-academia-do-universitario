# `tasks/application`

Camada de **orquestração de negócio**. Casos de uso recebem entrada validada (DTOs), consultam/atualizam o domínio através do `TaskRepository` e devolvem `TaskResponseDto`.

---

## Conteúdo

```
application/
├── dto/
│   ├── create-task.dto.ts       # Entrada do POST /tasks
│   ├── update-task.dto.ts       # Entrada do PATCH /tasks/:id
│   └── task-response.dto.ts     # Saída de qualquer endpoint
└── use-cases/
    ├── create-task.use-case.ts
    ├── list-tasks.use-case.ts
    ├── update-task.use-case.ts
    └── delete-task.use-case.ts
```

Um caso de uso por verbo HTTP do CRUD. Não há um "TasksService" central — cada operação é uma classe isolada (Single Responsibility).

---

## DTOs

### `CreateTaskDto`

```ts
export class CreateTaskDto {
  @IsString() @IsNotEmpty() @MaxLength(120)
  title: string;

  @IsString() @IsOptional() @MaxLength(500)
  description?: string;

  @IsEnum(TaskStatus) @IsOptional()
  status?: TaskStatus;
}
```

Validado automaticamente pelo `ValidationPipe` global registrado no `main.ts` (`whitelist: true`, `transform: true`).

### `UpdateTaskDto`

Mesmas regras do `CreateTaskDto`, com **todos os campos opcionais** + um `position` numérico (`@IsInt() @Min(0)`).

### `TaskResponseDto`

```ts
export class TaskResponseDto {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  position: number;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(task: Task): TaskResponseDto { ... }
}
```

- Esconde detalhes internos da entidade.
- Tem o factory `fromEntity` — todo caso de uso devolve `TaskResponseDto.fromEntity(...)`.

---

## Casos de uso

Todos seguem o mesmo padrão:

```ts
@Injectable()
export class XxxUseCase {
  constructor(
    @Inject(TASK_REPOSITORY)
    private readonly taskRepository: TaskRepository,
  ) {}

  async execute(...): Promise<...> { ... }
}
```

### `CreateTaskUseCase`

1. Resolve o status (default `TODO`).
2. Pergunta ao repositório a maior `position` daquele status.
3. Cria com `position = max + 1` (vai sempre para o final da coluna).
4. Retorna `TaskResponseDto`.

### `ListTasksUseCase`

`findAll()` → mapeia para DTO. Sem filtros (o frontend agrupa em memória).

### `UpdateTaskUseCase`

1. `findById(id)`. Se não existir, lança `NotFoundException` com mensagem incluindo o `id`.
2. Repassa os campos (`title`, `description`, `status`, `position`) ao repositório.
3. Retorna `TaskResponseDto`.

### `DeleteTaskUseCase`

1. `findById(id)`. Se não existir, lança `NotFoundException`.
2. `delete(id)`. Retorna `void` (controller responde 204).

---

## Regras desta camada

- ✅ Pode importar de `domain/` (entidade + repositório).
- ✅ Pode usar `@nestjs/common` para DI (`@Injectable`, `@Inject`) e exceções HTTP semânticas (`NotFoundException`).
- ✅ Pode usar `class-validator` nos DTOs.
- ❌ **Não** pode importar de `infrastructure/` (Prisma) — depende da interface, não da implementação.
- ❌ **Não** pode importar de `presentation/`.
- ❌ **Não** conhece `Request` / `Response` do Express.

---

## Por que `NotFoundException` aqui (e não no controller)?

`NotFoundException` é uma exceção **semântica** (mapeia para 404), não acoplada a HTTP transport — o `HttpExceptionFilter` traduz para JSON. Isso mantém os casos de uso testáveis sem mock de Express e dá ao filtro o status correto sem código extra no controller.
