# `tasks/presentation`

Camada de **borda HTTP**. Expõe a API REST e delega 100% para os casos de uso. Não contém lógica de negócio.

---

## `TasksController`

```ts
@Controller('tasks')                    // → /api/tasks (prefixo global em main.ts)
export class TasksController {
  constructor(
    private readonly createTask: CreateTaskUseCase,
    private readonly listTasks: ListTasksUseCase,
    private readonly updateTask: UpdateTaskUseCase,
    private readonly deleteTask: DeleteTaskUseCase,
  ) {}

  @Get()                                                    // 200
  findAll() { return this.listTasks.execute(); }

  @Post() @HttpCode(HttpStatus.CREATED)                     // 201
  create(@Body() dto: CreateTaskDto) { ... }

  @Patch(':id')                                             // 200
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) { ... }

  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT)           // 204
  remove(@Param('id') id: string) { ... }
}
```

### O que o controller faz

- Define rotas e métodos HTTP.
- Aplica `@HttpCode` para devolver os códigos corretos (`201`, `204`).
- Delega ao use case correspondente — uma linha por endpoint.

### O que o controller NÃO faz

- Não valida entrada (o `ValidationPipe` global cuida disso usando os decorators dos DTOs).
- Não trata exceções (o `HttpExceptionFilter` global formata o JSON de erro).
- Não toca em Prisma nem na entidade `Task` diretamente.
- Não monta `TaskResponseDto` — recebe-o pronto do use case.

---

## Tabela de rotas

| Método | Rota              | Body              | Status |
|--------|-------------------|-------------------|--------|
| GET    | `/api/tasks`      | —                 | 200    |
| POST   | `/api/tasks`      | `CreateTaskDto`   | 201    |
| PATCH  | `/api/tasks/:id`  | `UpdateTaskDto`   | 200    |
| DELETE | `/api/tasks/:id`  | —                 | 204    |

---

## Regras desta camada

- ✅ Pode importar dos casos de uso e dos DTOs em `application/`.
- ✅ Pode usar `@nestjs/common` (decorators de routing).
- ❌ **Não** importa de `infrastructure/` nem de `domain/` diretamente.
- ❌ **Não** lança `HttpException` manualmente (use cases já lançam as semânticas, p.ex. `NotFoundException`).

---

## Como evoluir

Adicionar um endpoint novo (ex.: `GET /tasks/:id`) seria:

1. Criar um `GetTaskUseCase` em `application/use-cases/`.
2. Registrá-lo no `TasksModule`.
3. Adicionar `@Get(':id') findOne(@Param('id') id: string) { return this.getTask.execute(id); }` no controller.

O controller não cresce em complexidade — apenas em linhas.
