"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const SEED_TASKS = [
    {
        title: 'Configurar ambiente de desenvolvimento',
        description: 'Instalar dependências, configurar ESLint e Prettier, criar scripts de start.',
        status: client_1.TaskStatus.DONE,
        position: 1,
    },
    {
        title: 'Modelar schema do banco de dados',
        description: 'Definir modelo Task no Prisma com status enum e campo de posição para ordenação.',
        status: client_1.TaskStatus.DONE,
        position: 2,
    },
    {
        title: 'Implementar endpoints REST',
        description: 'Criar CRUD completo: GET /tasks, POST /tasks, PATCH /tasks/:id, DELETE /tasks/:id.',
        status: client_1.TaskStatus.IN_PROGRESS,
        position: 1,
    },
    {
        title: 'Integrar TanStack Query no frontend',
        description: 'Substituir estado local por useQuery e useMutation com optimistic updates no Kanban.',
        status: client_1.TaskStatus.IN_PROGRESS,
        position: 2,
    },
    {
        title: 'Escrever testes unitários dos casos de uso',
        description: 'Cobrir CreateTask, ListTasks, UpdateTask e DeleteTask com mocks de repositório.',
        status: client_1.TaskStatus.TODO,
        position: 1,
    },
    {
        title: 'Documentar decisões técnicas no README',
        description: 'Descrever arquitetura, trade-offs, como rodar e como rodar os testes.',
        status: client_1.TaskStatus.TODO,
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
//# sourceMappingURL=seed.js.map