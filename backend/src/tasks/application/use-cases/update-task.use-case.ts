import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TASK_REPOSITORY } from '../../domain/task.repository';
import type { TaskRepository } from '../../domain/task.repository';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { TaskResponseDto } from '../dto/task-response.dto';

@Injectable()
export class UpdateTaskUseCase {
  constructor(
    @Inject(TASK_REPOSITORY)
    private readonly taskRepository: TaskRepository,
  ) {}

  async execute(id: string, dto: UpdateTaskDto): Promise<TaskResponseDto> {
    const existing = await this.taskRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Tarefa com id "${id}" não encontrada`);
    }

    const task = await this.taskRepository.update(id, {
      title: dto.title,
      description: dto.description,
      status: dto.status,
      position: dto.position,
    });

    return TaskResponseDto.fromEntity(task);
  }
}
