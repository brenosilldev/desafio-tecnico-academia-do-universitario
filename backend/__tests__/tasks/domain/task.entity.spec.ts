import { Task } from '../../../src/tasks/domain/task.entity';
import { TaskStatus } from '../../../src/tasks/domain/task-status.enum';

const makeTask = (overrides: Partial<{
  id: string; title: string; description: string | null;
  status: TaskStatus; position: number; createdAt: Date; updatedAt: Date;
}> = {}): Task => {
  const base = {
    id: 'task-id',
    title: 'Título da Tarefa',
    description: 'Descrição',
    status: TaskStatus.TODO,
    position: 0,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  };
  return new Task(base.id, base.title, base.description, base.status, base.position, base.createdAt, base.updatedAt);
};

describe('Task Entity', () => {
  describe('constructor', () => {
    it('atribui todos os campos corretamente', () => {
      const date = new Date('2024-06-01T10:00:00Z');
      const task = new Task('id-1', 'Titulo', 'Desc', TaskStatus.IN_PROGRESS, 3, date, date);

      expect(task.id).toBe('id-1');
      expect(task.title).toBe('Titulo');
      expect(task.description).toBe('Desc');
      expect(task.status).toBe(TaskStatus.IN_PROGRESS);
      expect(task.position).toBe(3);
      expect(task.createdAt).toEqual(date);
      expect(task.updatedAt).toEqual(date);
    });

    it('aceita description como null', () => {
      const task = makeTask({ description: null });
      expect(task.description).toBeNull();
    });

    it('aceita todos os valores de TaskStatus', () => {
      const todo = makeTask({ status: TaskStatus.TODO });
      const inProgress = makeTask({ status: TaskStatus.IN_PROGRESS });
      const done = makeTask({ status: TaskStatus.DONE });

      expect(todo.status).toBe(TaskStatus.TODO);
      expect(inProgress.status).toBe(TaskStatus.IN_PROGRESS);
      expect(done.status).toBe(TaskStatus.DONE);
    });

    it('id é readonly', () => {
      const task = makeTask({ id: 'readonly-id' });
      expect(task.id).toBe('readonly-id');
    });

    it('createdAt é readonly', () => {
      const date = new Date('2024-01-01');
      const task = makeTask({ createdAt: date });
      expect(task.createdAt).toEqual(date);
    });
  });

  describe('changeStatus', () => {
    it('altera o status para IN_PROGRESS', () => {
      const task = makeTask({ status: TaskStatus.TODO });
      task.changeStatus(TaskStatus.IN_PROGRESS);
      expect(task.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('altera o status para DONE', () => {
      const task = makeTask({ status: TaskStatus.IN_PROGRESS });
      task.changeStatus(TaskStatus.DONE);
      expect(task.status).toBe(TaskStatus.DONE);
    });

    it('atualiza updatedAt', () => {
      const oldDate = new Date('2024-01-01T00:00:00Z');
      const task = makeTask({ updatedAt: oldDate });
      task.changeStatus(TaskStatus.DONE);
      expect(task.updatedAt.getTime()).toBeGreaterThanOrEqual(oldDate.getTime());
    });

    it('não altera outros campos', () => {
      const task = makeTask({ title: 'Original', position: 2 });
      task.changeStatus(TaskStatus.DONE);
      expect(task.title).toBe('Original');
      expect(task.position).toBe(2);
    });
  });

  describe('update', () => {
    it('atualiza o title', () => {
      const task = makeTask({ title: 'Antigo' });
      task.update('Novo Título', null);
      expect(task.title).toBe('Novo Título');
    });

    it('atualiza a description', () => {
      const task = makeTask({ description: 'Antiga' });
      task.update('Titulo', 'Nova Descrição');
      expect(task.description).toBe('Nova Descrição');
    });

    it('aceita description null', () => {
      const task = makeTask({ description: 'Antiga' });
      task.update('Titulo', null);
      expect(task.description).toBeNull();
    });

    it('atualiza updatedAt', () => {
      const oldDate = new Date('2024-01-01T00:00:00Z');
      const task = makeTask({ updatedAt: oldDate });
      task.update('Novo', 'Desc');
      expect(task.updatedAt.getTime()).toBeGreaterThanOrEqual(oldDate.getTime());
    });

    it('não altera status nem position', () => {
      const task = makeTask({ status: TaskStatus.IN_PROGRESS, position: 5 });
      task.update('Novo', null);
      expect(task.status).toBe(TaskStatus.IN_PROGRESS);
      expect(task.position).toBe(5);
    });
  });

  describe('reposition', () => {
    it('atualiza a position', () => {
      const task = makeTask({ position: 0 });
      task.reposition(7);
      expect(task.position).toBe(7);
    });

    it('aceita position zero', () => {
      const task = makeTask({ position: 3 });
      task.reposition(0);
      expect(task.position).toBe(0);
    });

    it('atualiza updatedAt', () => {
      const oldDate = new Date('2024-01-01T00:00:00Z');
      const task = makeTask({ updatedAt: oldDate });
      task.reposition(4);
      expect(task.updatedAt.getTime()).toBeGreaterThanOrEqual(oldDate.getTime());
    });

    it('não altera title, description nem status', () => {
      const task = makeTask({ title: 'Titulo', description: 'Desc', status: TaskStatus.DONE });
      task.reposition(10);
      expect(task.title).toBe('Titulo');
      expect(task.description).toBe('Desc');
      expect(task.status).toBe(TaskStatus.DONE);
    });
  });
});
