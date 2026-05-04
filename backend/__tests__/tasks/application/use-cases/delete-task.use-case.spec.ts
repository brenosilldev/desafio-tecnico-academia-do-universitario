import { DeleteTaskUseCase } from '../../../../src/tasks/application/use-cases/delete-task.use-case';
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

const makeTask = (id = '1'): Task =>
  new Task(id, 'Tarefa', null, TaskStatus.TODO, 0, new Date(), new Date());

describe('DeleteTaskUseCase', () => {
  let useCase: DeleteTaskUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new DeleteTaskUseCase(mockRepo);
  });

  it('deleta tarefa existente com sucesso', async () => {
    mockRepo.findById.mockResolvedValue(makeTask('1'));
    mockRepo.delete.mockResolvedValue(undefined);

    await useCase.execute('1');

    expect(mockRepo.findById).toHaveBeenCalledWith('1');
    expect(mockRepo.delete).toHaveBeenCalledWith('1');
  });

  it('retorna undefined após deleção', async () => {
    mockRepo.findById.mockResolvedValue(makeTask('1'));
    mockRepo.delete.mockResolvedValue(undefined);

    const result = await useCase.execute('1');

    expect(result).toBeUndefined();
  });

  it('lança NotFoundException quando tarefa não existe', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('nao-existe')).rejects.toThrow(NotFoundException);
  });

  it('lança NotFoundException com mensagem contendo o id', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('id-inexistente')).rejects.toThrow(
      'Tarefa com id "id-inexistente" não encontrada',
    );
  });

  it('não chama delete quando tarefa não é encontrada', async () => {
    mockRepo.findById.mockResolvedValue(null);

    try {
      await useCase.execute('qualquer-id');
    } catch {
      // esperado
    }

    expect(mockRepo.delete).not.toHaveBeenCalled();
  });

  it('chama findById com o id correto', async () => {
    mockRepo.findById.mockResolvedValue(makeTask('meu-id'));
    mockRepo.delete.mockResolvedValue(undefined);

    await useCase.execute('meu-id');

    expect(mockRepo.findById).toHaveBeenCalledWith('meu-id');
    expect(mockRepo.delete).toHaveBeenCalledWith('meu-id');
  });
});
