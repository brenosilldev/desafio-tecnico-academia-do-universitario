# Testes do backend

**11 suítes / 148 testes passando.** Cobertura organizada como uma pirâmide, com a base ampla de testes unitários, uma camada de integração para o adapter Prisma e um topo enxuto de testes e2e validando a API HTTP completa.

---

## Como rodar

```bash
cd backend

npm test                  # tudo
npm run test:unit         # base (domain + application + presentation + common)
npm run test:integration  # adapter PrismaTaskRepository
npm run test:e2e          # API HTTP completa via Supertest
npm run test:cov          # qualquer coisa + cobertura em coverage/
npm run test:watch        # watch mode
```

Nenhum teste depende de banco real — todos os efeitos colaterais são mockados (interface mockada nos unitários, `PrismaService` mockado na integração e e2e).

---

## Pirâmide de testes

```
              ┌──────────┐
              │   e2e    │  1 suíte ─ HTTP completo via Supertest
              │  (slow)  │
              └────┬─────┘
                   │
            ┌──────┴───────┐
            │ Integração   │  1 suíte ─ adapter Prisma + PrismaService mockado
            │   (médio)    │
            └──────┬───────┘
                   │
        ┌──────────┴──────────┐
        │     Unitários        │  9 suítes ─ domain, use cases, DTOs, controller, filter
        │       (fast)         │
        └─────────────────────┘
```

| Nível         | Suítes | O que valida                                                         | Velocidade |
|---------------|:-----:|----------------------------------------------------------------------|:----------:|
| Unitários     | 9     | Comportamento isolado: entidade, casos de uso, DTOs, controller, filtro | ⚡        |
| Integração    | 1     | Adapter `PrismaTaskRepository` contra um `PrismaService` mockado     | ⚡⚡       |
| E2E           | 1     | Fluxo completo HTTP → `ValidationPipe` → controller → use case → repo → filter | ⚡⚡⚡    |

---

## Estrutura

A pasta `__tests__/` espelha `src/`, organizada **por módulo** (não por tipo de teste). Isso facilita encontrar o teste de um arquivo específico e mantém testes próximos da camada que cobrem.

```
__tests__/
├── tasks/
│   ├── domain/
│   │   └── task.entity.spec.ts                  # 18 specs
│   ├── application/
│   │   ├── dto/
│   │   │   ├── create-task.dto.spec.ts          # validações class-validator
│   │   │   ├── update-task.dto.spec.ts
│   │   │   └── task-response.dto.spec.ts        # fromEntity()
│   │   └── use-cases/
│   │       ├── create-task.use-case.spec.ts
│   │       ├── list-tasks.use-case.spec.ts
│   │       ├── update-task.use-case.spec.ts
│   │       └── delete-task.use-case.spec.ts
│   ├── presentation/
│   │   └── tasks.controller.spec.ts             # delegação aos use cases
│   ├── infrastructure/
│   │   └── prisma-task.repository.spec.ts       # integração — 30 specs
│   └── e2e/
│       └── tasks.e2e-spec.ts                    # API HTTP completa
└── common/
    └── filters/
        └── http-exception.filter.spec.ts        # formato padronizado de erro
```

---

## Configuração do Jest

### Config principal (`backend/package.json` → `"jest"`)

```jsonc
{
  "rootDir": ".",
  "roots": ["<rootDir>/src", "<rootDir>/__tests__"],
  "testRegex": ".*\\.spec\\.ts$",        // pega tanto *.spec.ts quanto *.e2e-spec.ts
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "moduleNameMapper": {
    "generated/prisma": "<rootDir>/__mocks__/prisma-client"   // evita carregar o cliente real do Prisma
  },
  "testEnvironment": "node",
  "testPathIgnorePatterns": ["/node_modules/", "/dist/"]
}
```

### Config dedicada para e2e (`backend/test/jest-e2e.json`)

Permite rodar **apenas** o e2e (mais lento) com `npm run test:e2e`:

```jsonc
{
  "rootDir": "..",
  "testRegex": "__tests__/tasks/e2e/.*spec\\.ts$",
  "moduleNameMapper": { "generated/prisma": "<rootDir>/__mocks__/prisma-client" }
}
```

### Mock do `generated/prisma`

`backend/__mocks__/prisma-client/` substitui o cliente Prisma gerado em runtime. Assim os testes não precisam de:

- Banco PostgreSQL rodando.
- `prisma generate` previamente executado.
- Variáveis de ambiente.

Os adapters/services injetam o `PrismaService` real, mas o cliente subjacente é o mock do `__mocks__`.

---

## O que cada nível cobre

### Unitários — `tasks/domain`

