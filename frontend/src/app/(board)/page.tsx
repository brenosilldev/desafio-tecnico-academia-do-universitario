'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { GripHorizontal } from 'lucide-react'
import { useTasks } from '@/context/tasks-context'
import { BoardColumn } from '@/components/board/board-column'
import { MoveTaskModal } from '@/components/board/move-task-modal'
import { Task, TaskStatus, MovePayload } from '@/types/task'

const COLUMNS: TaskStatus[] = ['todo', 'in_progress', 'done']

export default function BoardPage() {
  const router = useRouter()
  const { tasks, moveTask, getByStatus, stats } = useTasks()
  const [moveModal, setMoveModal] = useState<{
    task: Task
    to: TaskStatus
  } | null>(null)

  function handleMoveClick(task: Task, to: TaskStatus) {
    setMoveModal({ task, to })
  }

  function handleMoveConfirm(payload: MovePayload) {
    moveTask(payload)
    setMoveModal(null)
  }

  function handleDrop(taskId: string, _from: TaskStatus, to: TaskStatus) {
    const task = tasks.find((t) => t.id === taskId)
    if (task) handleMoveClick(task, to)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <h1 className="text-xl font-bold text-gray-900">Board de Tarefas</h1>
        <p className="text-sm text-gray-400 mt-0.5">{stats.total} cards no total</p>
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
            onMove={handleMoveClick}
            onDropFromDrag={handleDrop}
            onAddCard={status === 'todo' ? () => router.push('/novo-card') : undefined}
          />
        ))}
      </motion.div>

      <MoveTaskModal
        task={moveModal?.task ?? null}
        targetStatus={moveModal?.to ?? null}
        open={moveModal !== null}
        onOpenChange={(open) => { if (!open) setMoveModal(null) }}
        onConfirm={handleMoveConfirm}
      />
    </div>
  )
}
