import { TasksController } from '../../../src/tasks/presentation/tasks.controller';
import { CreateTaskUseCase } from '../../../src/tasks/application/use-cases/create-task.use-case';
import { ListTasksUseCase } from '../../../src/tasks/application/use-cases/list-tasks.use-case';
import { UpdateTaskUseCase } from '../../../src/tasks/application/use-cases/update-task.use-case';
import { DeleteTaskUseCase } from '../../../src/tasks/application/use-cases/delete-task.use-case';
import { TaskStatus } from '../../../src/tasks/domain/task-status.enum';
import { TaskResponseDto } from '../../../src/tasks/application/dto/task-response.dto';
import { NotFoundException } from '@nestjs/common';

const makeDto = (overrides: Partial<TaskResponseDto> = {}): TaskResponseDto =>
  Object.assign(new TaskResponseDto(), {
    id: 'task-1',
    title: 'Tarefa',
    description: null,
    status: TaskStatus.TODO,
    position: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  });

describe('TasksController', () => {
  let controller: TasksController;
  let createTask: jest.Mocked<CreateTaskUseCase>;
  let listTasks: jest.Mocked<ListTasksUseCase>;
  let updateTask: jest.Mocked<UpdateTaskUseCase>;
  let deleteTask: jest.Mocked<DeleteTaskUseCase>;

  beforeEach(() => {
    createTask = { execute: jest.fn() } as unknown as jest.Mocked<CreateTaskUseCase>;
    listTasks = { execute: jest.fn() } as unknown as jest.Mocked<ListTasksUseCase>;
    updateTask = { execute: jest.fn() } as unknown as jest.Mocked<UpdateTaskUseCase>;
    deleteTask = { execute: jest.fn() } as unknown as jest.Mocked<DeleteTaskUseCase>;
    controller = new TasksController(createTask, listTasks, updateTask, deleteTask);
  });

  describe('findAll', () => {
    it('retorna array de DTOs', async () => {
      const dtos = [makeDto({ id: 'task-1' }), makeDto({ id: 'task-2' })];
      listTasks.execute.mockResolvedValue(dtos);

      const result = await controller.findAll();

      expect(listTasks.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(dtos);
      expect(result).toHaveLength(2);
    });

    it('retorna array vazio quando não há tarefas', async () => {
      listTasks.execute.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });

    it('delega inteiramente ao ListTasksUseCase', async () => {
      listTasks.execute.mockResolvedValue([]);

      await controller.findAll();

      expect(listTasks.execute).toHaveBeenCalledTimes(1);
      expect(createTask.execute).not.toHaveBeenCalled();
      expect(updateTask.execute).not.toHaveBeenCalled();
      expect(deleteTask.execute).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('chama createTask.execute com o DTO correto', async () => {
      const dto = makeDto();
      const body = { title: 'Nova Tarefa', description: 'Desc', status: TaskStatus.TODO };
      createTask.execute.mockResolvedValue(dto);

      const result = await controller.create(body);

      expect(createTask.execute).toHaveBeenCalledWith(body);
      expect(result).toEqual(dto);
    });

    it('retorna o DTO criado', async () => {
      const dto = makeDto({ id: 'novo-id', title: 'Criada' });
      createTask.execute.mockResolvedValue(dto);

      const result = await controller.create({ title: 'Criada' });

      expect(result.id).toBe('novo-id');
      expect(result.title).toBe('Criada');
    });

    it('propaga exceção do use case', async () => {
      createTask.execute.mockRejectedValue(new Error('Erro de criação'));

      await expect(controller.create({ title: 'Falha' })).rejects.toThrow('Erro de criação');
    });
  });

  describe('update', () => {
    it('chama updateTask.execute com id e DTO', async () => {
      const dto = makeDto({ title: 'Atualizada' });
      updateTask.execute.mockResolvedValue(dto);

      const result = await controller.update('task-1', { title: 'Atualizada', status: TaskStatus.DONE });

      expect(updateTask.execute).toHaveBeenCalledWith('task-1', { title: 'Atualizada', status: TaskStatus.DONE });
      expect(result).toEqual(dto);
    });

    it('propaga NotFoundException do use case', async () => {
      updateTask.execute.mockRejectedValue(new NotFoundException('Tarefa com id "x" não encontrada'));

      await expect(controller.update('x', { title: 'Y' })).rejects.toThrow(NotFoundException);
    });

    it('retorna DTO atualizado', async () => {
      const dto = makeDto({ status: TaskStatus.DONE, position: 3 });
      updateTask.execute.mockResolvedValue(dto);

      const result = await controller.update('task-1', { status: TaskStatus.DONE });

      expect(result.status).toBe(TaskStatus.DONE);
      expect(result.position).toBe(3);
    });
  });

  describe('remove', () => {
    it('chama deleteTask.execute com o id correto', async () => {
      deleteTask.execute.mockResolvedValue(undefined);

      await controller.remove('task-1');

      expect(deleteTask.execute).toHaveBeenCalledWith('task-1');
      expect(deleteTask.execute).toHaveBeenCalledTimes(1);
    });

    it('retorna undefined', async () => {
      deleteTask.execute.mockResolvedValue(undefined);

      const result = await controller.remove('task-1');

      expect(result).toBeUndefined();
    });

    it('propaga NotFoundException do use case', async () => {
      deleteTask.execute.mockRejectedValue(
        new NotFoundException('Tarefa com id "nao-existe" não encontrada'),
      );

      await expect(controller.remove('nao-existe')).rejects.toThrow(NotFoundException);
    });

    it('não chama outros use cases', async () => {
      deleteTask.execute.mockResolvedValue(undefined);

      await controller.remove('task-1');

      expect(createTask.execute).not.toHaveBeenCalled();
      expect(listTasks.execute).not.toHaveBeenCalled();
      expect(updateTask.execute).not.toHaveBeenCalled();
    });
  });
});
