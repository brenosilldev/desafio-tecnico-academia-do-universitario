import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateTaskDto } from '../../../../src/tasks/application/dto/update-task.dto';
import { TaskStatus } from '../../../../src/tasks/domain/task-status.enum';

const build = (data: Record<string, unknown>): UpdateTaskDto =>
  plainToInstance(UpdateTaskDto, data);

describe('UpdateTaskDto', () => {
  it('aceita objeto vazio (todos os campos são opcionais)', async () => {
    const dto = build({});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  describe('title', () => {
    it('aceita title válido', async () => {
      const dto = build({ title: 'Novo Título' });
      const errors = await validate(dto);
      expect(errors.filter(e => e.property === 'title')).toHaveLength(0);
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
      expect(errors.filter(e => e.property === 'title')).toHaveLength(0);
    });

    it('rejeita title não-string', async () => {
      const dto = build({ title: 42 });
      const errors = await validate(dto);
      const titleErrors = errors.filter(e => e.property === 'title');
      expect(titleErrors.length).toBeGreaterThan(0);
    });
  });

  describe('description', () => {
    it('aceita description válida', async () => {
      const dto = build({ description: 'Nova descrição' });
      const errors = await validate(dto);
      expect(errors.filter(e => e.property === 'description')).toHaveLength(0);
    });

    it('rejeita description com mais de 500 caracteres', async () => {
      const dto = build({ description: 'a'.repeat(501) });
      const errors = await validate(dto);
      const descErrors = errors.filter(e => e.property === 'description');
      expect(descErrors.length).toBeGreaterThan(0);
    });

    it('aceita description com exatamente 500 caracteres', async () => {
      const dto = build({ description: 'a'.repeat(500) });
      const errors = await validate(dto);
      expect(errors.filter(e => e.property === 'description')).toHaveLength(0);
    });
  });

  describe('status', () => {
    it('aceita TODO', async () => {
      const dto = build({ status: TaskStatus.TODO });
      const errors = await validate(dto);
      expect(errors.filter(e => e.property === 'status')).toHaveLength(0);
    });

    it('aceita IN_PROGRESS', async () => {
      const dto = build({ status: TaskStatus.IN_PROGRESS });
      const errors = await validate(dto);
      expect(errors.filter(e => e.property === 'status')).toHaveLength(0);
    });

    it('aceita DONE', async () => {
      const dto = build({ status: TaskStatus.DONE });
      const errors = await validate(dto);
      expect(errors.filter(e => e.property === 'status')).toHaveLength(0);
    });

    it('rejeita status inválido', async () => {
      const dto = build({ status: 'PENDENTE' });
      const errors = await validate(dto);
      const statusErrors = errors.filter(e => e.property === 'status');
      expect(statusErrors.length).toBeGreaterThan(0);
    });
  });

  describe('position', () => {
    it('aceita position válida', async () => {
      const dto = build({ position: 3 });
      const errors = await validate(dto);
      expect(errors.filter(e => e.property === 'position')).toHaveLength(0);
    });

    it('aceita position zero', async () => {
      const dto = build({ position: 0 });
      const errors = await validate(dto);
      expect(errors.filter(e => e.property === 'position')).toHaveLength(0);
    });

    it('rejeita position negativa', async () => {
      const dto = build({ position: -1 });
      const errors = await validate(dto);
      const posErrors = errors.filter(e => e.property === 'position');
      expect(posErrors.length).toBeGreaterThan(0);
    });

    it('rejeita position não-inteira', async () => {
      const dto = build({ position: 1.5 });
      const errors = await validate(dto);
      const posErrors = errors.filter(e => e.property === 'position');
      expect(posErrors.length).toBeGreaterThan(0);
    });
  });

  describe('DTO válido completo', () => {
    it('não retorna erros com todos os campos válidos', async () => {
      const dto = build({
        title: 'Título atualizado',
        description: 'Nova descrição',
        status: TaskStatus.DONE,
        position: 2,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
