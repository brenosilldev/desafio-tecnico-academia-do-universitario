import { TaskResponseDto } from '../../../../src/tasks/application/dto/task-response.dto';
import { Task } from '../../../../src/tasks/domain/task.entity';
import { TaskStatus } from '../../../../src/tasks/domain/task-status.enum';

const makeTask = (overrides: Partial<{
  id: string; title: string; description: string | null;
  status: TaskStatus; position: number; createdAt: Date; updatedAt: Date;
}> = {}): Task => {
  const base = {
    id: 'task-id',
    title: 'Tarefa',
    description: null,
    status: TaskStatus.TODO,
    position: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
  return new Task(base.id, base.title, base.description, base.status, base.position, base.createdAt, base.updatedAt);
};

describe('TaskResponseDto', () => {
  describe('fromEntity', () => {
    it('retorna instância de TaskResponseDto', () => {
      const task = makeTask();
      const dto = TaskResponseDto.fromEntity(task);
      expect(dto).toBeInstanceOf(TaskResponseDto);
    });

    it('mapeia id corretamente', () => {
      const task = makeTask({ id: 'abc-123' });
      expect(TaskResponseDto.fromEntity(task).id).toBe('abc-123');
    });

    it('mapeia title corretamente', () => {
      const task = makeTask({ title: 'Minha Tarefa' });
      expect(TaskResponseDto.fromEntity(task).title).toBe('Minha Tarefa');
    });

    it('mapeia description quando preenchida', () => {
      const task = makeTask({ description: 'Detalhes da tarefa' });
      expect(TaskResponseDto.fromEntity(task).description).toBe('Detalhes da tarefa');
    });

    it('mapeia description null', () => {
      const task = makeTask({ description: null });
      expect(TaskResponseDto.fromEntity(task).description).toBeNull();
    });

    it('mapeia status TODO', () => {
      const task = makeTask({ status: TaskStatus.TODO });
      expect(TaskResponseDto.fromEntity(task).status).toBe(TaskStatus.TODO);
    });

    it('mapeia status IN_PROGRESS', () => {
      const task = makeTask({ status: TaskStatus.IN_PROGRESS });
      expect(TaskResponseDto.fromEntity(task).status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('mapeia status DONE', () => {
      const task = makeTask({ status: TaskStatus.DONE });
      expect(TaskResponseDto.fromEntity(task).status).toBe(TaskStatus.DONE);
    });

    it('mapeia position corretamente', () => {
      const task = makeTask({ position: 5 });
      expect(TaskResponseDto.fromEntity(task).position).toBe(5);
    });

    it('mapeia createdAt corretamente', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const task = makeTask({ createdAt: date });
      expect(TaskResponseDto.fromEntity(task).createdAt).toEqual(date);
    });

    it('mapeia updatedAt corretamente', () => {
      const date = new Date('2024-06-16T08:30:00Z');
      const task = makeTask({ updatedAt: date });
      expect(TaskResponseDto.fromEntity(task).updatedAt).toEqual(date);
    });

    it('mapeia todos os campos de uma vez', () => {
      const created = new Date('2024-01-01T00:00:00Z');
      const updated = new Date('2024-06-01T10:00:00Z');
      const task = new Task('xyz', 'Título Completo', 'Descrição Completa', TaskStatus.DONE, 3, created, updated);

      const dto = TaskResponseDto.fromEntity(task);

      expect(dto.id).toBe('xyz');
      expect(dto.title).toBe('Título Completo');
      expect(dto.description).toBe('Descrição Completa');
      expect(dto.status).toBe(TaskStatus.DONE);
      expect(dto.position).toBe(3);
      expect(dto.createdAt).toEqual(created);
      expect(dto.updatedAt).toEqual(updated);
    });
  });
});
