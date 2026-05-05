'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { GripHorizontal, AlertCircle } from 'lucide-react'
import { useTasks, useUpdateTask } from '@/hooks/use-tasks'
import { BoardColumn } from '@/components/board/board-column'
import { MoveTaskModal } from '@/components/board/move-task-modal'
import { Task, TaskStatus, MovePayload } from '@/types/task'

const COLUMNS: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE']

export default function BoardPage() {
  const router = useRouter()
  const { tasks, getByStatus, stats, isLoading, isError } = useTasks()
  const updateTask = useUpdateTask()
  const [moveModal, setMoveModal] = useState<{ task: Task; to: TaskStatus } | null>(null)

  function handleMoveClick(task: Task, to: TaskStatus) {
    setMoveModal({ task, to })
  }

  function handleMoveConfirm(payload: MovePayload) {
    updateTask.mutate({ id: payload.taskId, status: payload.to })
    setMoveModal(null)
  }

  function handleDrop(taskId: string, _from: TaskStatus, to: TaskStatus) {
    const task = tasks.find((t) => t.id === taskId)
    if (task) handleMoveClick(task, to)
  }

  if (isError) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 text-red-500 bg-red-50 rounded-xl p-4 border border-red-100">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm">
            Não foi possível carregar as tarefas. Verifique se o servidor está rodando em{' '}
            <code className="font-mono text-xs bg-red-100 px-1 rounded">
              {process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333/api'}
            </code>
            .
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <h1 className="text-xl font-bold text-gray-900">Board de Tarefas</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {isLoading ? 'Carregando...' : `${stats.total} cards no total`}
        </p>
      </motion.div>

      <div className="flex items-center justify-end mt-1 mb-6">
        <span className="flex items-center gap-1.5 text-xs text-gray-300">
          <GripHorizontal className="h-3.5 w-3.5" />
          Arraste os cards entre colunas
        </span>
      </div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {COLUMNS.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            tasks={getByStatus(status)}
            isLoading={isLoading}
            onMove={handleMoveClick}
            onDropFromDrag={handleDrop}
            onAddCard={status === 'TODO' ? () => router.push('/novo-card') : undefined}
          />
        ))}
      </motion.div>

      <MoveTaskModal
        task={moveModal?.task ?? null}
        targetStatus={moveModal?.to ?? null}
        open={moveModal !== null}
        onOpenChange={(open) => {
          if (!open) setMoveModal(null)
        }}
        onConfirm={handleMoveConfirm}
      />
    </div>
  )
}
