'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import { Task, TaskStatus, MovePayload } from '@/types/task'
import { INITIAL_TASKS } from '@/constants/tasks'

interface TasksContextValue {
  tasks: Task[]
  addTask: (title: string, description: string) => Task
  moveTask: (payload: MovePayload) => void
  getByStatus: (status: TaskStatus) => Task[]
  stats: {
    total: number
    todo: number
    inProgress: number
    done: number
    completionRate: number
  }
}

const TasksContext = createContext<TasksContextValue | null>(null)

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS)

  const addTask = useCallback((title: string, description: string): Task => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      description,
      status: 'todo',
      createdAt: new Date().toISOString().split('T')[0],
    }
    setTasks((prev) => [newTask, ...prev])
    return newTask
  }, [])

  const moveTask = useCallback(({ taskId, to }: MovePayload) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: to } : t))
    )
  }, [])

  const getByStatus = useCallback(
    (status: TaskStatus) => tasks.filter((t) => t.status === status),
    [tasks]
  )

  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
    completionRate:
      tasks.length > 0
        ? Math.round(
            (tasks.filter((t) => t.status === 'done').length / tasks.length) * 100
          )
        : 0,
  }

  return (
    <TasksContext.Provider value={{ tasks, addTask, moveTask, getByStatus, stats }}>
      {children}
    </TasksContext.Provider>
  )
}

export function useTasks() {
  const ctx = useContext(TasksContext)
  if (!ctx) throw new Error('useTasks must be used within TasksProvider')
  return ctx
}
