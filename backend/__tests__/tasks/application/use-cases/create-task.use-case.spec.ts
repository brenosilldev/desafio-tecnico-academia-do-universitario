import { CreateTaskUseCase } from '../../../../src/tasks/application/use-cases/create-task.use-case';
import { TaskRepository } from '../../../../src/tasks/domain/task.repository';
import { TaskStatus } from '../../../../src/tasks/domain/task-status.enum';
import { Task } from '../../../../src/tasks/domain/task.entity';

const mockRepo: jest.Mocked<TaskRepository> = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findMaxPositionByStatus: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const makeTask = (overrides: Partial<{
  id: string; title: string; description: string | null;
  status: TaskStatus; position: number;
}> = {}): Task => {
  const base = { id: 'task-1', title: 'Tarefa', description: null, status: TaskStatus.TODO, position: 1, ...overrides };
  return new Task(base.id, base.title, base.description, base.status, base.position, new Date(), new Date());
};

describe('CreateTaskUseCase', () => {
  let useCase: CreateTaskUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateTaskUseCase(mockRepo);
  });

  it('cria tarefa com status TODO por padrão', async () => {
    mockRepo.findMaxPositionByStatus.mockResolvedValue(0);
    mockRepo.create.mockResolvedValue(makeTask());

    const result = await useCase.execute({ title: 'Tarefa' });

    expect(mockRepo.findMaxPositionByStatus).toHaveBeenCalledWith(TaskStatus.TODO);
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: TaskStatus.TODO }),
    );
    expect(result.status).toBe(TaskStatus.TODO);
  });

  it('cria tarefa com status IN_PROGRESS quando especificado', async () => {
    const task = makeTask({ status: TaskStatus.IN_PROGRESS });
    mockRepo.findMaxPositionByStatus.mockResolvedValue(0);
    mockRepo.create.mockResolvedValue(task);

    await useCase.execute({ title: 'Tarefa', status: TaskStatus.IN_PROGRESS });

    expect(mockRepo.findMaxPositionByStatus).toHaveBeenCalledWith(TaskStatus.IN_PROGRESS);
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: TaskStatus.IN_PROGRESS }),
    );
  });

  it('cria tarefa com status DONE quando especificado', async () => {
    const task = makeTask({ status: TaskStatus.DONE });
    mockRepo.findMaxPositionByStatus.mockResolvedValue(2);
    mockRepo.create.mockResolvedValue(task);

    await useCase.execute({ title: 'Tarefa', status: TaskStatus.DONE });

    expect(mockRepo.findMaxPositionByStatus).toHaveBeenCalledWith(TaskStatus.DONE);
  });

  it('posiciona a tarefa em maxPosition + 1', async () => {
    mockRepo.findMaxPositionByStatus.mockResolvedValue(4);
    mockRepo.create.mockResolvedValue(makeTask({ position: 5 }));

    await useCase.execute({ title: 'Tarefa' });

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ position: 5 }),
    );
  });

  it('posiciona em 1 quando não há tarefas (maxPosition = 0)', async () => {
    mockRepo.findMaxPositionByStatus.mockResolvedValue(0);
    mockRepo.create.mockResolvedValue(makeTask({ position: 1 }));

    await useCase.execute({ title: 'Tarefa' });

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ position: 1 }),
    );
  });

  it('salva description quando fornecida', async () => {
    const task = makeTask({ description: 'Detalhes importantes' });
    mockRepo.findMaxPositionByStatus.mockResolvedValue(0);
    mockRepo.create.mockResolvedValue(task);

    await useCase.execute({ title: 'Tarefa', description: 'Detalhes importantes' });

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'Detalhes importantes' }),
    );
  });

  it('salva description como null quando não fornecida', async () => {
    mockRepo.findMaxPositionByStatus.mockResolvedValue(0);
    mockRepo.create.mockResolvedValue(makeTask());

    await useCase.execute({ title: 'Tarefa' });

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ description: null }),
    );
  });

  it('retorna DTO mapeado da entidade criada', async () => {
    const now = new Date('2024-06-01T10:00:00Z');
    const task = new Task('abc-123', 'Minha Tarefa', 'Detalhe', TaskStatus.TODO, 2, now, now);
    mockRepo.findMaxPositionByStatus.mockResolvedValue(1);
    mockRepo.create.mockResolvedValue(task);

    const result = await useCase.execute({ title: 'Minha Tarefa', description: 'Detalhe' });

    expect(result.id).toBe('abc-123');
    expect(result.title).toBe('Minha Tarefa');
    expect(result.description).toBe('Detalhe');
    expect(result.position).toBe(2);
    expect(result.createdAt).toEqual(now);
  });

  it('chama findMaxPositionByStatus antes de criar', async () => {
    const callOrder: string[] = [];
    mockRepo.findMaxPositionByStatus.mockImplementation(async () => {
      callOrder.push('findMax');
      return 0;
    });
    mockRepo.create.mockImplementation(async () => {
      callOrder.push('create');
      return makeTask();
    });

    await useCase.execute({ title: 'Tarefa' });

    expect(callOrder).toEqual(['findMax', 'create']);
  });
});
