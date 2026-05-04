# Módulo `tasks`

Módulo principal da aplicação. Concentra **toda a lógica de negócio** de tarefas seguindo arquitetura hexagonal (ports & adapters).

---

## Composição (TasksModule)

```ts
@Module({
  controllers: [TasksController],
  providers: [
    { provide: TASK_REPOSITORY, useClass: PrismaTaskRepository },
    CreateTaskUseCase,
    ListTasksUseCase,
    UpdateTaskUseCase,
    DeleteTaskUseCase,
  ],
})
export class TasksModule {}
```

A injeção do adapter (`PrismaTaskRepository`) na interface (`TASK_REPOSITORY`) é o ponto de **inversão de dependência** do módulo.

---

## Estrutura

```
tasks/
├── domain/                 # Camada mais interna — sem deps de framework
│   ├── task.entity.ts
│   ├── task.repository.ts  # interface (port) + tipos auxiliares
│   └── task-status.enum.ts
├── application/            # Casos de uso + contratos de entrada/saída
│   ├── dto/
│   │   ├── create-task.dto.ts
│   │   ├── update-task.dto.ts
│   │   └── task-response.dto.ts
│   └── use-cases/
│       ├── create-task.use-case.ts
│       ├── list-tasks.use-case.ts
│       ├── update-task.use-case.ts
│       └── delete-task.use-case.ts
├── infrastructure/         # Adapter — única camada que conhece Prisma
│   └── prisma-task.repository.ts
├── presentation/           # Borda HTTP — apenas roteamento
│   └── tasks.controller.ts
└── tasks.module.ts
```

Cada subpasta tem seu próprio README detalhando responsabilidades.

---

## Regra de dependência

Setas indicam "depende de":

```
presentation ──▶ application ──▶ domain
                       ▲              ▲
                       │              │
              (DI no module)          │
                       │              │
                infrastructure ───────┘
```

- **`domain`** não depende de **nada** do projeto (nem do NestJS).
- **`application`** depende apenas de `domain`.
- **`infrastructure`** implementa contratos de `domain`.
- **`presentation`** orquestra `application` e devolve HTTP.

Se um arquivo em `domain/` importar de `infrastructure/`, é uma violação arquitetural.

---

## Fluxo típico (POST /api/tasks)

1. **`TasksController.create(dto)`** recebe o request, já com `dto` validado pelo `ValidationPipe`.
2. Chama **`CreateTaskUseCase.execute(dto)`**.
3. O caso de uso pergunta ao repositório a maior `position` para o status alvo (default `TODO`).
4. Cria a entidade via `repository.create(...)` com `position = max + 1`.
5. Mapeia o resultado para `TaskResponseDto` (esconde detalhes da entidade interna) e retorna.
6. O controller devolve 201 com o JSON.

---

## Por que essa estrutura?

- **Testabilidade**: casos de uso são testados injetando `jest.Mocked<TaskRepository>` — zero banco, zero NestJS.
- **Trocabilidade**: trocar Prisma por outro ORM (ou um repositório em memória) é uma única linha no module.
- **Coesão**: cada arquivo tem uma responsabilidade clara — é mais fácil encontrar onde mexer.
- **Evolução**: adicionar `MoveTaskUseCase` (com auditoria) significa criar um arquivo novo, não tocar nos existentes.
