import { Module } from '@nestjs/common';
import { TASK_REPOSITORY } from './domain/task.repository';
import { PrismaTaskRepository } from './infrastructure/prisma-task.repository';
import { CreateTaskUseCase } from './application/use-cases/create-task.use-case';
import { ListTasksUseCase } from './application/use-cases/list-tasks.use-case';
import { UpdateTaskUseCase } from './application/use-cases/update-task.use-case';
import { DeleteTaskUseCase } from './application/use-cases/delete-task.use-case';
import { TasksController } from './presentation/tasks.controller';

const useCases = [
  CreateTaskUseCase,
  ListTasksUseCase,
  UpdateTaskUseCase,
  DeleteTaskUseCase,
];

@Module({
  controllers: [TasksController],
  providers: [
    { provide: TASK_REPOSITORY, useClass: PrismaTaskRepository },
    ...useCases,
  ],
})
export class TasksModule {}
