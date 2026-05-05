import { Task, TaskStatus } from '@/types/task'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333/api'

interface BackendTask {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  position: number
  createdAt: string
  updatedAt: string
}

function mapTask(t: BackendTask): Task {
  return {
    id: t.id,
    title: t.title,
    description: t.description ?? '',
    status: t.status,
    createdAt: t.createdAt.split('T')[0],
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(
      (body as { message?: string }).message ?? `HTTP ${res.status}`,
    )
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  tasks: {
    list: (): Promise<Task[]> =>
      request<BackendTask[]>('/tasks').then((items) => items.map(mapTask)),

    create: (title: string, description: string): Promise<Task> =>
      request<BackendTask>('/tasks', {
        method: 'POST',
        body: JSON.stringify({ title, description }),
      }).then(mapTask),

    update: (
      id: string,
      data: {
        status?: TaskStatus
        title?: string
        description?: string
        position?: number
      },
    ): Promise<Task> => {
      const body: Record<string, unknown> = {}
      if (data.status !== undefined) body.status = data.status
      if (data.title !== undefined) body.title = data.title
      if (data.description !== undefined) body.description = data.description
      if (data.position !== undefined) body.position = data.position
      return request<BackendTask>(`/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }).then(mapTask)
    },

    delete: (id: string): Promise<void> =>
      request<void>(`/tasks/${id}`, { method: 'DELETE' }),
  },
}
