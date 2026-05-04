import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateTaskUseCase } from '../application/use-cases/create-task.use-case';
import { ListTasksUseCase } from '../application/use-cases/list-tasks.use-case';
import { UpdateTaskUseCase } from '../application/use-cases/update-task.use-case';
import { DeleteTaskUseCase } from '../application/use-cases/delete-task.use-case';
import { CreateTaskDto } from '../application/dto/create-task.dto';
import { UpdateTaskDto } from '../application/dto/update-task.dto';
import { TaskResponseDto } from '../application/dto/task-response.dto';

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
  constructor(
    private readonly createTask: CreateTaskUseCase,
    private readonly listTasks: ListTasksUseCase,
    private readonly updateTask: UpdateTaskUseCase,
    private readonly deleteTask: DeleteTaskUseCase,
  ) {}

  @Get()
  @ApiOkResponse({ type: [TaskResponseDto] })
  async findAll(): Promise<TaskResponseDto[]> {
    return this.listTasks.execute();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: TaskResponseDto })
  async create(@Body() dto: CreateTaskDto): Promise<TaskResponseDto> {
    return this.createTask.execute(dto);
  }

  @Patch(':id')
  @ApiOkResponse({ type: TaskResponseDto })
  @ApiNotFoundResponse({ description: 'Tarefa não encontrada' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    return this.updateTask.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Tarefa removida com sucesso' })
  @ApiNotFoundResponse({ description: 'Tarefa não encontrada' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.deleteTask.execute(id);
  }
}
