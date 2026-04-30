'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Task, TaskStatus, STATUS_CONFIG, MovePayload } from '@/types/task'
import { cn } from '@/lib/utils'

interface MoveTaskModalProps {
  task: Task | null
  targetStatus: TaskStatus | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (payload: MovePayload) => void
}

export function MoveTaskModal({
  task,
  targetStatus,
  open,
  onOpenChange,
  onConfirm,
}: MoveTaskModalProps) {
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')

  const fromConfig = task ? STATUS_CONFIG[task.status] : null
  const toConfig = targetStatus ? STATUS_CONFIG[targetStatus] : null

  function handleConfirm() {
    if (!comment.trim()) {
      setError('O comentário é obrigatório.')
      return
    }
    if (!task || !targetStatus) return
    onConfirm({ taskId: task.id, from: task.status, to: targetStatus, comment })
    setComment('')
    setError('')
    onOpenChange(false)
  }

  function handleClose() {
    setComment('')
    setError('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        title="Mover tarefa"
        icon={<ArrowRight className="h-4 w-4 text-gray-500" />}
        onClose={handleClose}
      >
        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Card</p>
            <p className="text-sm font-medium text-gray-900">{task?.title}</p>
          </div>

          {fromConfig && toConfig && (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
                  fromConfig.badgeClass
                )}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: fromConfig.dotColor }}
                />
                {fromConfig.label}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
                  toConfig.badgeClass
                )}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: toConfig.dotColor }}
                />
                {toConfig.label}
              </span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Adicione um comentário
              <span className="text-orange-500 ml-0.5">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => {
                setComment(e.target.value)
                if (error) setError('')
              }}
              placeholder="Descreva o motivo desta mudança de status..."
              rows={4}
              className={cn(
                'w-full rounded-lg border text-sm px-3 py-2.5 text-gray-900 placeholder:text-gray-400 resize-none outline-none transition-colors',
                error
                  ? 'border-red-300 bg-red-50 focus:border-red-400'
                  : 'border-gray-200 bg-white focus:border-orange-400'
              )}
              aria-invalid={!!error}
              aria-describedby={error ? 'comment-error' : undefined}
            />
            {error && (
              <p id="comment-error" className="mt-1 text-xs text-red-500">
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <Button variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm}>Confirmar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
