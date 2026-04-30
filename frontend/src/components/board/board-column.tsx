'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Task, TaskStatus, STATUS_CONFIG } from '@/types/task'
import { TaskCard } from './task-card'
import { cn } from '@/lib/utils'

interface BoardColumnProps {
  status: TaskStatus
  tasks: Task[]
  onMove: (task: Task, to: TaskStatus) => void
  onDropFromDrag: (taskId: string, fromStatus: TaskStatus, toStatus: TaskStatus) => void
  onAddCard?: () => void
}

export function BoardColumn({
  status,
  tasks,
  onMove,
  onDropFromDrag,
  onAddCard,
}: BoardColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const config = STATUS_CONFIG[status]

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(true)
  }

  function handleDragLeave() {
    setIsDragOver(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const taskId = e.dataTransfer.getData('taskId')
    const fromStatus = e.dataTransfer.getData('fromStatus') as TaskStatus
    if (taskId && fromStatus !== status) {
      onDropFromDrag(taskId, fromStatus, status)
    }
  }

  return (
    <div className="flex flex-col min-w-0 w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: config.dotColor }}
          />
          <h2 className="text-sm font-semibold text-gray-700">{config.label}</h2>
        </div>
        <span
          className="text-xs font-semibold rounded-full px-2 py-0.5 min-w-[20px] text-center"
          style={{
            backgroundColor: config.bgColor,
            color: config.color,
          }}
        >
          {tasks.length}
        </span>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'flex-1 flex flex-col gap-3 rounded-xl border-2 border-transparent p-1 min-h-[200px] transition-colors duration-150',
          isDragOver && 'border-dashed border-orange-300 bg-orange-50/30'
        )}
      >
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onMove={onMove} />
          ))}
        </AnimatePresence>

        {tasks.length === 0 && !isDragOver && (
          <div className="flex-1 flex items-center justify-center py-8">
            <p className="text-xs text-gray-300">Nenhuma tarefa</p>
          </div>
        )}
      </div>

      {status === 'todo' && onAddCard && (
        <button
          onClick={onAddCard}
          className="mt-3 flex items-center justify-center gap-1.5 w-full h-10 rounded-xl border-2 border-dashed border-gray-200 text-xs text-gray-400 hover:border-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-all duration-150"
          aria-label="Adicionar novo card"
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar card
        </button>
      )}
    </div>
  )
}
