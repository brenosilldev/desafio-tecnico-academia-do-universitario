import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TasksController } from '../../../src/tasks/presentation/tasks.controller';
import { CreateTaskUseCase } from '../../../src/tasks/application/use-cases/create-task.use-case';
import { ListTasksUseCase } from '../../../src/tasks/application/use-cases/list-tasks.use-case';
import { UpdateTaskUseCase } from '../../../src/tasks/application/use-cases/update-task.use-case';
import { DeleteTaskUseCase } from '../../../src/tasks/application/use-cases/delete-task.use-case';
import { PrismaTaskRepository } from '../../../src/tasks/infrastructure/prisma-task.repository';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { TASK_REPOSITORY } from '../../../src/tasks/domain/task.repository';
import { HttpExceptionFilter } from '../../../src/common/filters/http-exception.filter';
import { TaskStatus } from '../../../src/tasks/domain/task-status.enum';

const mockPrisma = {
  task: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    aggregate: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

type PrismaRecord = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
};

const makeRecord = (overrides: Partial<PrismaRecord> = {}): PrismaRecord => ({
  id: 'task-id-1',
  title: 'Tarefa Teste',
  description: null,
  status: 'TODO',
  position: 0,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  ...overrides,
});

describe('Tasks API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        CreateTaskUseCase,
        ListTasksUseCase,
        UpdateTaskUseCase,
        DeleteTaskUseCase,
        { provide: TASK_REPOSITORY, useClass: PrismaTaskRepository },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── GET /api/tasks ────────────────────────────────────────────────────────

  describe('GET /api/tasks', () => {
    it('retorna 200 com array vazio quando não há tarefas', async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get('/api/tasks');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('retorna 200 com lista de tarefas', async () => {
      const records = [
        makeRecord({ id: '1', title: 'Tarefa A', status: 'TODO', position: 0 }),
        makeRecord({ id: '2', title: 'Tarefa B', status: 'IN_PROGRESS', position: 1 }),
      ];
      mockPrisma.task.findMany.mockResolvedValue(records);

      const res = await request(app.getHttpServer()).get('/api/tasks');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].title).toBe('Tarefa A');
      expect(res.body[1].title).toBe('Tarefa B');
    });

    it('retorna campos corretos no body', async () => {
      const date = new Date('2024-06-01T12:00:00Z');
      mockPrisma.task.findMany.mockResolvedValue([
        makeRecord({ id: 'abc', title: 'Minha Tarefa', description: 'Desc', status: 'DONE', position: 2, createdAt: date, updatedAt: date }),
      ]);

      const res = await request(app.getHttpServer()).get('/api/tasks');

      const task = res.body[0];
      expect(task.id).toBe('abc');
      expect(task.title).toBe('Minha Tarefa');
      expect(task.description).toBe('Desc');
      expect(task.status).toBe('DONE');
      expect(task.position).toBe(2);
      expect(task.createdAt).toBe(date.toISOString());
    });
  });

  // ─── POST /api/tasks ───────────────────────────────────────────────────────

  describe('POST /api/tasks', () => {
    it('retorna 201 com tarefa criada', async () => {
      mockPrisma.task.aggregate.mockResolvedValue({ _max: { position: 0 } });
      mockPrisma.task.create.mockResolvedValue(makeRecord({ title: 'Nova Tarefa', status: 'TODO', position: 1 }));

      const res = await request(app.getHttpServer())
        .post('/api/tasks')
        .send({ title: 'Nova Tarefa' });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Nova Tarefa');
      expect(res.body.status).toBe('TODO');
    });

    it('retorna 201 com status personalizado', async () => {
      mockPrisma.task.aggregate.mockResolvedValue({ _max: { position: 0 } });
      mockPrisma.task.create.mockResolvedValue(makeRecord({ status: 'IN_PROGRESS', position: 1 }));

      const res = await request(app.getHttpServer())
        .post('/api/tasks')
        .send({ title: 'Tarefa', status: 'IN_PROGRESS' });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('IN_PROGRESS');
    });

    it('retorna 201 com description', async () => {
      mockPrisma.task.aggregate.mockResolvedValue({ _max: { position: 0 } });
      mockPrisma.task.create.mockResolvedValue(makeRecord({ description: 'Detalhes' }));

      const res = await request(app.getHttpServer())
        .post('/api/tasks')
        .send({ title: 'Tarefa', description: 'Detalhes' });

      expect(res.status).toBe(201);
      expect(res.body.description).toBe('Detalhes');
    });

    it('retorna 400 quando title não é fornecido', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/tasks')
        .send({});

      expect(res.status).toBe(400);
    });

    it('retorna 400 quando title está vazio', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/tasks')
        .send({ title: '' });

      expect(res.status).toBe(400);
    });

    it('retorna 400 quando title excede 120 caracteres', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/tasks')
        .send({ title: 'a'.repeat(121) });

      expect(res.status).toBe(400);
    });

    it('retorna 400 para status inválido', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/tasks')
        .send({ title: 'Tarefa', status: 'INVALIDO' });

      expect(res.status).toBe(400);
    });

    it('retorna 400 quando description excede 500 caracteres', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/tasks')
        .send({ title: 'Tarefa', description: 'a'.repeat(501) });

      expect(res.status).toBe(400);
    });

    it('resposta de erro contém statusCode, message, path e timestamp', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/tasks')
        .send({});

      expect(res.body).toHaveProperty('statusCode', 400);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('path');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  // ─── PATCH /api/tasks/:id ─────────────────────────────────────────────────

  describe('PATCH /api/tasks/:id', () => {
    it('retorna 200 com tarefa atualizada', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(makeRecord({ id: 'task-1' }));
      mockPrisma.task.update.mockResolvedValue(makeRecord({ id: 'task-1', title: 'Atualizada', status: 'DONE' }));

      const res = await request(app.getHttpServer())
        .patch('/api/tasks/task-1')
        .send({ title: 'Atualizada', status: 'DONE' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Atualizada');
      expect(res.body.status).toBe('DONE');
    });

    it('retorna 404 quando tarefa não existe', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .patch('/api/tasks/nao-existe')
        .send({ title: 'X' });

      expect(res.status).toBe(404);
    });

    it('retorna 404 com mensagem descritiva', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .patch('/api/tasks/id-inexistente')
        .send({ title: 'X' });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('id-inexistente');
    });

    it('retorna 400 para status inválido', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/tasks/task-1')
        .send({ status: 'INVALIDO' });

      expect(res.status).toBe(400);
    });

    it('aceita body vazio (todos os campos são opcionais)', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(makeRecord({ id: 'task-1' }));
      mockPrisma.task.update.mockResolvedValue(makeRecord({ id: 'task-1' }));

      const res = await request(app.getHttpServer())
        .patch('/api/tasks/task-1')
        .send({});

      expect(res.status).toBe(200);
    });

    it('atualiza apenas position', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(makeRecord({ id: 'task-1' }));
      mockPrisma.task.update.mockResolvedValue(makeRecord({ id: 'task-1', position: 3 }));

      const res = await request(app.getHttpServer())
        .patch('/api/tasks/task-1')
        .send({ position: 3 });

      expect(res.status).toBe(200);
      expect(res.body.position).toBe(3);
    });

    it('retorna 400 para position negativa', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/tasks/task-1')
        .send({ position: -1 });

      expect(res.status).toBe(400);
    });
  });

  // ─── DELETE /api/tasks/:id ────────────────────────────────────────────────

  describe('DELETE /api/tasks/:id', () => {
    it('retorna 204 ao deletar tarefa existente', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(makeRecord({ id: 'task-1' }));
      mockPrisma.task.delete.mockResolvedValue({});

      const res = await request(app.getHttpServer()).delete('/api/tasks/task-1');

      expect(res.status).toBe(204);
      expect(res.body).toEqual({});
    });

    it('retorna 404 quando tarefa não existe', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null);

      const res = await request(app.getHttpServer()).delete('/api/tasks/nao-existe');

      expect(res.status).toBe(404);
    });

    it('retorna 404 com mensagem contendo o id', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null);

      const res = await request(app.getHttpServer()).delete('/api/tasks/id-inexistente');

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('id-inexistente');
    });

    it('chama delete com o id correto', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(makeRecord({ id: 'meu-id' }));
      mockPrisma.task.delete.mockResolvedValue({});

      await request(app.getHttpServer()).delete('/api/tasks/meu-id');

      expect(mockPrisma.task.delete).toHaveBeenCalledWith({ where: { id: 'meu-id' } });
    });

    it('resposta 404 contém estrutura de erro padronizada', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null);

      const res = await request(app.getHttpServer()).delete('/api/tasks/x');

      expect(res.body).toHaveProperty('statusCode', 404);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('path');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  // ─── Cenários de Status ───────────────────────────────────────────────────

  describe('Fluxo de mudança de status', () => {
    it('cria tarefa TODO e muda para IN_PROGRESS', async () => {
      const record = makeRecord({ id: 'flow-1', status: 'TODO', position: 1 });
      mockPrisma.task.aggregate.mockResolvedValue({ _max: { position: 0 } });
      mockPrisma.task.create.mockResolvedValue(record);

      const createRes = await request(app.getHttpServer())
        .post('/api/tasks')
        .send({ title: 'Fluxo' });

      expect(createRes.status).toBe(201);
      expect(createRes.body.status).toBe(TaskStatus.TODO);

      const updatedRecord = makeRecord({ id: 'flow-1', status: 'IN_PROGRESS' });
      mockPrisma.task.findUnique.mockResolvedValue(record);
      mockPrisma.task.update.mockResolvedValue(updatedRecord);

      const updateRes = await request(app.getHttpServer())
        .patch('/api/tasks/flow-1')
        .send({ status: TaskStatus.IN_PROGRESS });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.status).toBe(TaskStatus.IN_PROGRESS);
    });
  });
});
