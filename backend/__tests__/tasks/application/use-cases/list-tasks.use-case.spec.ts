import { ListTasksUseCase } from '../../../../src/tasks/application/use-cases/list-tasks.use-case';
import { TaskRepository } from '../../../../src/tasks/domain/task.repository';
import { TaskStatus } from '../../../../src/tasks/domain/task-status.enum';
import { Task } from '../../../../src/tasks/domain/task.entity';
import { TaskResponseDto } from '../../../../src/tasks/application/dto/task-response.dto';

const mockRepo: jest.Mocked<TaskRepository> = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findMaxPositionByStatus: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('ListTasksUseCase', () => {
  let useCase: ListTasksUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ListTasksUseCase(mockRepo);
  });

  it('retorna array vazio quando não há tarefas', async () => {
    mockRepo.findAll.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual([]);
    expect(mockRepo.findAll).toHaveBeenCalledTimes(1);
  });

  it('retorna todas as tarefas como DTOs', async () => {
    const tasks = [
      new Task('1', 'Tarefa A', null, TaskStatus.TODO, 0, new Date(), new Date()),
      new Task('2', 'Tarefa B', 'Desc', TaskStatus.IN_PROGRESS, 1, new Date(), new Date()),
      new Task('3', 'Tarefa C', null, TaskStatus.DONE, 2, new Date(), new Date()),
    ];
    mockRepo.findAll.mockResolvedValue(tasks);

    const result = await useCase.execute();

    expect(result).toHaveLength(3);
    expect(result[0].title).toBe('Tarefa A');
    expect(result[1].title).toBe('Tarefa B');
    expect(result[2].title).toBe('Tarefa C');
  });

  it('retorna instâncias de TaskResponseDto', async () => {
    const task = new Task('1', 'Tarefa', null, TaskStatus.TODO, 0, new Date(), new Date());
    mockRepo.findAll.mockResolvedValue([task]);

    const result = await useCase.execute();

    expect(result[0]).toBeInstanceOf(TaskResponseDto);
  });

  it('mapeia todos os campos corretamente para o DTO', async () => {
    const now = new Date('2024-03-15T09:00:00Z');
    const task = new Task('xyz', 'Minha Tarefa', 'Detalhes', TaskStatus.DONE, 3, now, now);
    mockRepo.findAll.mockResolvedValue([task]);

    const result = await useCase.execute();

    expect(result[0].id).toBe('xyz');
    expect(result[0].title).toBe('Minha Tarefa');
    expect(result[0].description).toBe('Detalhes');
    expect(result[0].status).toBe(TaskStatus.DONE);
    expect(result[0].position).toBe(3);
    expect(result[0].createdAt).toEqual(now);
    expect(result[0].updatedAt).toEqual(now);
  });

  it('mapeia description null corretamente', async () => {
    const task = new Task('1', 'Tarefa', null, TaskStatus.TODO, 0, new Date(), new Date());
    mockRepo.findAll.mockResolvedValue([task]);

    const result = await useCase.execute();

    expect(result[0].description).toBeNull();
  });

  it('preserva a ordem retornada pelo repositório', async () => {
    const tasks = [
      new Task('3', 'C', null, TaskStatus.DONE, 0, new Date(), new Date()),
      new Task('1', 'A', null, TaskStatus.TODO, 0, new Date(), new Date()),
      new Task('2', 'B', null, TaskStatus.IN_PROGRESS, 0, new Date(), new Date()),
    ];
    mockRepo.findAll.mockResolvedValue(tasks);

    const result = await useCase.execute();

    expect(result.map(r => r.id)).toEqual(['3', '1', '2']);
  });

  it('chama findAll apenas uma vez', async () => {
    mockRepo.findAll.mockResolvedValue([]);

    await useCase.execute();

    expect(mockRepo.findAll).toHaveBeenCalledTimes(1);
  });
});
