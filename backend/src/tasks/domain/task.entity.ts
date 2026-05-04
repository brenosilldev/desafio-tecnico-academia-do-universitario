import { TaskStatus } from './task-status.enum';

export class Task {
  constructor(
    public readonly id: string,
    public title: string,
    public description: string | null,
    public status: TaskStatus,
    public position: number,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  changeStatus(status: TaskStatus): void {
    this.status = status;
    this.updatedAt = new Date();
  }

  update(title: string, description: string | null): void {
    this.title = title;
    this.description = description;
    this.updatedAt = new Date();
  }

  reposition(position: number): void {
    this.position = position;
    this.updatedAt = new Date();
  }
}
