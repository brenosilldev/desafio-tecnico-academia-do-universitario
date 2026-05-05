import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Task, TaskStatus } from '@/types/task'

export const TASKS_QUERY_KEY = ['tasks'] as const

export function useTasks() {
  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: TASKS_QUERY_KEY,
    queryFn: api.tasks.list,
    staleTime: 30_000,
  })

  const stats = {
    total: data.length,
    todo: data.filter((t) => t.status === 'TODO').length,
    inProgress: data.filter((t) => t.status === 'IN_PROGRESS').length,
    done: data.filter((t) => t.status === 'DONE').length,
    completionRate:
      data.length > 0
        ? Math.round(
            (data.filter((t) => t.status === 'DONE').length / data.length) * 100,
          )
        : 0,
  }

  return {
    tasks: data,
    stats,
    isLoading,
    isError,
    error,
    getByStatus: (status: TaskStatus) => data.filter((t) => t.status === status),
  }
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ title, description }: { title: string; description: string }) =>
      api.tasks.create(title, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string
      status?: TaskStatus
      title?: string
      description?: string
      position?: number
    }) => api.tasks.update(id, data),
    onMutate: async ({ id, status }) => {
      if (!status) return
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY })
      const previous = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY)
      queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, (old) =>
        old?.map((t) => (t.id === id ? { ...t, status } : t)) ?? [],
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(TASKS_QUERY_KEY, ctx.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.tasks.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY })
      const previous = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY)
      queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, (old) =>
        old?.filter((t) => t.id !== id) ?? [],
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(TASKS_QUERY_KEY, ctx.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY })
    },
  })
}
