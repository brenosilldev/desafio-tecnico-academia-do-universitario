import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus } from '../../domain/task-status.enum';

export class UpdateTaskDto {
  @ApiPropertyOptional({ example: 'Implementar login', maxLength: 120 })
  @IsString()
  @IsOptional()
  @MaxLength(120, { message: 'Título deve ter no máximo 120 caracteres' })
  title?: string;

  @ApiPropertyOptional({ example: 'Criar tela de login com JWT', maxLength: 500 })
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Descrição deve ter no máximo 500 caracteres' })
  description?: string;

  @ApiPropertyOptional({ enum: TaskStatus, example: TaskStatus.IN_PROGRESS })
  @IsEnum(TaskStatus, {
    message: 'Status deve ser TODO, IN_PROGRESS ou DONE',
  })
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({ example: 0, minimum: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  position?: number;
}
