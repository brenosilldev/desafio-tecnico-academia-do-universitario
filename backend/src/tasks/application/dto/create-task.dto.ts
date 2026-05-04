import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus } from '../../domain/task-status.enum';

export class CreateTaskDto {
  @ApiProperty({ example: 'Implementar login', maxLength: 120 })
  @IsString()
  @IsNotEmpty({ message: 'Título é obrigatório' })
  @MaxLength(120, { message: 'Título deve ter no máximo 120 caracteres' })
  title: string;

  @ApiPropertyOptional({ example: 'Criar tela de login com JWT', maxLength: 500 })
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Descrição deve ter no máximo 500 caracteres' })
  description?: string;

  @ApiPropertyOptional({ enum: TaskStatus, example: TaskStatus.TODO })
  @IsEnum(TaskStatus, {
    message: 'Status deve ser TODO, IN_PROGRESS ou DONE',
  })
  @IsOptional()
  status?: TaskStatus;
}
