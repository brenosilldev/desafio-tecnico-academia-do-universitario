# Uso de IA no desenvolvimento

Esta página detalha como ferramentas de IA foram utilizadas durante a resolução do desafio, em quais momentos elas ajudaram, e mostra prompts reais que produziram resultados relevantes.

> O desafio incentiva (não exige) o uso documentado de IA. Esta documentação existe para ser transparente sobre **o que foi escrito por mim** vs **o que foi gerado/refinado por IA**, e para mostrar como o uso da ferramenta foi **dirigido por critérios técnicos**, não copy-paste.

---

## Ferramentas usadas

| Ferramenta                                  | Modelo(s)                                  | Onde foi usada                                   |
|---------------------------------------------|--------------------------------------------|--------------------------------------------------|
| **Cursor** (com Anthropic Claude)           | Claude Sonnet 4.6 / Claude Opus 4.7        | IDE — geração de código, refatorações, READMEs   |
| **Claude Code** (CLI)                       | Claude Sonnet 4.6                          | Sessões longas em terminal (testes, organização) |

Não foi usada IA generativa para textos do produto, design ou pixel art — apenas para código, testes e documentação.

---

## Como o uso foi conduzido

Adotei três regras simples para evitar "vibe coding":

1. **Decisão técnica primeiro, código depois.** Toda escolha de arquitetura (hexagonal, modal de confirmação, optimistic update) foi decidida antes de pedir código. A IA implementou; eu não pedi à IA "qual arquitetura usar".

2. **Revisão linha a linha.** Nada entrou no commit sem leitura. Testes foram a principal âncora — código gerado precisa passar nos testes que eu também conferi.

3. **Prompts curtos, contexto explícito.** Em vez de descrever o projeto inteiro, abria o arquivo relevante e pedia mudanças pontuais. Isso reduz alucinação e mantém o controle.

---

## Onde a IA ajudou

### 1. Scaffolding da arquitetura hexagonal
Validar a separação `domain / application / infrastructure / presentation` antes de criar os arquivos. A IA descreveu prós/contras de cada variante (Clean Architecture, hexagonal estrita, Onion) e ajudou a alinhar a nomenclatura.

### 2. Boilerplate repetitivo
- DTOs com decorators de `class-validator`
- Estrutura inicial dos casos de uso
- Mocks tipados de `TaskRepository` para testes unitários
- Configuração do `HttpExceptionFilter` (formato padronizado de erro)

### 3. Optimistic updates com TanStack Query
Acertar a sequência `onMutate → onError → onSettled` com `cancelQueries` e snapshot de rollback é fácil de errar. Pedi para a IA me mostrar o padrão canônico e adaptei para `useUpdateTask` e `useDeleteTask`.

### 4. Pirâmide de testes
Geração dos casos de teste unitários (entidade, casos de uso, DTOs, controller, filter), do teste de integração do `PrismaTaskRepository` (com `PrismaService` mockado) e do e2e via Supertest. Resultado final: **148 testes em 11 suítes**.

### 5. Reorganização da estrutura de testes
Os testes haviam sido criados como `__tests__/unit/`, `__tests__/integration/`, `__tests__/e2e/`. Com o projeto crescendo, pedi à IA para reorganizar **por módulo** (espelhando `src/`), atualizando os imports relativos e a configuração do Jest sem quebrar nada.

### 6. Documentação
Geração inicial dos READMEs por módulo (este arquivo incluído). Refinei conteúdo, removi alucinações e ajustei o que descrevia algo que o código real não fazia.

---

## Exemplos de prompts relevantes

### Prompt 1 — Modelagem do domínio

```
Estou modelando a entidade Task para um Kanban com NestJS seguindo arquitetura
hexagonal. A entidade vive na camada de domínio e não pode depender do Prisma.
Quais métodos de negócio fazem sentido colocar diretamente na entidade vs.
deixar nos casos de uso? O método `changeStatus` deveria validar a transição
de estado (ex: proibir DONE voltar para TODO)?
```

**O que ganhei:** discussão sobre Anemic vs Rich Domain Model. Decidi colocar `changeStatus`, `update` e `reposition` na entidade (com atualização de `updatedAt`), mas **não** validar transições — o desafio não pede e isso adicionaria complexidade desnecessária.

---

### Prompt 2 — TanStack Query com optimistic update

