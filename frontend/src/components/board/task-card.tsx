'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Task, TaskStatus, STATUS_CONFIG } from '@/types/task'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface TaskCardProps {
  task: Task
  onMove: (task: Task, to: TaskStatus) => void
  isDragging?: boolean
}

const NEXT_STATUS: Record<TaskStatus, TaskStatus | null> = {
  todo: 'in_progress',
  in_progress: 'done',
  done: null,
}

export function TaskCard({ task, onMove, isDragging }: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const nextStatus = NEXT_STATUS[task.status]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      draggable
      onDragStart={(e) => {
        const event = e as unknown as React.DragEvent
        event.dataTransfer?.setData('taskId', task.id)
        event.dataTransfer?.setData('fromStatus', task.status)
      }}
      className={cn(
        'bg-white rounded-xl border border-gray-100 p-4 cursor-grab active:cursor-grabbing select-none group relative',
        isDragging && 'opacity-50 rotate-2 shadow-lg',
        !isDragging && 'hover:shadow-md hover:border-gray-200 transition-all duration-200'
      )}
      role="article"
      aria-label={`Tarefa: ${task.title}`}
    >
      <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-1.5">
        {task.title}
      </h3>
      <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
        {task.description}
      </p>

      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-300">{formatDate(task.createdAt)}</span>

        {nextStatus && (
          <button
            onClick={() => onMove(task, nextStatus)}
            className={cn(
              'opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md transition-all duration-150',
              'text-orange-500 hover:bg-orange-50'
            )}
            aria-label={`Mover para ${STATUS_CONFIG[nextStatus].label}`}
          >
            <ArrowRight className="h-3 w-3" />
            {STATUS_CONFIG[nextStatus].label}
          </button>
        )}
      </div>
    </motion.div>
  )
}