`task.entity.spec.ts` (18 specs):
- Construtor atribui todos os campos.
- `id` e `createdAt` permanecem mesmo após mutações.
- `changeStatus` / `update` / `reposition` atualizam `updatedAt` e não mexem nos outros campos.

### Unitários — `tasks/application/dto`

Validam que os decorators de `class-validator` produzem os erros certos:
- `CreateTaskDto`: title obrigatório, max 120, status enum válido.
- `UpdateTaskDto`: tudo opcional, position `>= 0`, integer.
- `TaskResponseDto.fromEntity` mapeia 1-para-1.

### Unitários — `tasks/application/use-cases`

Mockam `TaskRepository` com `jest.Mocked<TaskRepository>`:

```ts
const mockRepo: jest.Mocked<TaskRepository> = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findMaxPositionByStatus: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};
```

Validam:
- Caminhos felizes (cria/lista/atualiza/deleta).
- `NotFoundException` para `id` inexistente em `Update` e `Delete`.
- Posicionamento correto (`maxPosition + 1`) ao criar.
- Ordem de chamadas (ex.: `findMaxPositionByStatus` antes de `create`).
- Mapeamento da entidade para `TaskResponseDto`.

### Unitários — `tasks/presentation`

`tasks.controller.spec.ts` (13 specs):
- Cada endpoint chama o use case correto com os parâmetros recebidos.
- Propaga exceções (`NotFoundException`, errors genéricos) sem encapsular.
- Não chama outros use cases além do necessário.

### Unitários — `common/filters`

`http-exception.filter.spec.ts` (12 specs):
- `NotFoundException` → 404. `BadRequestException` → 400. `UnprocessableEntityException` → 422.
- Mensagem string vs. `string[]` (do `ValidationPipe`).
- Erros não-HTTP → 500 com mensagem padrão em português.
- Sempre inclui `path` e `timestamp` ISO no payload.

### Integração — `tasks/infrastructure`

`prisma-task.repository.spec.ts` (30 specs):
- `PrismaTaskRepository` é instanciado com um `PrismaService` mockado por `jest.fn()`.
- Validam o **payload exato** que o adapter envia ao Prisma (não inclui `undefined`, ordena por `[status, position, createdAt]`, agrega `_max.position`, etc.).
- Validam o mapeamento do registro do Prisma para a entidade `Task`.

### E2E — `tasks/e2e`

`tasks.e2e-spec.ts` (25 specs):

```ts
const moduleFixture = await Test.createTestingModule({
  controllers: [TasksController],
  providers: [
    CreateTaskUseCase, ListTasksUseCase, UpdateTaskUseCase, DeleteTaskUseCase,
    { provide: TASK_REPOSITORY, useClass: PrismaTaskRepository },
    { provide: PrismaService, useValue: mockPrisma },
  ],
}).compile();

app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
app.useGlobalFilters(new HttpExceptionFilter());
app.setGlobalPrefix('api');
```

Cobrem o **fluxo completo** (HTTP → Pipe → Controller → UseCase → Repo → Filter → JSON):

- `GET /api/tasks` → 200 com array.
- `POST /api/tasks` → 201 / 400 (title vazio, > 120, status inválido, description > 500).
- `PATCH /api/tasks/:id` → 200 / 404 (com mensagem contendo o id) / 400 (position negativa, status inválido).
- `DELETE /api/tasks/:id` → 204 / 404.
- Estrutura de erro padronizada (`statusCode`, `message`, `path`, `timestamp`) em todos os erros.
- Fluxo de mudança de status (`POST` + `PATCH` em sequência).

---

## Convenções de teste

- **Português nos `it/describe`** — alinhado com a comunicação do produto e mensagens de erro.
- **Factories pequenas** — `makeTask`, `makeRecord`, `makeDto` no topo do arquivo, com `Partial<Overrides>` para customizar.
- **Sem `beforeAll` global** — exceto no e2e (criar o `app` uma vez) e no controller spec (criar o controller). `beforeEach` para limpar mocks.
- **Asserts focados** — cada `it` valida uma coisa. Nada de "smoke test" gigante.

---

## Onde adicionar novos testes

| Mudou um arquivo em…                      | Adicione testes em…                                |
|-------------------------------------------|----------------------------------------------------|
| `src/tasks/domain/`                       | `__tests__/tasks/domain/`                          |
| `src/tasks/application/use-cases/`        | `__tests__/tasks/application/use-cases/`           |
| `src/tasks/application/dto/`              | `__tests__/tasks/application/dto/`                 |
| `src/tasks/infrastructure/`               | `__tests__/tasks/infrastructure/`                  |
| `src/tasks/presentation/`                 | `__tests__/tasks/presentation/`                    |
| `src/common/filters/`                     | `__tests__/common/filters/`                        |
| Mudou um endpoint REST                    | Atualize também `__tests__/tasks/e2e/`             |