```
Tenho um Kanban em Next.js com TanStack Query. Quando o usuário muda
o status de uma tarefa via modal, quero que a coluna mude imediatamente
(optimistic update) e reverta se a API retornar erro. Me mostre como
implementar isso com useMutation, onMutate, onError e onSettled,
mantendo o cache consistente para a query key ['tasks'].
```

**O que ganhei:** o esqueleto de `useUpdateTask` com `cancelQueries`, snapshot e rollback. Adaptei tirando o type assertion desnecessário e ajustando o `setQueryData` para preservar o array completo de tasks.

---

### Prompt 3 — Estrutura de testes unitários

```
Tenho um caso de uso CreateTaskUseCase que depende de TaskRepository (interface).
Como escrevo testes unitários com Jest que injetam um repositório mock sem
precisar de banco de dados? Quero validar que o repositório foi chamado com os
dados corretos e que o caso de uso retorna o DTO mapeado corretamente.
```

**O que ganhei:** padrão `jest.Mocked<TaskRepository>` com `findMaxPositionByStatus`, `create`, etc. Reaproveitei esse padrão para os 4 casos de uso.

---

### Prompt 4 — Reorganização dos testes por módulo

```
Os testes do backend estão em __tests__/{unit,integration,e2e} mas eu quero
reorganizar por módulo, espelhando src/. Mova:
- __tests__/unit/use-cases/* → __tests__/tasks/application/use-cases/
- __tests__/unit/dto/* → __tests__/tasks/application/dto/
- __tests__/unit/domain/* → __tests__/tasks/domain/
- __tests__/integration/* → __tests__/tasks/infrastructure/
- __tests__/e2e/* → __tests__/tasks/e2e/
- __tests__/unit/filters/* → __tests__/common/filters/

Ajuste imports relativos e atualize jest.roots no package.json e o testRegex
do jest-e2e.json. Rode os testes pra garantir que tudo passa.
```

**O que ganhei:** a IA fez as 12 movimentações, recalculou os caminhos relativos (uma camada a mais ou a menos por arquivo) e atualizou as configurações. Os 148 testes continuaram passando sem nenhuma intervenção manual minha.

---

### Prompt 5 — HttpExceptionFilter padronizado

```
Quero um filtro global no NestJS que converta qualquer exceção em um JSON
com este formato:
  { statusCode, message, path, timestamp }
Tem que tratar HttpException (pegando getStatus() e getResponse()) e qualquer
outra coisa como 500. Mensagem padrão do 500 deve ser em português.
Loga o erro completo se for unhandled. Mostre o filter e como registrar
em main.ts.
```

**O que ganhei:** a implementação atual de `http-exception.filter.ts`, que cobri com testes garantindo o formato e o status para `NotFoundException`, `BadRequestException`, `UnprocessableEntityException`, exceções genéricas e exceções não-Error.

---

### Prompt 6 — Documentação por módulo

```
Para cada pasta significativa do projeto (backend/src/tasks/{domain,application,
infrastructure,presentation}, prisma, common, frontend/src/{app,components,hooks,
lib}), gere um README curto explicando:
- Responsabilidade da camada
- O que tem dentro
- Como se relaciona com as outras camadas
- O que NÃO deve entrar aqui
Use o código real como fonte da verdade — não invente arquivos.
```

**O que ganhei:** o esqueleto de cada README desta entrega. Revisei todos para remover claims que o código não suportava e adicionei exemplos vindos diretamente dos arquivos reais.

---

## O que NÃO foi feito por IA

- Decisão de usar arquitetura hexagonal vs MVC tradicional do NestJS.
- Decisão de drag-and-drop nativo vs `@dnd-kit`.
- Decisão de exigir comentário ao mover card.
- Modelagem do schema Prisma (campo `position`, enum nativo, `cuid`).
- Layout/CSS final do Kanban e do Dashboard (refinado manualmente sobre o Figma).
- Critério do que entra ou não no escopo do desafio (ex.: deixar `task_movements` de fora).

---

## Conclusão

O uso de IA acelerou principalmente **escrita de código repetitivo** (DTOs, mocks, boilerplate de testes) e **revisão de padrões conhecidos** (optimistic updates, exception filter). As decisões técnicas, modelagem e trade-offs foram conscientes — a IA executou, eu dirigi.
