import { PrismaClient, TaskStatus } from '@prisma/client';

const prisma = new PrismaClient();

const SEED_TASKS = [
  {
    title: 'Configurar ambiente de desenvolvimento',
    description: 'Instalar dependências, configurar ESLint e Prettier, criar scripts de start.',
    status: TaskStatus.DONE,
    position: 1,
  },
  {
    title: 'Modelar schema do banco de dados',
    description: 'Definir modelo Task no Prisma com status enum e campo de posição para ordenação.',
    status: TaskStatus.DONE,
    position: 2,
  },
  {
    title: 'Implementar endpoints REST',
    description: 'Criar CRUD completo: GET /tasks, POST /tasks, PATCH /tasks/:id, DELETE /tasks/:id.',
    status: TaskStatus.IN_PROGRESS,
    position: 1,
  },
  {
    title: 'Integrar TanStack Query no frontend',
    description: 'Substituir estado local por useQuery e useMutation com optimistic updates no Kanban.',
    status: TaskStatus.IN_PROGRESS,
    position: 2,
  },
  {
    title: 'Escrever testes unitários dos casos de uso',
    description: 'Cobrir CreateTask, ListTasks, UpdateTask e DeleteTask com mocks de repositório.',
    status: TaskStatus.TODO,
    position: 1,
  },
  {
    title: 'Documentar decisões técnicas no README',
    description: 'Descrever arquitetura, trade-offs, como rodar e como rodar os testes.',
    status: TaskStatus.TODO,
    position: 2,
  },
];

async function main() {
  console.log('🌱 Iniciando seed...');

  await prisma.task.deleteMany();

  for (const data of SEED_TASKS) {
    await prisma.task.create({ data });
  }

  console.log(`✅ ${SEED_TASKS.length} tarefas criadas com sucesso.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
