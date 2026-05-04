import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateTaskDto } from '../../../../src/tasks/application/dto/create-task.dto';
import { TaskStatus } from '../../../../src/tasks/domain/task-status.enum';

const build = (data: Record<string, unknown>): CreateTaskDto =>
  plainToInstance(CreateTaskDto, data);

describe('CreateTaskDto', () => {
  describe('title', () => {
    it('aceita título válido', async () => {
      const dto = build({ title: 'Minha tarefa' });
      const errors = await validate(dto);
      expect(errors.filter(e => e.property === 'title')).toHaveLength(0);
    });

    it('rejeita title vazio', async () => {
      const dto = build({ title: '' });
      const errors = await validate(dto);
      const titleErrors = errors.filter(e => e.property === 'title');
      expect(titleErrors.length).toBeGreaterThan(0);
    });

    it('rejeita ausência de title', async () => {
      const dto = build({});
      const errors = await validate(dto);
      const titleErrors = errors.filter(e => e.property === 'title');
      expect(titleErrors.length).toBeGreaterThan(0);
    });

    it('rejeita title com mais de 120 caracteres', async () => {
      const dto = build({ title: 'a'.repeat(121) });
      const errors = await validate(dto);
      const titleErrors = errors.filter(e => e.property === 'title');
      expect(titleErrors.length).toBeGreaterThan(0);
    });

    it('aceita title com exatamente 120 caracteres', async () => {
      const dto = build({ title: 'a'.repeat(120) });
      const errors = await validate(dto);
      const titleErrors = errors.filter(e => e.property === 'title');
      expect(titleErrors).toHaveLength(0);
    });

    it('rejeita title não-string', async () => {
      const dto = build({ title: 123 });
      const errors = await validate(dto);
      const titleErrors = errors.filter(e => e.property === 'title');
      expect(titleErrors.length).toBeGreaterThan(0);
    });
  });

  describe('description', () => {
    it('é opcional', async () => {
      const dto = build({ title: 'Tarefa' });
      const errors = await validate(dto);
      expect(errors.filter(e => e.property === 'description')).toHaveLength(0);
    });

    it('aceita description válida', async () => {
      const dto = build({ title: 'Tarefa', description: 'Detalhes da tarefa' });
      const errors = await validate(dto);
      expect(errors.filter(e => e.property === 'description')).toHaveLength(0);
    });

    it('rejeita description com mais de 500 caracteres', async () => {
      const dto = build({ title: 'Tarefa', description: 'a'.repeat(501) });
      const errors = await validate(dto);
      const descErrors = errors.filter(e => e.property === 'description');
      expect(descErrors.length).toBeGreaterThan(0);
    });

    it('aceita description com exatamente 500 caracteres', async () => {
      const dto = build({ title: 'Tarefa', description: 'a'.repeat(500) });
      const errors = await validate(dto);
      expect(errors.filter(e => e.property === 'description')).toHaveLength(0);
    });
  });

  describe('status', () => {
    it('é opcional', async () => {
      const dto = build({ title: 'Tarefa' });
      const errors = await validate(dto);
      expect(errors.filter(e => e.property === 'status')).toHaveLength(0);
    });

    it('aceita TODO', async () => {
      const dto = build({ title: 'Tarefa', status: TaskStatus.TODO });
      const errors = await validate(dto);
      expect(errors.filter(e => e.property === 'status')).toHaveLength(0);
    });

    it('aceita IN_PROGRESS', async () => {
      const dto = build({ title: 'Tarefa', status: TaskStatus.IN_PROGRESS });
      const errors = await validate(dto);
      expect(errors.filter(e => e.property === 'status')).toHaveLength(0);
    });

    it('aceita DONE', async () => {
      const dto = build({ title: 'Tarefa', status: TaskStatus.DONE });
      const errors = await validate(dto);
      expect(errors.filter(e => e.property === 'status')).toHaveLength(0);
    });

    it('rejeita status inválido', async () => {
      const dto = build({ title: 'Tarefa', status: 'INVALID' });
      const errors = await validate(dto);
      const statusErrors = errors.filter(e => e.property === 'status');
      expect(statusErrors.length).toBeGreaterThan(0);
    });
  });

  describe('DTO válido completo', () => {
    it('não retorna erros com todos os campos válidos', async () => {
      const dto = build({
        title: 'Tarefa Completa',
        description: 'Descrição detalhada',
        status: TaskStatus.IN_PROGRESS,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
