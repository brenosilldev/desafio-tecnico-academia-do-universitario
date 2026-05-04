import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TASK_REPOSITORY } from '../../domain/task.repository';
import type { TaskRepository } from '../../domain/task.repository';

@Injectable()
export class DeleteTaskUseCase {
  constructor(
    @Inject(TASK_REPOSITORY)
    private readonly taskRepository: TaskRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.taskRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Tarefa com id "${id}" não encontrada`);
    }
    await this.taskRepository.delete(id);
  }
}
