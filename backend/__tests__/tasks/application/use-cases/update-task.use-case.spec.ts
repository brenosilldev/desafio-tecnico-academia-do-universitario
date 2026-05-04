import { UpdateTaskUseCase } from '../../../../src/tasks/application/use-cases/update-task.use-case';
import { TaskRepository } from '../../../../src/tasks/domain/task.repository';
import { TaskStatus } from '../../../../src/tasks/domain/task-status.enum';
import { Task } from '../../../../src/tasks/domain/task.entity';
import { NotFoundException } from '@nestjs/common';

const mockRepo: jest.Mocked<TaskRepository> = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findMaxPositionByStatus: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const makeTask = (id = '1', overrides: Partial<{
  title: string; status: TaskStatus; position: number; description: string | null;
}> = {}): Task => {
  const base = { title: 'Tarefa Original', status: TaskStatus.TODO, position: 0, description: null, ...overrides };
  return new Task(id, base.title, base.description, base.status, base.position, new Date(), new Date());
};

describe('UpdateTaskUseCase', () => {
  let useCase: UpdateTaskUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new UpdateTaskUseCase(mockRepo);
  });

  it('atualiza título e status de uma tarefa existente', async () => {
    const existing = makeTask('1');
    const updated = makeTask('1', { title: 'Novo Título', status: TaskStatus.IN_PROGRESS });
    mockRepo.findById.mockResolvedValue(existing);
    mockRepo.update.mockResolvedValue(updated);

    const result = await useCase.execute('1', { title: 'Novo Título', status: TaskStatus.IN_PROGRESS });

    expect(mockRepo.findById).toHaveBeenCalledWith('1');
    expect(mockRepo.update).toHaveBeenCalledWith('1', {
      title: 'Novo Título',
      description: undefined,
      status: TaskStatus.IN_PROGRESS,
      position: undefined,
    });
    expect(result.title).toBe('Novo Título');
    expect(result.status).toBe(TaskStatus.IN_PROGRESS);
  });

  it('lança NotFoundException quando tarefa não existe', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('nao-existe', { title: 'X' })).rejects.toThrow(NotFoundException);
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('lança NotFoundException com mensagem contendo o id', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('id-invalido', {})).rejects.toThrow(
      'Tarefa com id "id-invalido" não encontrada',
    );
  });

  it('atualiza apenas o status sem alterar outros campos', async () => {
    const existing = makeTask('2', { status: TaskStatus.TODO });
    const updated = makeTask('2', { status: TaskStatus.DONE });
    mockRepo.findById.mockResolvedValue(existing);
    mockRepo.update.mockResolvedValue(updated);

    await useCase.execute('2', { status: TaskStatus.DONE });

    expect(mockRepo.update).toHaveBeenCalledWith('2', {
      title: undefined,
      description: undefined,
      status: TaskStatus.DONE,
      position: undefined,
    });
  });

  it('atualiza apenas a posição', async () => {
    const existing = makeTask('1');
    const updated = makeTask('1', { position: 5 });
    mockRepo.findById.mockResolvedValue(existing);
    mockRepo.update.mockResolvedValue(updated);

    const result = await useCase.execute('1', { position: 5 });

    expect(mockRepo.update).toHaveBeenCalledWith('1', expect.objectContaining({ position: 5 }));
    expect(result.position).toBe(5);
  });

  it('atualiza description', async () => {
    const existing = makeTask('1');
    const updated = makeTask('1', { description: 'Nova descrição' } as any);
    mockRepo.findById.mockResolvedValue(existing);
    mockRepo.update.mockResolvedValue(updated);

    await useCase.execute('1', { description: 'Nova descrição' });

    expect(mockRepo.update).toHaveBeenCalledWith('1', expect.objectContaining({ description: 'Nova descrição' }));
  });

  it('retorna DTO mapeado da entidade atualizada', async () => {
    const now = new Date('2024-06-01T10:00:00Z');
    const existing = makeTask('abc');
    const updated = new Task('abc', 'Título Atualizado', 'Desc', TaskStatus.DONE, 3, now, now);
    mockRepo.findById.mockResolvedValue(existing);
    mockRepo.update.mockResolvedValue(updated);

    const result = await useCase.execute('abc', { title: 'Título Atualizado', status: TaskStatus.DONE });

    expect(result.id).toBe('abc');
    expect(result.title).toBe('Título Atualizado');
    expect(result.status).toBe(TaskStatus.DONE);
    expect(result.position).toBe(3);
  });

  it('não chama update quando tarefa não é encontrada', async () => {
    mockRepo.findById.mockResolvedValue(null);

    try {
      await useCase.execute('qualquer-id', { title: 'X' });
    } catch {
      // esperado
    }

    expect(mockRepo.update).not.toHaveBeenCalled();
  });
});
