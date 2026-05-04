import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Task } from '../domain/task.entity';
import { TaskStatus } from '../domain/task-status.enum';
import {
  CreateTaskData,
  TaskRepository,
  UpdateTaskData,
} from '../domain/task.repository';
import { TaskStatus as PrismaTaskStatus } from '@prisma/client';

@Injectable()
export class PrismaTaskRepository implements TaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Task[]> {
    const records = await this.prisma.task.findMany({
      orderBy: [{ status: 'asc' }, { position: 'asc' }, { createdAt: 'asc' }],
    });
    return records.map(this.toEntity);
  }

  async findById(id: string): Promise<Task | null> {
    const record = await this.prisma.task.findUnique({ where: { id } });
    return record ? this.toEntity(record) : null;
  }

  async findMaxPositionByStatus(status: TaskStatus): Promise<number> {
    const result = await this.prisma.task.aggregate({
      where: { status: status as PrismaTaskStatus },
      _max: { position: true },
    });
    return result._max.position ?? 0;
  }

  async create(data: CreateTaskData): Promise<Task> {
    const record = await this.prisma.task.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        status: (data.status ?? TaskStatus.TODO) as PrismaTaskStatus,
        position: data.position ?? 0,
      },
    });
    return this.toEntity(record);
  }

  async update(id: string, data: UpdateTaskData): Promise<Task> {
    const record = await this.prisma.task.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.status !== undefined && {
          status: data.status as PrismaTaskStatus,
        }),
        ...(data.position !== undefined && { position: data.position }),
      },
    });
    return this.toEntity(record);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.task.delete({ where: { id } });
  }

  private toEntity(record: {
    id: string;
    title: string;
    description: string | null;
    status: PrismaTaskStatus;
    position: number;
    createdAt: Date;
    updatedAt: Date;
  }): Task {
    return new Task(
      record.id,
      record.title,
      record.description,
      record.status as unknown as TaskStatus,
      record.position,
      record.createdAt,
      record.updatedAt,
    );
  }
}
