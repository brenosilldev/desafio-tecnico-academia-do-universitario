import { Inject, Injectable } from '@nestjs/common';
import { TASK_REPOSITORY } from '../../domain/task.repository';
import type { TaskRepository } from '../../domain/task.repository';
import { CreateTaskDto } from '../dto/create-task.dto';
import { TaskResponseDto } from '../dto/task-response.dto';
import { TaskStatus } from '../../domain/task-status.enum';

@Injectable()
export class CreateTaskUseCase {
  constructor(
    @Inject(TASK_REPOSITORY)
    private readonly taskRepository: TaskRepository,
  ) {}

  async execute(dto: CreateTaskDto): Promise<TaskResponseDto> {
    const status = dto.status ?? TaskStatus.TODO;
    const maxPosition =
      await this.taskRepository.findMaxPositionByStatus(status);

    const task = await this.taskRepository.create({
      title: dto.title,
      description: dto.description ?? null,
      status,
      position: maxPosition + 1,
    });

    return TaskResponseDto.fromEntity(task);
  }
}
