import { Task } from './task.entity';
import { TaskStatus } from './task-status.enum';

export interface CreateTaskData {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  position?: number;
}

export interface UpdateTaskData {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  position?: number;
}

export const TASK_REPOSITORY = Symbol('TASK_REPOSITORY');

export interface TaskRepository {
  findAll(): Promise<Task[]>;
  findById(id: string): Promise<Task | null>;
  findMaxPositionByStatus(status: TaskStatus): Promise<number>;
  create(data: CreateTaskData): Promise<Task>;
  update(id: string, data: UpdateTaskData): Promise<Task>;
  delete(id: string): Promise<void>;
}
