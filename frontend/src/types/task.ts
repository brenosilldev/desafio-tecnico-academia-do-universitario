export type TaskStatus = 'todo' | 'in_progress' | 'done'

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  createdAt: string
}

export interface MovePayload {
  taskId: string
  from: TaskStatus
  to: TaskStatus
  comment: string
}

export const STATUS_CONFIG = {
  todo: {
    label: 'A Fazer',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    dotColor: '#9CA3AF',
    badgeClass: 'bg-gray-100 text-gray-600',
  },
  in_progress: {
    label: 'Em Andamento',
    color: '#F97316',
    bgColor: '#FFF7ED',
    dotColor: '#F97316',
    badgeClass: 'bg-orange-100 text-orange-600',
  },
  done: {
    label: 'Concluído',
    color: '#22C55E',
    bgColor: '#F0FDF4',
    dotColor: '#22C55E',
    badgeClass: 'bg-green-100 text-green-600',
  },
} as const
