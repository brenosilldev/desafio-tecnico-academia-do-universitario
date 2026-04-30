# Desafio Técnico Full Stack — Academia do Universitário

Aplicação de **gestão de tarefas (To-Do)** com formulário de cadastro e quadro Kanban, desenvolvida como solução ao desafio técnico da [Academia do Universitário](https://www.academiadouniversitario.com.br/).

---

## Sumário

- [Visão geral](#visão-geral)
- [Stack utilizada](#stack-utilizada)
- [Como rodar](#como-rodar)
- [Como rodar os testes](#como-rodar-os-testes)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Decisões técnicas](#decisões-técnicas)
- [Uso de IA](#uso-de-ia)

---

## Visão geral

A aplicação permite:

- **Criar tarefas** via formulário com título, descrição e status inicial
- **Visualizar tarefas** em um quadro Kanban dividido por status (`A fazer`, `Em andamento`, `Concluído`)
- **Mover tarefas** entre colunas por ação equivalente a drag-and-drop (modal de mudança de status)
- **Acompanhar métricas** em uma tela de dashboard com gráficos de distribuição por status

---

## Stack utilizada

| Camada     | Tecnologia                                                          |
|------------|---------------------------------------------------------------------|
| Backend    | NestJS 11, Prisma ORM, PostgreSQL                                   |
| Frontend   | Next.js 16 (SPA), TanStack Query, Tailwind CSS 4, Framer Motion    |
| Validação  | class-validator (backend), Zod + React Hook Form (frontend)         |
| UI         | Radix UI, Lucide React, Recharts                                    |
| Testes     | Jest + Supertest (backend)                                          |
| Banco      | PostgreSQL via Docker                                               |

---

## Como rodar

### Pré-requisitos

- [Node.js](https://nodejs.org/) 20+
- [Docker](https://www.docker.com/) e Docker Compose

---

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/desafio-tecnico-academia-do-universitario.git
cd desafio-tecnico-academia-do-universitario
```

---

### 2. Subir o banco de dados

```bash
docker compose up -d
```

Isso sobe um container PostgreSQL na porta `5432`. O `docker-compose.yml` já define as variáveis de ambiente do banco.

---

### 3. Configurar o backend

```bash
cd backend
cp .env.example .env
```

Edite o `.env` se necessário (os valores padrão já funcionam com o Docker acima):

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/au_tasks"
PORT=3333
```

Instale as dependências, rode as migrations e o seed:

```bash
npm install
npx prisma migrate dev
npx prisma db seed
```

Inicie o servidor:

```bash
npm run start:dev
```

O backend estará disponível em `http://localhost:3333`.

> A documentação da API (Swagger) fica em `http://localhost:3333/api`.

---

### 4. Configurar o frontend

```bash
cd ../frontend
cp .env.example .env.local
```

Edite o `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3333
```

Instale as dependências e inicie:

```bash
npm install
npm run dev
```

O frontend estará disponível em `http://localhost:3000`.

---

## Como rodar os testes

### Testes unitários (backend)

```bash
cd backend
npm run test
```

### Cobertura de testes

```bash
cd backend
npm run test:cov
```

### Testes e2e (backend)

```bash
cd backend
npm run test:e2e
```

> Os testes e2e sobem uma instância de banco separada configurada no `jest-e2e.json`. Certifique-se que o Docker está rodando.

---

## Estrutura do projeto

```
desafio-tecnico-academia-do-universitario/
├── backend/
│   ├── src/
│   │   ├── domain/               # Entidades, interfaces de repositório, value objects
│   │   │   └── task/
│   │   ├── application/          # Casos de uso (use cases)
│   │   │   └── task/
│   │   ├── infrastructure/       # Prisma, implementações de repositório
│   │   │   ├── database/
│   │   │   └── repositories/
│   │   └── http/                 # Controllers, DTOs, pipes de validação
│   │       └── task/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── test/                     # Testes e2e
│
└── frontend/
    └── src/
        ├── app/
        │   └── (board)/
        │       ├── page.tsx           # Quadro Kanban
        │       ├── dashboard/         # Tela de métricas
        │       └── novo-card/         # Formulário de criação
        ├── components/
        │   ├── board/                 # BoardColumn, TaskCard, MoveTaskModal
        │   ├── dashboard/             # Gráficos e cards de estatísticas
        │   ├── forms/                 # CreateCardForm
        │   ├── layout/                # Header
        │   └── ui/                    # Badge, Button, Dialog (Radix-based)
        ├── hooks/                     # Hooks do TanStack Query (useTask, useTasks, etc.)
        ├── services/                  # Chamadas HTTP à API
        ├── types/                     # Tipos TypeScript compartilhados
        └── context/                   # Providers globais
```

---

## Decisões técnicas

### Backend — Arquitetura em camadas

O backend segue uma **arquitetura hexagonal (ports & adapters)** com separação clara entre:

- **Domain**: entidades puras (`Task`) e interfaces de repositório (`ITaskRepository`). Sem dependências externas.
- **Application**: casos de uso (`CreateTaskUseCase`, `UpdateTaskStatusUseCase`, etc.) que orquestram o domínio.
- **Infrastructure**: implementações concretas (repositório Prisma), configuração do banco.
- **HTTP**: controllers NestJS, DTOs com `class-validator`, pipes globais de validação.

Essa separação garante que a lógica de negócio não vaza para a camada HTTP e que os casos de uso são testáveis de forma isolada (injetando repositórios mock).

### Schema Prisma

O modelo `Task` foi desenhado para suportar os três status do Kanban (`TODO`, `IN_PROGRESS`, `DONE`) usando um enum Prisma, garantindo integridade no banco sem validação extra na aplicação.

### Frontend — TanStack Query

Toda comunicação com a API passa pelo TanStack Query:
- **`useQuery`** para listar e buscar tarefas (cache automático, re-fetch em foco)
- **`useMutation`** para criar/atualizar, com **optimistic update** na mudança de status do Kanban — a coluna da tarefa muda imediatamente sem esperar o servidor responder, com rollback automático em caso de erro.
- Invalidação de cache cirúrgica após mutations para manter a UI consistente.

### Next.js como SPA

O `next.config.ts` está configurado com `output: 'export'` para gerar um bundle estático, atendendo ao requisito de rodar como SPA sem server-side rendering.

### Gráficos

Dashboard com dois gráficos via **Recharts**:
- **Donut chart** — distribuição percentual de tarefas por status
- **Bar chart** — quantidade de tarefas por coluna

### Validação

- Backend: `class-validator` + `ValidationPipe` global com `whitelist: true` e `forbidNonWhitelisted: true`
- Frontend: Zod + React Hook Form com resolvers

### Trade-offs conscientes

| Decisão | Alternativa considerada | Motivo da escolha |
|---|---|---|
| Mudança de status via modal | Drag-and-drop nativo | Modal é mais acessível e mobile-friendly; DnD com `@dnd-kit` exigiria mais integração com TanStack Query |
| PostgreSQL via Docker | SQLite | PostgreSQL é mais próximo do ambiente de produção real |
| Seed de dados | Não ter seed | Facilita a avaliação sem precisar criar tarefas manualmente |

---

## Uso de IA

**Ferramentas utilizadas:** Claude Code (Anthropic), Claude Sonnet 4.6

### Como foi utilizado

A IA foi usada principalmente como **par de programação** para:

1. **Geração de boilerplate** repetitivo (DTOs, testes unitários, interfaces de repositório)
2. **Revisão de código** — pedir uma segunda opinião sobre a modelagem do domínio
3. **Debugging** — descrever o comportamento inesperado e discutir a causa raiz
4. **Estruturação da arquitetura** — validar se a separação de camadas fazia sentido antes de implementar

Todas as decisões arquiteturais e de modelagem foram tomadas conscientemente — a IA sugeriu, mas a escolha final (e o entendimento do porquê) foi minha.

### Exemplos de prompts relevantes

**Prompt 1 — Modelagem do domínio:**
```
Estou modelando a entidade Task para um Kanban com NestJS seguindo arquitetura hexagonal.
A entidade vive na camada de domínio e não pode depender do Prisma.
Quais métodos de negócio fazem sentido colocar diretamente na entidade
vs. deixar nos casos de uso? O método `changeStatus` deveria validar
a transição de estado (ex: proibir de DONE voltar para TODO)?
```

**Prompt 2 — TanStack Query com optimistic update:**
```
Tenho um Kanban em Next.js com TanStack Query. Quando o usuário muda
o status de uma tarefa via modal, quero que a coluna mude imediatamente
(optimistic update) e reverta se a API retornar erro. Me mostre como
implementar isso com useMutation, onMutate, onError e onSettled,
mantendo o cache consistente para a query key ['tasks'].
```

**Prompt 3 — Estrutura de testes:**
```
Tenho um caso de uso CreateTaskUseCase que depende de ITaskRepository.
Como escrevo um teste unitário com Jest que injeta um repositório mock
sem precisar de banco de dados? Quero validar que o repositório foi
chamado com os dados corretos e que o caso de uso retorna a entidade criada.
```
