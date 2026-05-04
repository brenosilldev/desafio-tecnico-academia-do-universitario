import { Inject, Injectable } from '@nestjs/common';
import { TASK_REPOSITORY } from '../../domain/task.repository';
import type { TaskRepository } from '../../domain/task.repository';
import { TaskResponseDto } from '../dto/task-response.dto';

@Injectable()
export class ListTasksUseCase {
  constructor(
    @Inject(TASK_REPOSITORY)
    private readonly taskRepository: TaskRepository,
  ) {}

  async execute(): Promise<TaskResponseDto[]> {
    const tasks = await this.taskRepository.findAll();
    return tasks.map(TaskResponseDto.fromEntity);
  }
}
