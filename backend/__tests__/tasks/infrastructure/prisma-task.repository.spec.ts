import { PrismaTaskRepository } from '../../../src/tasks/infrastructure/prisma-task.repository';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { TaskStatus } from '../../../src/tasks/domain/task-status.enum';
import { Task } from '../../../src/tasks/domain/task.entity';

type PrismaTaskRecord = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
};

const makeRecord = (overrides: Partial<PrismaTaskRecord> = {}): PrismaTaskRecord => ({
  id: 'task-id',
  title: 'Tarefa Teste',
  description: null,
  status: 'TODO',
  position: 0,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  ...overrides,
});

describe('PrismaTaskRepository (integração)', () => {
  let repository: PrismaTaskRepository;
  let prismaService: { task: jest.Mocked<PrismaService['task']> };

  beforeEach(() => {
    prismaService = {
      task: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        aggregate: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      } as unknown as jest.Mocked<PrismaService['task']>,
    };
    repository = new PrismaTaskRepository(prismaService as unknown as PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── findAll ───────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('retorna array vazio quando não há registros', async () => {
      (prismaService.task.findMany as jest.Mock).mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });

    it('converte registros do Prisma em entidades Task', async () => {
      const records = [
        makeRecord({ id: '1', title: 'A', status: 'TODO' }),
        makeRecord({ id: '2', title: 'B', status: 'IN_PROGRESS' }),
      ];
      (prismaService.task.findMany as jest.Mock).mockResolvedValue(records);

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      result.forEach(r => expect(r).toBeInstanceOf(Task));
    });

    it('mapeia todos os campos do registro para a entidade', async () => {
      const date = new Date('2024-06-15T10:00:00Z');
      const record = makeRecord({
        id: 'xyz',
        title: 'Título Completo',
        description: 'Detalhe',
        status: 'DONE',
        position: 4,
        createdAt: date,
        updatedAt: date,
      });
      (prismaService.task.findMany as jest.Mock).mockResolvedValue([record]);

      const [task] = await repository.findAll();

      expect(task.id).toBe('xyz');
      expect(task.title).toBe('Título Completo');
      expect(task.description).toBe('Detalhe');
      expect(task.status).toBe(TaskStatus.DONE);
      expect(task.position).toBe(4);
      expect(task.createdAt).toEqual(date);
      expect(task.updatedAt).toEqual(date);
    });

    it('chama findMany com ordenação correta', async () => {
      (prismaService.task.findMany as jest.Mock).mockResolvedValue([]);

      await repository.findAll();

      expect(prismaService.task.findMany).toHaveBeenCalledWith({
        orderBy: [{ status: 'asc' }, { position: 'asc' }, { createdAt: 'asc' }],
      });
    });

    it('mapeia status IN_PROGRESS corretamente', async () => {
      (prismaService.task.findMany as jest.Mock).mockResolvedValue([makeRecord({ status: 'IN_PROGRESS' })]);

      const [task] = await repository.findAll();

      expect(task.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('mapeia description null corretamente', async () => {
      (prismaService.task.findMany as jest.Mock).mockResolvedValue([makeRecord({ description: null })]);

      const [task] = await repository.findAll();

      expect(task.description).toBeNull();
    });
  });

  // ─── findById ──────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('retorna entidade quando encontrada', async () => {
      (prismaService.task.findUnique as jest.Mock).mockResolvedValue(makeRecord({ id: 'task-id' }));

      const result = await repository.findById('task-id');

      expect(result).toBeInstanceOf(Task);
      expect(result?.id).toBe('task-id');
    });

    it('retorna null quando não encontrada', async () => {
      (prismaService.task.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById('inexistente');

      expect(result).toBeNull();
    });

    it('busca pelo id correto', async () => {
      (prismaService.task.findUnique as jest.Mock).mockResolvedValue(null);

      await repository.findById('meu-id-especifico');

      expect(prismaService.task.findUnique).toHaveBeenCalledWith({ where: { id: 'meu-id-especifico' } });
    });

    it('mapeia todos os campos do registro encontrado', async () => {
      const date = new Date('2024-06-01T12:00:00Z');
      const record = makeRecord({ id: '1', title: 'Tarefa', description: 'Desc', status: 'IN_PROGRESS', position: 2, createdAt: date, updatedAt: date });
      (prismaService.task.findUnique as jest.Mock).mockResolvedValue(record);

      const task = await repository.findById('1');

      expect(task?.title).toBe('Tarefa');
      expect(task?.description).toBe('Desc');
      expect(task?.status).toBe(TaskStatus.IN_PROGRESS);
      expect(task?.position).toBe(2);
    });
  });

  // ─── findMaxPositionByStatus ───────────────────────────────────────────────

  describe('findMaxPositionByStatus', () => {
    it('retorna a posição máxima encontrada', async () => {
      (prismaService.task.aggregate as jest.Mock).mockResolvedValue({ _max: { position: 7 } });

      const result = await repository.findMaxPositionByStatus(TaskStatus.TODO);

      expect(result).toBe(7);
    });

    it('retorna 0 quando não há tarefas com esse status', async () => {
      (prismaService.task.aggregate as jest.Mock).mockResolvedValue({ _max: { position: null } });

      const result = await repository.findMaxPositionByStatus(TaskStatus.DONE);

      expect(result).toBe(0);
    });

    it('filtra pelo status TODO corretamente', async () => {
      (prismaService.task.aggregate as jest.Mock).mockResolvedValue({ _max: { position: null } });

      await repository.findMaxPositionByStatus(TaskStatus.TODO);

      expect(prismaService.task.aggregate).toHaveBeenCalledWith({
        where: { status: 'TODO' },
        _max: { position: true },
      });
    });

    it('filtra pelo status IN_PROGRESS corretamente', async () => {
      (prismaService.task.aggregate as jest.Mock).mockResolvedValue({ _max: { position: null } });

      await repository.findMaxPositionByStatus(TaskStatus.IN_PROGRESS);

      expect(prismaService.task.aggregate).toHaveBeenCalledWith({
        where: { status: 'IN_PROGRESS' },
        _max: { position: true },
      });
    });

    it('retorna 0 quando posição máxima é 0', async () => {
      (prismaService.task.aggregate as jest.Mock).mockResolvedValue({ _max: { position: 0 } });

      const result = await repository.findMaxPositionByStatus(TaskStatus.TODO);

      expect(result).toBe(0);
    });
  });

  // ─── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('cria tarefa e retorna entidade Task', async () => {
      const record = makeRecord({ title: 'Nova Tarefa' });
      (prismaService.task.create as jest.Mock).mockResolvedValue(record);

      const result = await repository.create({ title: 'Nova Tarefa', status: TaskStatus.TODO, position: 1 });

      expect(result).toBeInstanceOf(Task);
      expect(result.title).toBe('Nova Tarefa');
    });

    it('usa status TODO por padrão', async () => {
      (prismaService.task.create as jest.Mock).mockResolvedValue(makeRecord());

      await repository.create({ title: 'Tarefa' });

      expect(prismaService.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ status: 'TODO' }),
      });
    });

    it('usa position 0 por padrão', async () => {
      (prismaService.task.create as jest.Mock).mockResolvedValue(makeRecord());

      await repository.create({ title: 'Tarefa' });

      expect(prismaService.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ position: 0 }),
      });
    });

    it('salva description fornecida', async () => {
      (prismaService.task.create as jest.Mock).mockResolvedValue(makeRecord({ description: 'Minha desc' }));

      await repository.create({ title: 'Tarefa', description: 'Minha desc' });

      expect(prismaService.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ description: 'Minha desc' }),
      });
    });

    it('salva description null quando não fornecida', async () => {
      (prismaService.task.create as jest.Mock).mockResolvedValue(makeRecord({ description: null }));

      await repository.create({ title: 'Tarefa', description: null });

      expect(prismaService.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ description: null }),
      });
    });

    it('salva o status correto quando fornecido', async () => {
      (prismaService.task.create as jest.Mock).mockResolvedValue(makeRecord({ status: 'IN_PROGRESS' }));

      await repository.create({ title: 'Tarefa', status: TaskStatus.IN_PROGRESS, position: 1 });

      expect(prismaService.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ status: 'IN_PROGRESS', position: 1 }),
      });
    });
  });

  // ─── update ────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('atualiza e retorna entidade Task', async () => {
      const record = makeRecord({ title: 'Atualizada' });
      (prismaService.task.update as jest.Mock).mockResolvedValue(record);

      const result = await repository.update('task-id', { title: 'Atualizada' });

      expect(result).toBeInstanceOf(Task);
    });

    it('envia somente o campo title quando apenas title é fornecido', async () => {
      (prismaService.task.update as jest.Mock).mockResolvedValue(makeRecord());

      await repository.update('task-id', { title: 'Novo Título' });

      const callData = (prismaService.task.update as jest.Mock).mock.calls[0][0].data;
      expect(callData).toEqual({ title: 'Novo Título' });
    });

    it('envia somente o campo status quando apenas status é fornecido', async () => {
      (prismaService.task.update as jest.Mock).mockResolvedValue(makeRecord({ status: 'DONE' }));

      await repository.update('task-id', { status: TaskStatus.DONE });

      const callData = (prismaService.task.update as jest.Mock).mock.calls[0][0].data;
      expect(callData).toEqual({ status: 'DONE' });
    });

    it('não inclui campos undefined no payload de update', async () => {
      (prismaService.task.update as jest.Mock).mockResolvedValue(makeRecord());

      await repository.update('task-id', { title: 'Novo' });

      const callData = (prismaService.task.update as jest.Mock).mock.calls[0][0].data;
      expect(Object.keys(callData)).toEqual(['title']);
    });

    it('atualiza todos os campos quando todos são fornecidos', async () => {
      (prismaService.task.update as jest.Mock).mockResolvedValue(makeRecord());

      await repository.update('task-id', {
        title: 'Título',
        description: 'Desc',
        status: TaskStatus.DONE,
        position: 5,
      });

      const callData = (prismaService.task.update as jest.Mock).mock.calls[0][0].data;
      expect(callData).toEqual({ title: 'Título', description: 'Desc', status: 'DONE', position: 5 });
    });

    it('atualiza pelo id correto', async () => {
      (prismaService.task.update as jest.Mock).mockResolvedValue(makeRecord());

      await repository.update('meu-id', { title: 'Título' });

      expect(prismaService.task.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'meu-id' } }),
      );
    });
  });

  // ─── delete ────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('deleta pelo id correto', async () => {
      (prismaService.task.delete as jest.Mock).mockResolvedValue({});

      await repository.delete('task-id');

      expect(prismaService.task.delete).toHaveBeenCalledWith({ where: { id: 'task-id' } });
    });

    it('retorna undefined após deleção', async () => {
      (prismaService.task.delete as jest.Mock).mockResolvedValue({});

      const result = await repository.delete('task-id');

      expect(result).toBeUndefined();
    });

    it('chama delete apenas uma vez', async () => {
      (prismaService.task.delete as jest.Mock).mockResolvedValue({});

      await repository.delete('task-id');

      expect(prismaService.task.delete).toHaveBeenCalledTimes(1);
    });
  });
});
