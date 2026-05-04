import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus } from '../../domain/task-status.enum';
import { Task } from '../../domain/task.entity';

export class TaskResponseDto {
  @ApiProperty({ example: 'clx1234abcd' })
  id: string;

  @ApiProperty({ example: 'Implementar login' })
  title: string;

  @ApiPropertyOptional({ example: 'Criar tela de login com JWT', nullable: true })
  description: string | null;

  @ApiProperty({ enum: TaskStatus, example: TaskStatus.TODO })
  status: TaskStatus;

  @ApiProperty({ example: 0 })
  position: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  static fromEntity(task: Task): TaskResponseDto {
    const dto = new TaskResponseDto();
    dto.id = task.id;
    dto.title = task.title;
    dto.description = task.description;
    dto.status = task.status;
    dto.position = task.position;
    dto.createdAt = task.createdAt;
    dto.updatedAt = task.updatedAt;
    return dto;
  }
}
